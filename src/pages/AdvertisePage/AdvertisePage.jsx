import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBullhorn, 
  FaChartLine, 
  FaMousePointer, 
  FaEye, 
  FaDollarSign, 
  FaPlus, 
  FaPlay, 
  FaPause, 
  FaTrash, 
  FaBuilding, 
  FaCheckCircle, 
  FaExternalLinkAlt, 
  FaRocket,
  FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './AdvertisePage.css';

const PRESET_CREATIVES = [
  {
    label: 'Modern Tech Workspace',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Engineering Team',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Global Innovation',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'High Performance Coding',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  },
];

const AdvertisePage = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'create'
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    totalSpend: 0,
    activeCampaigns: 0,
    avgCtr: '0.00',
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [previewType, setPreviewType] = useState('feed'); // 'feed' | 'sidebar'

  // Organizations list for dropdown
  const [userOrgs, setUserOrgs] = useState([]);

  // Campaign Form State
  const [formData, setFormData] = useState({
    name: 'Arcturus Growth & Talent Campaign',
    organizationName: 'Arcturus Connexa',
    organizationLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    organizationId: '',
    objective: 'brand_awareness',
    targetIndustry: 'Technology & Software',
    targetLocation: 'Worldwide',
    placement: 'both',
    headline: 'Accelerate Your Engineering Career with Arcturus Connexa',
    description: 'Join the next generation of digital innovators. Explore high-impact roles, collaborate on distributed systems, and grow your career with us.',
    mediaUrl: PRESET_CREATIVES[0].url,
    callToAction: 'Learn More',
    destinationUrl: '/jobs',
    dailyBudget: 25,
    totalBudget: 250,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch campaigns & summary
      const res = await fetch(buildApiUrl('/ads/my'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (data.summary) setSummary(data.summary);
      }

      // 2. Fetch user's organizations
      const orgRes = await fetch(buildApiUrl('/organizations/my'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        const list = orgData.organizations || [];
        setUserOrgs(list);
        if (list.length > 0) {
          const primary = list.find((o) => o.status === 'approved') || list[0];
          setFormData((prev) => ({
            ...prev,
            organizationName: primary.name,
            organizationLogo: primary.logo?.url || prev.organizationLogo,
            organizationId: primary._id,
            destinationUrl: `/company/${primary.slug || primary._id}`,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load campaigns data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOrgSelect = (orgId) => {
    const selected = userOrgs.find((o) => o._id === orgId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        organizationId: selected._id,
        organizationName: selected.name,
        organizationLogo: selected.logo?.url || prev.organizationLogo,
        destinationUrl: `/company/${selected.slug || selected._id}`,
      }));
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(buildApiUrl(`/ads/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Campaign is now ${nextStatus}`);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await fetch(buildApiUrl(`/ads/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Campaign deleted successfully');
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(buildApiUrl('/ads'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast('🚀 Campaign created and launched successfully!');
        setActiveTab('campaigns');
        loadData();
      } else {
        const errorData = await res.json();
        showToast(`Error: ${errorData.error || 'Failed to create campaign'}`);
      }
    } catch (err) {
      console.error('Failed to launch campaign:', err);
      showToast('Network error while launching campaign');
    }
  };

  return (
    <div className="advertisePageWrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="advertiseToast">
          <FaBullhorn size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="advertiseHeaderBar">
        <div className="advertiseHeaderLeft">
          <h1>
            <FaBullhorn color="#0a66c2" size={24} />
            Arcturus Campaign Manager
          </h1>
          <p>
            Reach targeted professionals, promote your brand, and recruit top talent on Arcturus Connexa.
          </p>
        </div>

        <div className="advertiseNavTabs">
          <button
            type="button"
            className={`advertiseTabBtn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <FaChartLine size={14} /> Campaigns Overview
          </button>

          <button
            type="button"
            className={`advertiseTabBtn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FaPlus size={13} /> Create Campaign
          </button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="adMetricCardsRow">
        <div className="adMetricCard">
          <div className="adMetricIconBox" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <FaEye size={22} />
          </div>
          <div className="adMetricInfo">
            <h4>Total Impressions</h4>
            <p>{summary.totalImpressions.toLocaleString()}</p>
          </div>
        </div>

        <div className="adMetricCard">
          <div className="adMetricIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
            <FaMousePointer size={20} />
          </div>
          <div className="adMetricInfo">
            <h4>Total Clicks</h4>
            <p>{summary.totalClicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="adMetricCard">
          <div className="adMetricIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FaChartLine size={20} />
          </div>
          <div className="adMetricInfo">
            <h4>Avg. Click-Through (CTR)</h4>
            <p>{summary.avgCtr}%</p>
          </div>
        </div>

        <div className="adMetricCard">
          <div className="adMetricIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <FaDollarSign size={22} />
          </div>
          <div className="adMetricInfo">
            <h4>Total Ad Spend</h4>
            <p>${summary.totalSpend.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* TAB 1: CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="adTableCard">
          <div className="adTableHeadingRow">
            <h2>Active & Recent Campaigns ({campaigns.length})</h2>
            <button
              type="button"
              className="advertiseTabBtn active"
              onClick={() => setActiveTab('create')}
            >
              <FaPlus size={12} /> New Campaign
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading campaign analytics...
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FaBullhorn size={44} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>No Campaigns Found</h3>
              <p style={{ margin: '0 0 20px' }}>
                Create your first targeted campaign to start displaying sponsored ads across the Arcturus platform.
              </p>
              <button
                type="button"
                className="advertiseTabBtn active"
                onClick={() => setActiveTab('create')}
              >
                Create Campaign Now
              </button>
            </div>
          ) : (
            <div className="adTableWrapper">
              <table className="adTable">
                <thead>
                  <tr>
                    <th>Campaign & Organization</th>
                    <th>Status</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Spend / Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const ctr =
                      c.metrics?.impressions > 0
                        ? ((c.metrics.clicks / c.metrics.impressions) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <tr key={c._id}>
                        <td>
                          <div className="adCampaignNameCell">
                            {c.organizationLogo ? (
                              <img
                                src={c.organizationLogo}
                                alt={c.organizationName}
                                className="adCampaignOrgLogo"
                              />
                            ) : (
                              <div
                                className="adCampaignOrgLogo"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe' }}
                              >
                                <FaBuilding size={16} color="#0a66c2" />
                              </div>
                            )}
                            <div>
                              <strong style={{ color: '#0f172a', display: 'block' }}>{c.name}</strong>
                              <small style={{ color: '#64748b' }}>
                                {c.organizationName} · {c.objective.replace('_', ' ')}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`adStatusPill ${c.status}`}>
                            {c.status === 'active' ? <FaPlay size={8} /> : <FaPause size={8} />}
                            {c.status}
                          </span>
                        </td>

                        <td><strong>{(c.metrics?.impressions || 0).toLocaleString()}</strong></td>
                        <td><strong>{(c.metrics?.clicks || 0).toLocaleString()}</strong></td>
                        <td>{ctr}%</td>

                        <td>
                          <div>
                            <strong>${(c.metrics?.spend || 0).toFixed(2)}</strong>
                            <small style={{ display: 'block', color: '#64748b', fontSize: '0.74rem' }}>
                              Budget: ${c.totalBudget} (${c.dailyBudget}/day)
                            </small>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="adActionBtn"
                              title={c.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                              onClick={() => handleStatusToggle(c._id, c.status)}
                            >
                              {c.status === 'active' ? <FaPause size={13} /> : <FaPlay size={13} color="#166534" />}
                            </button>

                            <button
                              type="button"
                              className="adActionBtn delete"
                              title="Delete Campaign"
                              onClick={() => handleDelete(c._id)}
                            >
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE CAMPAIGN WIZARD + LIVE PREVIEW */}
      {activeTab === 'create' && (
        <div className="adWizardGrid">
          {/* Left Column: Form Steps */}
          <div className="adWizardFormCard">
            <form onSubmit={handleCreateSubmit}>
              {/* Step 1: Objective */}
              <div className="adFormStep">
                <div className="adFormStepTitle">
                  <span className="adStepNumber">1</span>
                  <span>Campaign Goal & Objective</span>
                </div>

                <div className="adFormGroup">
                  <label>Campaign Title</label>
                  <input
                    type="text"
                    className="adInput"
                    placeholder="e.g. Q4 Senior Engineering Talent Drive"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="adObjectiveGrid">
                  {[
                    { id: 'brand_awareness', title: 'Brand Awareness', desc: 'Maximize views and expand industry presence' },
                    { id: 'website_visits', title: 'Website Visits', desc: 'Drive high-intent traffic to your landing page' },
                    { id: 'job_promotion', title: 'Job Promotion', desc: 'Promote open positions to candidates' },
                    { id: 'lead_generation', title: 'Lead Generation', desc: 'Capture business leads and client inquiries' },
                  ].map((obj) => (
                    <div
                      key={obj.id}
                      className={`adObjectiveCard ${formData.objective === obj.id ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, objective: obj.id })}
                    >
                      <div className="adObjectiveTitle">{obj.title}</div>
                      <div className="adObjectiveDesc">{obj.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Organization & Audience Targeting */}
              <div className="adFormStep">
                <div className="adFormStepTitle">
                  <span className="adStepNumber">2</span>
                  <span>Organization & Audience Targeting</span>
                </div>

                <div className="adFormGroup">
                  <label>Advertising Organization</label>
                  {userOrgs.length > 0 ? (
                    <select
                      className="adSelect"
                      value={formData.organizationId}
                      onChange={(e) => handleOrgSelect(e.target.value)}
                    >
                      {userOrgs.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name} ({org.status === 'approved' ? 'Verified' : 'Pending'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="adInput"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="Organization Name"
                      required
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="adFormGroup">
                    <label>Target Industry</label>
                    <select
                      className="adSelect"
                      value={formData.targetIndustry}
                      onChange={(e) => setFormData({ ...formData, targetIndustry: e.target.value })}
                    >
                      <option value="Technology & Software">Technology & Software</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                      <option value="Media & Creative">Media & Creative</option>
                      <option value="All Industries">All Industries</option>
                    </select>
                  </div>

                  <div className="adFormGroup">
                    <label>Target Location</label>
                    <select
                      className="adSelect"
                      value={formData.targetLocation}
                      onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                    >
                      <option value="Worldwide">Worldwide</option>
                      <option value="United States & Canada">United States & Canada</option>
                      <option value="Europe">Europe</option>
                      <option value="Asia Pacific">Asia Pacific</option>
                      <option value="Remote Only">Remote Only</option>
                    </select>
                  </div>
                </div>

                <div className="adFormGroup">
                  <label>Ad Placement</label>
                  <select
                    className="adSelect"
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  >
                    <option value="both">Feed Promoted Post & Right Sidebar Banner</option>
                    <option value="feed">Feed Promoted Post Only</option>
                    <option value="sidebar">Right Sidebar Banner Only</option>
                  </select>
                </div>
              </div>

              {/* Step 3: Creative & Copy */}
              <div className="adFormStep">
                <div className="adFormStepTitle">
                  <span className="adStepNumber">3</span>
                  <span>Ad Creative & Copy</span>
                </div>

                <div className="adFormGroup">
                  <label>Headline</label>
                  <input
                    type="text"
                    className="adInput"
                    placeholder="Short punchy headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    required
                  />
                </div>

                <div className="adFormGroup">
                  <label>Ad Body Copy</label>
                  <textarea
                    rows={3}
                    className="adTextarea"
                    placeholder="Explain what your organization offers or what candidates will gain..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="adFormGroup">
                  <label>Creative Media / Banner Image</label>
                  <input
                    type="url"
                    className="adInput"
                    placeholder="https://..."
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  />

                  <div style={{ marginTop: 8 }}>
                    <small style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Or choose a curated professional preset:
                    </small>
                    <div className="adPresetPhotosRow">
                      {PRESET_CREATIVES.map((preset, idx) => (
                        <img
                          key={idx}
                          src={preset.url}
                          alt={preset.label}
                          className={`adPresetPhotoThumb ${formData.mediaUrl === preset.url ? 'selected' : ''}`}
                          title={preset.label}
                          onClick={() => setFormData({ ...formData, mediaUrl: preset.url })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="adFormGroup">
                    <label>Call to Action Button</label>
                    <select
                      className="adSelect"
                      value={formData.callToAction}
                      onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                    >
                      <option value="Learn More">Learn More</option>
                      <option value="Apply Now">Apply Now</option>
                      <option value="Visit Website">Visit Website</option>
                      <option value="Sign Up">Sign Up</option>
                    </select>
                  </div>

                  <div className="adFormGroup">
                    <label>Destination Link</label>
                    <input
                      type="text"
                      className="adInput"
                      placeholder="/jobs or https://..."
                      value={formData.destinationUrl}
                      onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Budget */}
              <div className="adFormStep">
                <div className="adFormStepTitle">
                  <span className="adStepNumber">4</span>
                  <span>Budget & Billing</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="adFormGroup">
                    <label>Daily Budget ($)</label>
                    <input
                      type="number"
                      min={5}
                      className="adInput"
                      value={formData.dailyBudget}
                      onChange={(e) => setFormData({ ...formData, dailyBudget: Number(e.target.value) })}
                    />
                  </div>

                  <div className="adFormGroup">
                    <label>Total Campaign Budget ($)</label>
                    <input
                      type="number"
                      min={10}
                      className="adInput"
                      value={formData.totalBudget}
                      onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="adSubmitBtn">
                <FaRocket size={15} /> Launch Ad Campaign
              </button>
            </form>
          </div>

          {/* Right Column: Interactive Live Preview */}
          <div>
            <div className="adLivePreviewCard">
              <div className="adPreviewTitleRow">
                <h3>Live Ad Preview</h3>
                <div className="adPreviewTypeToggle">
                  <button
                    type="button"
                    className={`adPreviewTypeBtn ${previewType === 'feed' ? 'active' : ''}`}
                    onClick={() => setPreviewType('feed')}
                  >
                    Feed Post
                  </button>
                  <button
                    type="button"
                    className={`adPreviewTypeBtn ${previewType === 'sidebar' ? 'active' : ''}`}
                    onClick={() => setPreviewType('sidebar')}
                  >
                    Sidebar Banner
                  </button>
                </div>
              </div>

              {previewType === 'feed' ? (
                /* Live Mock Feed Ad */
                <div className="mockFeedAd">
                  <div className="mockFeedHeader">
                    <img
                      src={formData.organizationLogo}
                      alt={formData.organizationName}
                      className="mockFeedOrgLogo"
                    />
                    <div className="mockFeedOrgMeta">
                      <div className="mockFeedOrgName">
                        {formData.organizationName}
                        <FaCheckCircle size={11} color="#166534" />
                      </div>
                      <div className="mockFeedSponsored">Promoted · {formData.targetIndustry}</div>
                    </div>
                  </div>

                  <div className="mockFeedBody">{formData.description}</div>

                  {formData.mediaUrl && (
                    <img
                      src={formData.mediaUrl}
                      alt="Campaign Banner"
                      className="mockFeedImage"
                    />
                  )}

                  <div className="mockFeedFooter">
                    <div className="mockFeedHeadline">{formData.headline}</div>
                    <button type="button" className="mockFeedCtaBtn">
                      {formData.callToAction}
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Mock Sidebar Ad */
                <div className="mockSidebarAd">
                  <img
                    src={formData.organizationLogo}
                    alt={formData.organizationName}
                    className="adLogo"
                  />
                  <h4>{formData.organizationName}</h4>
                  <p>{formData.headline}</p>
                  <button type="button" className="followBtn">
                    {formData.callToAction}
                  </button>
                </div>
              )}

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  Audience: {formData.targetIndustry} ({formData.targetLocation})
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisePage;

