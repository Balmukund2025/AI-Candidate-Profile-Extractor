export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
  currentTitle?: string;
}

export interface EducationEntry {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear?: string;
  location?: string;
  grade?: string;
}

export interface WorkExperienceEntry {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string; // e.g. "Present" or "Dec 2024"
  location?: string;
  description: string;
  achievements?: string[];
}

export interface SkillCategory {
  category: string; // e.g. "Languages", "Frameworks & Libraries", "Tools & Platforms", "Soft Skills"
  list: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  year?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
}

export interface RecruiterAssessment {
  overallRating: number; // 1-5
  matchingRoles: string[];
  keyStrengths: string[];
  areasForGrowth: string[];
  culturalFit?: string;
  suggestedQuestions: string[];
}

export interface CandidateProfile {
  id: string; // Unique generated client-side id
  filename: string; // Original resume filename
  uploadedAt: string; // Timestamp
  avatarSvg?: string; // High-fidelity SVG representation of the candidate profile picture from resume or stylized
  customPhoto?: string; // Optional real base64-extracted profile picture from CV
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications?: CertificationEntry[];
  projects?: ProjectEntry[];
  assessment: RecruiterAssessment;
}
