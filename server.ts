import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { createRequire } from "module";
import { PDFDocument, PDFName, PDFRawStream, PDFDict } from "pdf-lib";
import { PDFParse } from "pdf-parse";

const require = createRequire(import.meta.url);

// Dynamic Client Instance Registries to handle user keys and fallbacks
let geminiClients: Record<string, GoogleGenAI> = {};

function getGoogleGenAI(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please define it in your environment secrets or provide it in the settings panel."
    );
  }
  if (!geminiClients[key]) {
    geminiClients[key] = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClients[key];
}

function getOpenAI(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is missing. Please define it in your environment secrets or provide it in the settings panel."
    );
  }
  return new OpenAI({ apiKey: key });
}

function getAnthropic(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing. Please define it in your environment secrets or provide it in the settings panel."
    );
  }
  return new Anthropic({ apiKey: key });
}

// Robust text cleaner and JSON parser for LLM outputs
function cleanAndParseJSON(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```xml")) {
    cleanText = cleanText.substring(6);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  return JSON.parse(cleanText);
}

// PDF text extractor helper
async function extractPdfText(base64Data: string): Promise<string> {
  let parser: PDFParse | null = null;
  try {
    const buffer = Buffer.from(base64Data, "base64");
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text || "";
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to extract text from PDF: " + error.message);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {
        console.error("Error destroying PDFParse instance:", e);
      }
    }
  }
}

// PDF image extractor helper using pdf-parse
async function extractPdfImage(base64Data: string): Promise<string | undefined> {
  let parser: PDFParse | null = null;
  try {
    const buffer = Buffer.from(base64Data, "base64");
    parser = new PDFParse({ data: buffer });
    // Extract images with threshold 50 to capture profile picture correctly
    const imageResult = await parser.getImage({
      first: 1, // Look at page 1 where profile photo is usually placed
      imageThreshold: 50,
      imageDataUrl: true,
      imageBuffer: false,
    });
    
    for (const page of imageResult.pages) {
      if (page.images && page.images.length > 0) {
        return page.images[0].dataUrl;
      }
    }
  } catch (error) {
    console.error("Failed to extract images from PDF using pdf-parse:", error);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {
        console.error("Error destroying PDFParse instance during image extraction:", e);
      }
    }
  }
  return undefined;
}

// System prompt instructing OpenAI and Claude to return the precise schema
const openaiSystemPrompt = `You are an expert executive recruiter and talent assessor. Act as a top-tier corporate recruiter. When presented with a candidate resume, extract all biographical details, experiences, educations, skills, projects, and certifications precisely. Translate any vague fields into structured blocks. Rate the profile on a scale from 1 to 5 stars, suggest suitable corporate job titles, highlight strengths, pinpoint potential growth areas, and write 3-4 custom interview questions tailored to their background.

You MUST return ONLY a raw valid JSON object matching this schema. Do not include any wrapping text, markdown blocks, conversational statements, or explanations. Start with '{' and end with '}'.

Schema:
{
  "avatarSvg": "A beautifully styled, high-fidelity professional SVG avatar/portrait representing the candidate. It MUST be valid raw '<svg viewBox=\\"0 0 120 120\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>' code. Use gradient backgrounds, professional attire, friendly styled features. Keep code clean and efficient (under 4KB). Do not wrap with markdown backticks.",
  "personalInfo": {
    "name": "Candidate full name",
    "email": "Primary email address",
    "phone": "Contact phone number",
    "linkedin": "LinkedIn profile URL if available",
    "github": "GitHub profile URL if available",
    "website": "Portfolio or personal website URL if available",
    "location": "City, State or Country",
    "currentTitle": "Current professional title (e.g., Software Engineer II)"
  },
  "summary": "A compelling 3-4 sentence professional summary of the candidate",
  "workExperience": [
    {
      "jobTitle": "Title held",
      "company": "Name of company or organization",
      "startDate": "Starting date (e.g. June 2021)",
      "endDate": "Ending date (e.g. Present or Dec 2024)",
      "location": "Job location (City, State or Remote)",
      "description": "Summary of responsibilities and achievements",
      "achievements": ["List of 3-5 specific, bulleted key accomplishments"]
    }
  ],
  "education": [
    {
      "degree": "Degree obtained (e.g. Bachelor of Science)",
      "fieldOfStudy": "Field of study (e.g. Computer Science)",
      "institution": "Name of University/College",
      "graduationYear": "Year of graduation",
      "location": "Institution location",
      "grade": "GPA, Honors, or Marks if available"
    }
  ],
  "skills": [
    {
      "category": "Category name (e.g., Languages, Frameworks, Soft Skills)",
      "list": ["Specific skills in this category"]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year earned"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project summary",
      "technologies": ["Technologies, languages, or tools used"],
      "url": "Link to project, repository, or demo if available"
    }
  ],
  "assessment": {
    "overallRating": 4, // integer rating 1 to 5
    "matchingRoles": ["List of job titles/roles this candidate is highly qualified for"],
    "keyStrengths": ["Top 3-4 professional strengths highlighted in their background"],
    "areasForGrowth": ["Skills or experiences they are missing or should improve upon"],
    "culturalFit": "Brief analysis of candidate's working style and culture fit",
    "suggestedQuestions": ["3-4 personalized, deep-dive interview questions specifically tailored to evaluate their claims or experience"]
  }
}`;

// Strictly defined schema for the Candidate Profile JSON response from Gemini
const candidateSchema = {
  type: Type.OBJECT,
  properties: {
    avatarSvg: {
      type: Type.STRING,
      description: "A beautifully styled, high-fidelity professional SVG avatar/portrait representing the candidate. If the resume has a profile photo, analyze its features (gender, hair color/style, clothing, glasses, background, etc.) and recreate it elegantly as a clean modern SVG. If no photo is found, generate a highly custom modern flat-vector portrait that suits their professional profile, seniority, and general background. The SVG MUST be valid raw '<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>' code without any markdown block wrappers, comments, or backticks. It must feature premium colors, gradient backgrounds (e.g., modern dark blue, purple, or warm teal), professional corporate attire (e.g. blazer, collared shirt), and friendly styled features. Keep code clean and efficient (under 4KB)."
    },
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Candidate full name" },
        email: { type: Type.STRING, description: "Primary email address" },
        phone: { type: Type.STRING, description: "Contact phone number" },
        linkedin: { type: Type.STRING, description: "LinkedIn profile URL if available" },
        github: { type: Type.STRING, description: "GitHub profile URL if available" },
        website: { type: Type.STRING, description: "Portfolio or personal website URL if available" },
        location: { type: Type.STRING, description: "City, State or Country" },
        currentTitle: { type: Type.STRING, description: "Current professional title (e.g., Software Engineer II)" },
      },
      required: ["name"],
    },
    summary: { type: Type.STRING, description: "A compelling 3-4 sentence professional summary of the candidate" },
    workExperience: {
      type: Type.ARRAY,
      description: "List of work experience entries in reverse chronological order",
      items: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING, description: "Title held" },
          company: { type: Type.STRING, description: "Name of company or organization" },
          startDate: { type: Type.STRING, description: "Starting date (e.g. June 2021)" },
          endDate: { type: Type.STRING, description: "Ending date (e.g. Present or Dec 2024)" },
          location: { type: Type.STRING, description: "Job location (City, State or Remote)" },
          description: { type: Type.STRING, description: "Summary of responsibilities and achievements" },
          achievements: {
            type: Type.ARRAY,
            description: "List of 3-5 specific, bulleted key accomplishments",
            items: { type: Type.STRING },
          },
        },
        required: ["jobTitle", "company", "startDate", "endDate", "description"],
      },
    },
    education: {
      type: Type.ARRAY,
      description: "Academic history entries",
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING, description: "Degree obtained (e.g. Bachelor of Science)" },
          fieldOfStudy: { type: Type.STRING, description: "Field of study (e.g. Computer Science)" },
          institution: { type: Type.STRING, description: "Name of University/College" },
          graduationYear: { type: Type.STRING, description: "Year of graduation" },
          location: { type: Type.STRING, description: "Institution location" },
          grade: { type: Type.STRING, description: "GPA, Honors, or Marks if available" },
        },
        required: ["degree", "fieldOfStudy", "institution"],
      },
    },
    skills: {
      type: Type.ARRAY,
      description: "Categorized skills list",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category name (e.g., Languages, Frameworks, Cloud, Soft Skills)" },
          list: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific skills in this category",
          },
        },
        required: ["category", "list"],
      },
    },
    certifications: {
      type: Type.ARRAY,
      description: "Professional certifications or licenses",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Certification name" },
          issuer: { type: Type.STRING, description: "Issuing organization" },
          year: { type: Type.STRING, description: "Year earned" },
        },
        required: ["name", "issuer"],
      },
    },
    projects: {
      type: Type.ARRAY,
      description: "Noteworthy projects completed by the candidate",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Project name" },
          description: { type: Type.STRING, description: "Project summary" },
          technologies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Technologies, languages, or tools used in this project",
          },
          url: { type: Type.STRING, description: "Link to project, repository, or demo if available" },
        },
        required: ["name", "description"],
      },
    },
    assessment: {
      type: Type.OBJECT,
      description: "Recruiter-focused automated profile assessment",
      properties: {
        overallRating: { type: Type.INTEGER, description: "Rating from 1 (poor fit) to 5 (excellent fit)" },
        matchingRoles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of job titles/roles this candidate is highly qualified for",
        },
        keyStrengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Top 3-4 professional strengths highlighted in their background",
        },
        areasForGrowth: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Skills or experiences they are missing or should improve upon based on standard job demands",
        },
        culturalFit: { type: Type.STRING, description: "Brief analysis of candidate's working style and culture fit" },
        suggestedQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-4 personalized, deep-dive interview questions specifically tailored to evaluate their claims or experience",
        },
      },
      required: ["overallRating", "matchingRoles", "keyStrengths", "areasForGrowth", "suggestedQuestions"],
    },
  },
  required: ["personalInfo", "summary", "workExperience", "education", "skills", "assessment", "avatarSvg"],
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON & URLencoded middleware with increased limits to support base64 uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API endpoint for resume extraction with Multi-Provider Support
  app.post("/api/extract", async (req, res) => {
    try {
      const { filename, fileType, base64Data, provider = "gemini", model, apiKey } = req.body;

      if (!base64Data) {
        res.status(400).json({ error: "Missing resume file content" });
        return;
      }

      let extractedText = "";
      let isDocx = false;
      let extractedPhoto: string | undefined = undefined;

      // Handle file format preprocessing to get extractedText if needed
      if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        filename?.endsWith(".docx")
      ) {
        isDocx = true;
        const buffer = Buffer.from(base64Data, "base64");
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;

        // Try extracting embedded images from DOCX
        try {
          const docxImages: string[] = [];
          await mammoth.convertToHtml({ buffer }, {
            convertImage: mammoth.images.imgElement(function(image) {
              return image.read("base64").then(function(imageBuffer) {
                const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
                docxImages.push(dataUrl);
                return { src: dataUrl };
              });
            })
          });
          if (docxImages.length > 0) {
            extractedPhoto = docxImages[0];
          }
        } catch (imgError) {
          console.error("Failed to extract images from DOCX:", imgError);
        }
      } else if (fileType === "text/plain" || filename?.endsWith(".txt")) {
        extractedText = Buffer.from(base64Data, "base64").toString("utf-8");
      } else if (fileType === "application/pdf" || filename?.endsWith(".pdf")) {
        // Try extracting embedded images from PDF
        extractedPhoto = await extractPdfImage(base64Data);
        // If we are not using Gemini, or if we want a fallback text representation, extract PDF text
        if (provider !== "gemini") {
          extractedText = await extractPdfText(base64Data);
        }
      }

      let parsedProfile;

      if (provider === "openai") {
        const selectedModel = model || "gpt-4o-mini";
        console.log(`Extracting using OpenAI model: ${selectedModel}`);
        
        // Ensure we have extractedText (if PDF was loaded, we parsed it with extractPdfText above)
        if (!extractedText && (fileType === "application/pdf" || filename?.endsWith(".pdf"))) {
          extractedText = await extractPdfText(base64Data);
        }

        const openai = getOpenAI(apiKey);
        const response = await openai.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: openaiSystemPrompt,
            },
            {
              role: "user",
              content: `Please parse and analyze the following resume content:\n\n${extractedText || "Empty resume file content."}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Failed to receive a valid parsing response from OpenAI.");
        }
        parsedProfile = cleanAndParseJSON(content);

      } else if (provider === "claude") {
        const selectedModel = model || "claude-3-5-sonnet-latest";
        console.log(`Extracting using Claude model: ${selectedModel}`);

        // Ensure we have extractedText (if PDF was loaded, we parsed it with extractPdfText above)
        if (!extractedText && (fileType === "application/pdf" || filename?.endsWith(".pdf"))) {
          extractedText = await extractPdfText(base64Data);
        }

        const anthropic = getAnthropic(apiKey);
        const response = await anthropic.messages.create({
          model: selectedModel,
          max_tokens: 4000,
          system: openaiSystemPrompt + "\n\nCRITICAL: Return ONLY raw, valid JSON. Do not include any conversational text, introductory statements, or explanations. Start with '{' and end with '}'.",
          messages: [
            {
              role: "user",
              content: `Please parse and analyze the following resume content:\n\n${extractedText || "Empty resume file content."}`,
            },
          ],
        });

        const block = response.content[0];
        if (!block || block.type !== "text") {
          throw new Error("Failed to receive a valid text response from Claude.");
        }
        parsedProfile = cleanAndParseJSON(block.text);

      } else {
        // Default to Gemini
        const selectedModel = model || "gemini-3.5-flash";
        console.log(`Extracting using Gemini model: ${selectedModel}`);
        const ai = getGoogleGenAI(apiKey);
        let response;

        // If PDF, leverage Gemini's native PDF document understanding by passing the file as inlineData
        if (fileType === "application/pdf" || filename?.endsWith(".pdf")) {
          const pdfPart = {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          };
          const textPart = {
            text: "You are an expert executive recruiter and talent assessor. Analyze the uploaded PDF resume, extract all details accurately, and generate a comprehensive candidate profile. Also, evaluate the profile and populate the 'assessment' section with professional feedback."
          };

          response = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts: [pdfPart, textPart] },
            config: {
              responseMimeType: "application/json",
              responseSchema: candidateSchema,
              systemInstruction:
                "Act as a top-tier corporate recruiter. When presented with a candidate resume, extract all biographical details, experiences, educations, skills, projects, and certifications precisely. Translate any vague fields into structured blocks. Rate the profile on a scale from 1 to 5 stars, suggest suitable corporate job titles, highlights strengths, pinpoint potential growth areas, and write 3-4 custom interview questions tailored to their background.",
            },
          });
        } else {
          // Otherwise, process as plain text extracted from DOCX/TXT
          const textToAnalyze = extractedText || "Empty resume file content.";
          response = await ai.models.generateContent({
            model: selectedModel,
            contents: [
              {
                text: `You are an expert executive recruiter and talent assessor. Analyze the following resume text, extract all details accurately, and generate a comprehensive candidate profile. Also, evaluate the profile and populate the 'assessment' section with professional feedback.\n\n--- RESUME TEXT ---\n${textToAnalyze}`,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: candidateSchema,
              systemInstruction:
                "Act as a top-tier corporate recruiter. When presented with a candidate resume, extract all biographical details, experiences, educations, skills, projects, and certifications precisely. Translate any vague fields into structured blocks. Rate the profile on a scale from 1 to 5 stars, suggest suitable corporate job titles, highlights strengths, pinpoint potential growth areas, and write 3-4 custom interview questions tailored to their background.",
            },
          });
        }

        if (!response || !response.text) {
          throw new Error("Failed to receive a valid parsing response from Gemini.");
        }

        parsedProfile = cleanAndParseJSON(response.text);
      }

      if (parsedProfile && typeof parsedProfile === "object") {
        if (extractedPhoto) {
          parsedProfile.customPhoto = extractedPhoto;
        }
      }

      res.json(parsedProfile);
    } catch (error: any) {
      console.error("Resume Extraction Error:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred during resume extraction.",
      });
    }
  });

  // Serve static assets in production, otherwise mount Vite in middleware mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA catch-all (Express v4 style)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Candidate Profile Extractor server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
