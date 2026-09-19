/**
 * Hugging Face Gemma service for CampusLink placement diagnostics and chat.
 */

const PRIMARY_GEMMA_MODEL = 'google/gemma-3-4b-it';
const CANDIDATE_MODELS = [
  'google/gemma-3-4b-it',
  'google/gemma-3-12b-it',
  'meta-llama/Llama-3.1-8B-Instruct',
];
const HF_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 25000;

export async function queryHuggingFaceGemma(messages, maxTokens = 600, temperature = 0.85) {
  const token = process.env.HF_TOKEN || '';
  if (!token) {
    return { success: false, text: null, isLive: false, reason: 'HF_TOKEN is missing in environment variables' };
  }

  const msgPayload = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];

  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const start = Date.now();

    try {
      const response = await fetch(HF_CHAT_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: msgPayload, max_tokens: maxTokens, temperature }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - start;

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        console.warn(`[HF Inference] ${model} returned HTTP ${response.status} (${details.slice(0, 100)}), trying next candidate...`);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      if (text) {
        console.log(`[HF Inference] Generated with ${model} in ${elapsed}ms (${text.length} chars)`);
        return { success: true, text, isLive: true, model };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - start;
      console.warn(`[HF Inference] ${model} error (${error.name === 'AbortError' ? 'Timed out' : error.message}) after ${elapsed}ms, trying next...`);
    }
  }

  return {
    success: false,
    text: null,
    isLive: false,
    reason: 'All inference model candidates timed out or were unreachable.',
  };
}

export async function analyzePlacementRiskAndGuidance(profileData) {
  const {
    collegeName = 'University', branch = 'Engineering', cgpa = 0, activeBacklogs = 0,
    skills = [], technicalScore = 50, aptitudeScore = 50, communicationScore = 50,
    projectScore = 50, overallReadiness = 50, readinessLevel = 'Developing',
    targetRoles = [], headline = '', summary = '', projects = [], experience = [],
    certifications = [], isVerified = false,
  } = profileData;
  const projectsList = Array.isArray(projects) ? projects : [];
  const experienceList = Array.isArray(experience) ? experience : [];
  const skillsList = Array.isArray(skills) ? skills : [];
  const prompt = `Analyze this campus placement candidate and return JSON only with keys aiReadinessSummary, isAtRisk, riskReason, mentorActionRecommendation, topSkillRecommendations.
Candidate: ${collegeName}, ${branch}, CGPA ${cgpa}, backlogs ${activeBacklogs}, readiness ${overallReadiness}% (${readinessLevel}), verified ${isVerified}.
Scores: technical ${technicalScore}, aptitude ${aptitudeScore}, communication ${communicationScore}, projects ${projectScore}.
Headline: ${headline}; Summary: ${summary}; Skills: ${skillsList.join(', ')}.
Projects: ${projectsList.map((item) => `${item.title || 'Project'} (${item.techStack || ''})`).join('; ') || 'None'}.
Experience: ${experienceList.map((item) => `${item.title || 'Role'} at ${item.subtitle || 'company'}`).join('; ') || 'None'}.
Certifications: ${Array.isArray(certifications) ? certifications.map((item) => item.title).join(', ') : 'None'}.
Target roles: ${Array.isArray(targetRoles) ? targetRoles.join(', ') : 'General placement roles'}.`;

  const liveResult = await queryHuggingFaceGemma([
    { role: 'system', content: 'You are a placement advisor. Return valid JSON only.' },
    { role: 'user', content: prompt },
  ], 650, 0.85);

  if (liveResult.isLive && liveResult.text) {
    try {
      const match = liveResult.text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : liveResult.text);
      return {
        aiReadinessSummary: parsed.aiReadinessSummary || '',
        isAtRisk: Boolean(parsed.isAtRisk),
        riskReason: parsed.riskReason || '',
        mentorActionRecommendation: parsed.mentorActionRecommendation || '',
        topSkillRecommendations: Array.isArray(parsed.topSkillRecommendations) ? parsed.topSkillRecommendations : [],
        model: liveResult.model,
        provider: `Hugging Face Gemma (${liveResult.model})`,
        status: 'live',
      };
    } catch {
      console.warn('[GemmaService] Live Gemma output was not valid JSON; using fallback.');
    }
  }

  const numericCgpa = Number(cgpa) || 0;
  const numericBacklogs = Number(activeBacklogs) || 0;
  const numericReadiness = Number(overallReadiness) || 50;
  const isAtRisk = numericBacklogs > 0 || numericCgpa < 6.5 || numericReadiness < 55;
  const riskReason = numericBacklogs > 0
    ? `${numericBacklogs} active backlog(s) may restrict placement eligibility.`
    : numericCgpa < 6.5
      ? `CGPA ${numericCgpa} is below the common 6.5 recruiter cutoff.`
      : numericReadiness < 55
        ? `Readiness score ${numericReadiness}% indicates a preparation gap.`
        : '';

  return {
    aiReadinessSummary: `${readinessLevel} placement readiness at ${numericReadiness}%. ${projectsList.length ? `The profile includes ${projectsList.length} project(s)` : 'Add detailed projects'}${experienceList.length ? ` and ${experienceList.length} experience record(s).` : '.'}`,
    isAtRisk,
    riskReason,
    mentorActionRecommendation: isAtRisk
      ? 'Clear eligibility blockers and complete targeted mock technical interviews with a faculty mentor.'
      : 'Continue system-design preparation and polish project demonstrations for priority recruitment drives.',
    topSkillRecommendations: ['Data Structures & Algorithms', 'System Design', 'REST API Security'],
    model: PRIMARY_GEMMA_MODEL,
    provider: 'Gemma Placement Intelligence Engine',
    status: 'fallback-active',
  };
}

export async function generateGemmaChatReply({ prompt, profile, drives = [], conflicts = [] }) {
  if (!prompt || !prompt.trim()) {
    return 'How can I assist you with campus recruitment, skill gaps, or interview prep today?';
  }

  const drivesContext = drives.slice(0, 4)
    .map((drive) => `${drive.companyName} (${drive.roleTitle}, ${drive.ctcLpa} LPA, minimum CGPA ${drive.eligibility?.minCgpa || 7.0})`)
    .join('; ') || 'No active drives';
  const profileContext = profile
    ? `CGPA: ${profile.cgpa || 'N/A'}, backlogs: ${profile.activeBacklogs || 0}, readiness: ${profile.overallReadiness || 50}%, skills: ${(profile.skills || []).join(', ')}`
    : 'General campus candidate';
  const liveResult = await queryHuggingFaceGemma([
    { role: 'system', content: `You are CampusLink AI, a concise placement advisor. Active drives: ${drivesContext}. Student: ${profileContext}. Schedule conflicts: ${conflicts.length}.` },
    { role: 'user', content: prompt },
  ], 450, 0.85);

  if (liveResult.isLive && liveResult.text) return liveResult.text;

  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('risk') || lowerPrompt.includes('at risk')) {
    return profile
      ? `**Placement risk:** ${profile.isAtRisk ? 'Your profile is currently flagged for attention.' : 'No major risk is currently flagged.'} Review CGPA, backlogs, and readiness scores in the Readiness tab.`
      : 'Save your academic details in the Readiness tab to receive a personalized placement risk assessment.';
  }
  if (lowerPrompt.includes('drive') || lowerPrompt.includes('eligible')) {
    return drives.length ? `Active drives: ${drivesContext}` : 'There are currently no active placement drives scheduled.';
  }
  if (lowerPrompt.includes('interview') || lowerPrompt.includes('prep')) {
    return 'Focus on data structures, system design, API design, clean code, and two timed mock interviews.';
  }
  if (lowerPrompt.includes('skill') || lowerPrompt.includes('gap')) {
    return 'Prioritize Data Structures & Algorithms, System Design, Docker, cloud fundamentals, and REST API security.';
  }
  return 'I can help analyze placement risk, drive eligibility, skill gaps, or technical interview preparation.';
}
