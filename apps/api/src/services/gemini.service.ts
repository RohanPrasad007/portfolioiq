import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { GeminiAnalysisResult, GitHubRepoSummary } from '@portfolioiq/shared';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY);

const SuggestedBulletPointSchema = z.object({
  original: z.string(),
  improved: z.string(),
  reason: z.string(),
});

const GithubAuditRepoSchema = z.object({
  repoName: z.string(),
  language: z.string(),
  stars: z.number(),
  findings: z.array(z.string()),
});

const GeminiAnalysisResultSchema = z.object({
  matchRate: z.number().int().min(0).max(100),
  foundKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestedBulletPoints: z.array(SuggestedBulletPointSchema),
  githubAudit: z.array(GithubAuditRepoSchema),
  portfolioCritique: z.string(),
  overallSummary: z.string(),
});

export const analyzeProfile = async (params: {
  resumeMarkdown: string;
  targetJobTitle: string;
  targetJobDescription?: string;
  githubRepos?: GitHubRepoSummary[];
}): Promise<GeminiAnalysisResult> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `
You are a senior technical recruiter and career coach AI. Analyze the provided developer profile.

You MUST respond ONLY with a valid JSON object. Do NOT include markdown code blocks, preamble, or any text outside the JSON object.

Return exactly this structure:
{
  "matchRate": <integer 0-100>,
  "foundKeywords": [<array of strings found in resume relevant to the job>],
  "missingKeywords": [<array of important keywords from job description NOT in resume>],
  "suggestedBulletPoints": [
    {
      "original": "<original resume bullet point>",
      "improved": "<improved version with stronger action verbs and measurable impact>",
      "reason": "<one sentence explaining the improvement>"
    }
  ],
  "githubAudit": [
    {
      "repoName": "<repo name>",
      "language": "<primary language>",
      "stars": <number>,
      "findings": ["<finding 1>", "<finding 2>"]
    }
  ],
  "portfolioCritique": "<2-3 paragraph overall portfolio critique>",
  "overallSummary": "<3-sentence executive summary of the candidate's fit>"
}

Rules:
- suggestedBulletPoints: provide 3-5 improvements. Only suggest bullets that exist verbatim or near-verbatim in the resume.
- missingKeywords: focus on technical skills, tools, and methodologies — not soft skills.
- matchRate: be accurate and critical. A resume with no job description match should score below 40.
- githubAudit: if no GitHub data provided, return an empty array.
`;

  const userContent = `
TARGET ROLE: ${params.targetJobTitle}

JOB DESCRIPTION:
${params.targetJobDescription || 'Not provided. Analyze based on job title only.'}

RESUME:
${params.resumeMarkdown}

GITHUB REPOSITORIES:
${params.githubRepos ? JSON.stringify(params.githubRepos, null, 2) : 'Not provided.'}
`;

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userContent }
  ]);

  const responseText = result.response.text().trim();
  
  // Strip any accidental markdown fences before parsing
  const cleanJson = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  
  try {
    const parsed = JSON.parse(cleanJson);
    // Validate with Zod schema before returning
    return GeminiAnalysisResultSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse or validate Gemini response:', responseText, error);
    throw new Error('Gemini model output did not match expected structure');
  }
};

export default { analyzeProfile };
