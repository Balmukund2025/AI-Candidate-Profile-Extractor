import { CandidateProfile } from "./types";

/**
 * Converts a standard HTML File object to a Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Strip out the data:URL prefix (e.g. "data:application/pdf;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as Base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Formats a date string into a highly readable human format
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Generates a clean, professionally-formatted Markdown summary of a candidate profile
 */
export function exportToMarkdown(profile: CandidateProfile): string {
  let md = `# Candidate Profile: ${profile.personalInfo.name}
**Parsed from:** ${profile.filename} | **Uploaded:** ${formatDate(profile.uploadedAt)}

## 📋 Contact Information
- **Current Title:** ${profile.personalInfo.currentTitle || "N/A"}
- **Email:** ${profile.personalInfo.email || "N/A"}
- **Phone:** ${profile.personalInfo.phone || "N/A"}
- **Location:** ${profile.personalInfo.location || "N/A"}
${profile.personalInfo.linkedin ? `- **LinkedIn:** ${profile.personalInfo.linkedin}\n` : ""}${profile.personalInfo.github ? `- **GitHub:** ${profile.personalInfo.github}\n` : ""}${profile.personalInfo.website ? `- **Website:** ${profile.personalInfo.website}\n` : ""}

## 🌟 Recruiter Assessment & AI Evaluation
- **Overall Match Rating:** ${"★".repeat(profile.assessment.overallRating)}${"☆".repeat(5 - profile.assessment.overallRating)} (${profile.assessment.overallRating}/5)
- **Primary Matching Roles:** ${profile.assessment.matchingRoles.join(", ")}

### 📈 Key Strengths:
${profile.assessment.keyStrengths.map((s) => `1. ${s}`).join("\n")}

### ⚠️ Areas for Growth & Upskilling:
${profile.assessment.areasForGrowth.map((g) => `1. ${g}`).join("\n")}

${profile.assessment.culturalFit ? `### 🤝 Cultural Fit Analysis:\n${profile.assessment.culturalFit}\n` : ""}

### 💬 Recommended Interview Questions:
${profile.assessment.suggestedQuestions.map((q) => `- "${q}"`).join("\n")}

## 📝 Professional Summary
${profile.summary}

## 💼 Work Experience
`;

  profile.workExperience.forEach((job) => {
    md += `### ${job.jobTitle} @ ${job.company}
*${job.startDate} – ${job.endDate} | ${job.location || "Remote"}*

${job.description}

${
  job.achievements && job.achievements.length > 0
    ? `**Key Accomplishments:**\n${job.achievements.map((ach) => `- ${ach}`).join("\n")}`
    : ""
}

`;
  });

  md += `## 🎓 Education
`;
  profile.education.forEach((edu) => {
    md += `- **${edu.degree} in ${edu.fieldOfStudy}** – ${edu.institution} (${edu.graduationYear || "N/A"}) ${edu.grade ? `*| ${edu.grade}*` : ""}
`;
  });

  if (profile.skills && profile.skills.length > 0) {
    md += `\n## 🛠️ Skills Inventory\n`;
    profile.skills.forEach((cat) => {
      md += `- **${cat.category}:** ${cat.list.join(", ")}\n`;
    });
  }

  if (profile.projects && profile.projects.length > 0) {
    md += `\n## 🚀 Selected Projects\n`;
    profile.projects.forEach((proj) => {
      md += `### ${proj.name}
${proj.description}
${proj.technologies ? `*Technologies:* ${proj.technologies.join(", ")}` : ""}
${proj.url ? `*Link:* [Project Website](${proj.url})` : ""}

`;
    });
  }

  if (profile.certifications && profile.certifications.length > 0) {
    md += `\n## 📜 Certifications\n`;
    profile.certifications.forEach((cert) => {
      md += `- **${cert.name}** – Issued by ${cert.issuer} ${cert.year ? `(${cert.year})` : ""}
`;
    });
  }

  return md;
}
