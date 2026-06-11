import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Resume } from '../models/Resume.model';
import { Insight } from '../models/Insight.model';
import { uploadToCloudinary } from '../services/cloudinary.service';
import { parsePdf } from '../services/pdf.service';
import { analysisQueue } from '../queues/analysis.queue';
import { z } from 'zod';

const uploadAnalysisSchema = z.object({
  targetJobTitle: z.string().min(1, 'Target job title is required'),
  targetJobDescription: z.string().optional().default(''),
  includeGithub: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).default(true),
});

export const uploadAnalysis = async (req: AuthRequest, res: Response) => {
  // If demo mode, reject write operations
  if (req.isDemoMode) {
    return res.status(403).json({
      success: false,
      error: 'Write operations are disabled in demo mode. Sign in with GitHub to try for real.'
    });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const validation = uploadAnalysisSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0]?.message || 'Validation error'
      });
    }

    const { targetJobTitle, targetJobDescription, includeGithub } = validation.data;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User ID not found' });
    }

    // 1. Upload to Cloudinary
    let fileUrl = '';
    try {
      fileUrl = await uploadToCloudinary(req.file.buffer);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ success: false, error: 'Failed to upload PDF file to Cloudinary' });
    }

    // 2. Parse PDF to raw text
    let rawText = '';
    try {
      rawText = await parsePdf(req.file.buffer);
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      return res.status(500).json({ success: false, error: 'Failed to parse resume PDF structure' });
    }

    // 3. Create Resume document in MongoDB
    const resume = await Resume.create({
      userId,
      fileName: req.file.originalname,
      fileUrl,
      rawMarkdown: rawText,
    });

    // 4. Create Insight document with status 'pending'
    const insight = await Insight.create({
      userId,
      resumeId: resume._id,
      targetJobTitle,
      targetJobDescription,
      includeGithub,
      status: 'pending',
      progress: 0,
      currentStage: 'Queued',
      executionLogs: [`[${new Date().toISOString()}] Job added to pending analysis queue.`]
    });

    // 5. Dispatch job to BullMQ
    await analysisQueue.add(
      'analyze',
      {
        insightId: insight._id.toString(),
        resumeId: resume._id.toString(),
        userId: userId.toString(),
        targetJobTitle,
        targetJobDescription,
        includeGithub,
      }
    );

    // 6. Return 202
    return res.status(202).json({
      success: true,
      data: {
        insightId: insight._id,
      }
    });

  } catch (error: any) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

export const getJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const insight = await Insight.findById(id);

    if (!insight) {
      return res.status(404).json({ success: false, error: 'Analysis job not found' });
    }

    // Security check
    if (insight.userId.toString() !== req.userId && !req.isDemoMode) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: insight.status,
        progress: insight.progress,
        currentStage: insight.currentStage,
        logs: insight.executionLogs,
        error: insight.errorDetails,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getJobResults = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const insight = await Insight.findById(id).populate('resumeId');

    if (!insight) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    // Security check
    if (insight.userId.toString() !== req.userId && !req.isDemoMode) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (insight.status !== 'completed') {
      return res.status(400).json({ success: false, error: `Analysis status is ${insight.status}` });
    }

    return res.status(200).json({
      success: true,
      data: insight
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getJobHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const insights = await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('resumeId');

    const total = await Insight.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: {
        insights,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('getJobHistory error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  if (req.isDemoMode) {
    return res.status(403).json({
      success: false,
      error: 'Write operations are disabled in demo mode. Sign in with GitHub to try for real.'
    });
  }

  try {
    const { id } = req.params;
    const insight = await Insight.findById(id);

    if (!insight) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    if (insight.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await Insight.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
