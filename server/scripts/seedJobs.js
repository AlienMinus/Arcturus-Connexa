import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../db.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const JOBS_DATA = [
  {
    title: 'Senior Full Stack Engineer (React & Node.js)',
    company: 'Arcturus Labs',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Bengaluru, India',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '₹24,00,000 - ₹36,00,000 / yr',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'GraphQL', 'WebSockets'],
    description: 'We are seeking an experienced Full Stack Architect to build high-scale web experiences for the Arcturus social and developer platform. You will design resilient distributed services, collaborate with cross-functional engineering teams, and deliver robust real-time cloud features.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Staff Frontend Engineer (Next.js & Design Systems)',
    company: 'Aerial.Vue Global',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
    location: 'Remote, India',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    salary: '₹28,00,000 - ₹40,00,000 / yr',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux Toolkit', 'Web Vitals', 'Figma'],
    description: 'Join our product frontend team to create sleek, modern user interfaces with responsive animations, accessible component systems, and top-tier Core Web Vitals performance benchmarks.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'AI / ML Solutions Architect',
    company: 'DeepMind Innovations',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/8637/8637105.png',
    location: 'Hyderabad, India',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '₹32,00,000 - ₹48,00,000 / yr',
    skills: ['Python', 'PyTorch', 'LLMs', 'FastAPI', 'Docker', 'LangChain'],
    description: 'Design and deploy state-of-the-art multimodal AI workflows, vector embeddings, and autonomous agentic assistants across enterprise cloud platforms.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Product Designer (UI / UX & Design Systems)',
    company: 'Starlight Studio',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Mumbai, India',
    workplaceType: 'On-site',
    employmentType: 'Full-time',
    salary: '₹14,00,000 - ₹22,00,000 / yr',
    skills: ['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Wireframing'],
    description: 'We are seeking a talented UI/UX designer to craft intuitive user journeys, interactive design components, and pixel-perfect design tokens across web and mobile surfaces.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Senior DevOps & Cloud Infrastructure Engineer',
    company: 'Nexlify Cloud',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png',
    location: 'Pune, India',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    salary: '₹20,00,000 - ₹30,00,000 / yr',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Prometheus'],
    description: 'Maintain high availability multi-region infrastructure, automated CI/CD deployment pipelines, container orchestration, and zero-trust cloud security policies.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Backend Systems Engineer (Go / Distributed Systems)',
    company: 'FinPulse Systems',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png',
    location: 'Gurugram, India',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '₹26,00,000 - ₹38,00,000 / yr',
    skills: ['Golang', 'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'Microservices'],
    description: 'Build ultra low-latency financial transaction pipelines, distributed event brokers with Kafka, and resilient high-throughput microservices.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Mobile App Developer (React Native / Flutter)',
    company: 'Mobix Tech',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Remote, India',
    workplaceType: 'Remote',
    employmentType: 'Contract',
    salary: '₹12,00,000 - ₹18,00,000 / yr',
    skills: ['React Native', 'TypeScript', 'Redux', 'iOS', 'Android'],
    description: 'Deliver cross-platform mobile experiences for iOS and Android with smooth 60fps animations and offline-first data synchronization.',
    isActive: true,
    applicants: [],
  },
  {
    title: 'Software Engineering Intern (Summer 2026)',
    company: 'Arcturus Labs',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Bengaluru, India',
    workplaceType: 'Hybrid',
    employmentType: 'Internship',
    salary: '₹45,000 - ₹60,000 / mo',
    skills: ['JavaScript', 'React', 'Node.js', 'Git', 'Data Structures'],
    description: 'Jumpstart your career by collaborating closely with senior engineers on live social networking features, open-source modules, and web applications.',
    isActive: true,
    applicants: [],
  }
];

async function seedJobs() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB successfully!');

    // Find any existing user to assign as default recruiter if available
    const firstUser = await User.findOne().lean();
    const recruiterId = firstUser?._id || null;

    const jobsWithRecruiter = JOBS_DATA.map((job) => ({
      ...job,
      recruiterId: recruiterId,
    }));

    console.log('Clearing existing jobs collection (if any)...');
    await Job.deleteMany({});

    console.log('Inserting seed jobs into MongoDB collection "jobs"...');
    const insertedJobs = await Job.insertMany(jobsWithRecruiter);

    console.log(`Successfully seeded ${insertedJobs.length} jobs into the "jobs" collection! 🎉`);
    insertedJobs.forEach((j, i) => {
      console.log(` ${i + 1}. [${j.employmentType}] ${j.title} @ ${j.company} (${j.location})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error seeding jobs:', err);
    process.exit(1);
  }
}

seedJobs();

