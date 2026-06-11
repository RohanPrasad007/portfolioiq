import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User.model';

const router = Router();

router.post('/sync', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Malformed token' });
  }

  // Handle Recruiter Quick Demo mode
  if (token === 'demo-token') {
    let demoUser = await User.findOne({ githubId: 'demo-user' });
    if (!demoUser) {
      demoUser = await User.create({
        githubId: 'demo-user',
        username: 'demo-user',
        email: 'recruiter-demo@portfolioiq.com',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUck5mQyC92oMTZRFMu4g179A-V89wUL1Vo28Om02gOnOqOAiP6Gl4UoRF4c_wjLxZO-MceUcf-sz6rmSaA9Ys48e3kGVRKdeNFW4YTg8jKU2mjenCZuKMSapSVaY-9o6FvQD4FQkMAnyoyNMUr-MrtGxRUZSwo8TkSPgzgZDT52VOGwiLLcBkRJn0BH7T2TUlxMgnIX54Y-StvpdLW2Ef9DgMvaaWDT9MF7y0B4CBuTkgP3iAM13Dh4rOrxZds60Z2tZkezaEKeo',
        githubAccessToken: 'demo-token',
      });
    }
    return res.status(200).json({ success: true, data: demoUser });
  }

  try {
    const decoded = jwt.verify(token, env.NEXTAUTH_SECRET) as any;
    const githubId = decoded.sub;
    const username = decoded.login || decoded.name || 'User';
    const email = decoded.email || `${username}@users.noreply.github.com`;
    const avatarUrl = decoded.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    const githubAccessToken = decoded.accessToken || '';

    const user = await User.findOneAndUpdate(
      { githubId },
      {
        username,
        email,
        avatarUrl,
        githubAccessToken,
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('Session sync error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;
