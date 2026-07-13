import { CandidateProfile } from "./types";

export const sampleCandidate: CandidateProfile = {
  id: "sample-sarah-jenkins",
  filename: "Sarah_Jenkins_CV_2026.pdf",
  uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  avatarSvg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5" />
      <stop offset="100%" style="stop-color:#06B6D4" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="55" fill="url(#grad)" />
  <path d="M 25 105 C 25 85, 95 85, 95 105 Z" fill="#1E293B" />
  <path d="M 45 85 L 60 98 L 75 85 Z" fill="#F8FAFC" />
  <path d="M 52 85 L 60 95 L 68 85 Z" fill="#E2E8F0" />
  <rect x="53" y="72" width="14" height="15" fill="#FDBA74" />
  <circle cx="60" cy="52" r="22" fill="#FDBA74" />
  <circle cx="53" cy="50" r="2.5" fill="#1E293B" />
  <circle cx="67" cy="50" r="2.5" fill="#1E293B" />
  <path d="M 54 60 Q 60 65 66 60" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" fill="none" />
  <rect x="47" y="45" width="11" height="9" rx="2" fill="none" stroke="#1E293B" stroke-width="1.8" />
  <rect x="62" y="45" width="11" height="9" rx="2" fill="none" stroke="#1E293B" stroke-width="1.8" />
  <line x1="58" y1="49" x2="62" y2="49" stroke="#1E293B" stroke-width="1.8" />
  <line x1="42" y1="49" x2="47" y2="49" stroke="#1E293B" stroke-width="1.2" />
  <line x1="73" y1="49" x2="78" y2="49" stroke="#1E293B" stroke-width="1.2" />
  <path d="M 36 50 C 34 30, 86 30, 84 50 C 84 62, 78 68, 76 68 L 76 56 C 76 40, 44 40, 44 56 L 44 68 C 42 68, 36 62, 36 50 Z" fill="#334155" />
</svg>`,
  personalInfo: {
    name: "Sarah Jenkins",
    email: "sarah.jenkins@techdev.io",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA (Open to Hybrid/Remote)",
    currentTitle: "Lead Fullstack Engineer",
    linkedin: "https://linkedin.com/in/sarahjenkins-demo",
    github: "https://github.com/sarahj-dev-demo",
    website: "https://sarahjenkins.dev-demo",
  },
  summary: "Dynamic and results-driven Lead Fullstack Engineer with 8+ years of experience designing, building, and scaling cloud-native web applications. Proven track record of guiding cross-functional teams, implementing microservices architectures, and optimizing frontend performance. Passionate about modern JavaScript/TypeScript, cloud infrastructure (GCP/AWS), and mentoring junior engineers.",
  workExperience: [
    {
      jobTitle: "Lead Fullstack Engineer",
      company: "InnovateTech Solutions",
      startDate: "Jan 2023",
      endDate: "Present",
      location: "San Francisco, CA",
      description: "Direct a team of 6 engineers building an AI-powered data analytics platform. Spearhead architecture redesign using React, NestJS, and PostgreSQL, increasing application response times by 40% and cutting infrastructure expenses.",
      achievements: [
        "Led the successful migration of a legacy monolithic application to a modular microservices architecture on Google Kubernetes Engine (GKE).",
        "Designed and implemented high-performance real-time data streaming features using WebSockets and Redis, handling over 10,000 concurrent connections.",
        "Introduced rigorous CI/CD automation pipelines (GitHub Actions) reducing build-and-deploy cycle times by 35%.",
        "Established weekly technical workshops and paired programming initiatives, resulting in a 20% increase in team sprint velocity."
      ]
    },
    {
      jobTitle: "Senior Software Engineer",
      company: "CloudCore Systems",
      startDate: "Mar 2020",
      endDate: "Dec 2022",
      location: "Remote",
      description: "Maintained and scaled SaaS customer dashboard solutions using React, Node.js, and MongoDB. Owned end-to-end delivery of 3 major product features while improving database queries.",
      achievements: [
        "Re-engineered dashboard visualizers using D3.js and Tailwind CSS, improving render performance and WCAG 2.1 accessibility compliance.",
        "Refactored complex database schemas and aggregated pipeline queries, yielding a 50% improvement in API query speeds.",
        "Integrated multi-factor authentication (MFA) and granular RBAC security controls across 5 core enterprise customer tiers."
      ]
    },
    {
      jobTitle: "Full Stack Developer",
      company: "WebCraft Studio",
      startDate: "Jun 2018",
      endDate: "Feb 2020",
      location: "Austin, TX",
      description: "Developed and delivered responsive e-commerce web applications and custom content management systems for fortune 500 clients.",
      achievements: [
        "Built responsive e-commerce integrations with Stripe and headless Shopify APIs, driving up mobile conversion rates by 15%.",
        "Developed custom React component libraries used across 12 client projects to maintain style consistency and speed up delivery times."
      ]
    }
  ],
  education: [
    {
      degree: "Master of Science",
      fieldOfStudy: "Computer Science",
      institution: "Stanford University",
      graduationYear: "2018",
      location: "Stanford, CA",
      grade: "3.85 GPA"
    },
    {
      degree: "Bachelor of Science",
      fieldOfStudy: "Software Engineering",
      institution: "University of Texas",
      graduationYear: "2016",
      location: "Austin, TX",
      grade: "Magna Cum Laude"
    }
  ],
  skills: [
    {
      category: "Programming Languages",
      list: ["TypeScript", "JavaScript", "Go", "Python", "SQL", "HTML5/CSS3"]
    },
    {
      category: "Frameworks & Libraries",
      list: ["React", "Next.js", "Node.js", "Express", "NestJS", "Tailwind CSS", "Redux Toolkit"]
    },
    {
      category: "Databases & Storage",
      list: ["PostgreSQL", "MongoDB", "Redis", "Firebase Firestore", "Elasticsearch"]
    },
    {
      category: "Cloud & Devops",
      list: ["Google Cloud Platform (GCP)", "Docker", "Kubernetes", "GitHub Actions", "Terraform", "AWS"]
    },
    {
      category: "Professional & Soft",
      list: ["Agile/Scrum", "Team Leadership", "System Architecture", "Technical Mentoring", "Resource Planning"]
    }
  ],
  certifications: [
    {
      name: "Google Cloud Professional Cloud Architect",
      issuer: "Google Cloud",
      year: "2024"
    },
    {
      name: "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services",
      year: "2022"
    }
  ],
  projects: [
    {
      name: "AI Resume Scanner & Matcher",
      description: "An open-source HR analytics companion designed to score candidate resumes against complex job descriptions using local embedding search.",
      technologies: ["React", "TypeScript", "FastAPI", "VectorDB", "Tailwind"],
      url: "https://github.com/sarahj-dev-demo/ai-resume-matcher"
    },
    {
      name: "Serverless Real-time Chat Engine",
      description: "A highly-scalable serverless chat lobby application supporting custom chat rooms, rich text formats, and transient media uploads.",
      technologies: ["AWS Lambda", "API Gateway", "DynamoDB Streams", "React"],
      url: "https://chat-lobby-demo.dev"
    }
  ],
  assessment: {
    overallRating: 5,
    matchingRoles: ["Lead Fullstack Engineer", "Senior Software Architect", "Engineering Manager", "Technical Project Lead"],
    keyStrengths: [
      "Extensive full-stack proficiency pairing React/Next.js client-sides with robust NestJS/Node.js microservices.",
      "Hands-on architectural leadership containerizing architectures onto GKE and designing high-scale WebSocket pipelines.",
      "Academic excellence with an MS in Computer Science from Stanford University."
    ],
    areasForGrowth: [
      "Could deepen exposure in compiled backend languages like Rust or C++ if seeking high-performance embedded systems positions.",
      "Relatively limited direct budget-management or P&L experience, though has high technical leadership competency."
    ],
    culturalFit: "Exceptional team facilitator who champions paired programming and continuous knowledge sharing. Fits beautifully in collaborative, high-growth, modern cloud organizations.",
    suggestedQuestions: [
      "Can you walk us through your microservices redesign at InnovateTech? What was your rollback strategy and how did you minimize live downtime?",
      "How do you approach Paired Programming and technical mentoring when managing team members who are resistant to the practice?",
      "In your WebSockets and Redis streaming pipeline, how did you handle network latency fluctuations and potential redis cluster failovers?"
    ]
  }
};
