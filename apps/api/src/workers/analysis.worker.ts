import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { connectDB } from '../config/db';
import { Insight } from '../models/Insight.model';
import { Resume } from '../models/Resume.model';
import { User } from '../models/User.model';
import { fetchTopRepos } from '../services/github.service';
import { analyzeProfile } from '../services/gemini.service';

connectDB();

interface AnalysisJobData {
  insightId: string;
  resumeId: string;
  userId: string;
  targetJobTitle: string;
  targetJobDescription?: string;
  includeGithub: boolean;
}

const updateProgress = async (
  insightId: string,
  stage: string,
  progress: number,
  logMessage: string
) => {
  const timestamp = new Date().toISOString();
  const logWithTime = `[${timestamp}] ${logMessage}`;
  
  await Insight.findByIdAndUpdate(insightId, {
    currentStage: stage,
    progress,
    $push: { executionLogs: logWithTime }
  });
};

const worker = new Worker<AnalysisJobData>(
  'analysis',
  async (job: Job<AnalysisJobData>) => {
    const { insightId, resumeId, userId, targetJobTitle, targetJobDescription, includeGithub } = job.data;
    console.log(`Processing job ${job.id} for Insight ${insightId}`);

    try {
      // Stage 1 - Mark as processing, log start timestamp
      await Insight.findByIdAndUpdate(insightId, { status: 'processing' });
      await updateProgress(insightId, 'Initializing', 10, 'Analysis job initialized and parsed.');

      // Fetch resume rawMarkdown
      const resume = await Resume.findById(resumeId);
      if (!resume) throw new Error(`Resume ${resumeId} not found`);

      // Fetch User details
      const user = await User.findById(userId);
      if (!user) throw new Error(`User ${userId} not found`);

      // Stage 2 - (If includeGithub) Fetch top 5 repos via GitHub API
      let githubRepos = undefined;
      if (includeGithub && user.username) {
        await updateProgress(insightId, 'GitHub Audit', 30, `Fetching top 5 GitHub repositories for user ${user.username}...`);
        try {
          githubRepos = await fetchTopRepos(user.username, user.githubAccessToken);
          await updateProgress(
            insightId,
            'GitHub Audit',
            40,
            `Successfully audited ${githubRepos.length} GitHub repositories.`
          );
        } catch (githubError: any) {
          console.error(`GitHub fetch failed:`, githubError);
          await updateProgress(
            insightId,
            'GitHub Audit Warning',
            40,
            `Warning: Failed to fetch repositories (${githubError.message || githubError}). Proceeding with resume-only analysis.`
          );
        }
      } else {
        await updateProgress(insightId, 'GitHub Audit', 40, 'GitHub integration skipped.');
      }

      // Stage 3 - Build structured context for Gemini
      await updateProgress(insightId, 'Structuring Context', 50, 'Building context templates for the AI alignment model...');

      // Stage 4 - Call Gemini API
      await updateProgress(insightId, 'AI Alignment Analysis', 70, 'Querying Google Gemini to calculate matching rates and suggest bullet updates...');

      const analysisResult = await analyzeProfile({
        resumeMarkdown: resume.rawMarkdown,
        targetJobTitle,
        targetJobDescription,
        githubRepos,
      });

      // Stage 5 - Parse and validate Gemini JSON response
      await updateProgress(insightId, 'Validating Insights', 85, 'Validating structural format and keywords from AI output...');

      // Stage 6 - Persist analysis results to Insight document in MongoDB
      await updateProgress(insightId, 'Saving Results', 95, 'Storing processed results and suggested metrics in the database...');
      
      await Insight.findByIdAndUpdate(insightId, {
        analysis: analysisResult,
      });

      // Stage 7 - Mark status as 'completed', progress: 100
      await updateProgress(insightId, 'Completed', 100, 'Analysis completed successfully.');
      await Insight.findByIdAndUpdate(insightId, { status: 'completed' });
      
    } catch (error: any) {
      console.error(`Job failed: ${error.message}`);
      const timestamp = new Date().toISOString();
      const logWithTime = `[${timestamp}] Error: ${error.message}`;
      
      await Insight.findByIdAndUpdate(insightId, {
        status: 'failed',
        errorDetails: error.message || 'Unknown error occurred',
        currentStage: 'Failed',
        $push: { executionLogs: logWithTime }
      });
      throw error;
    }
  },
  {
    connection: redisConnection as any,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});
