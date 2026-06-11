import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User.model';

export interface AuthRequest extends Request {
  userId?: string;
  githubUsername?: string;
  isDemoMode?: boolean;
  githubAccessToken?: string;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized: Malformed token' });

  // Handle Recruiter Quick Demo token bypass
  if (token === 'demo-token') {
    try {
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
      req.userId = demoUser._id.toString();
      req.githubUsername = 'demo-user-git';
      req.isDemoMode = true;
      req.githubAccessToken = demoUser.githubAccessToken;
      return next();
    } catch (dbError: any) {
      return res.status(500).json({ success: false, error: 'Database error in demo auth flow: ' + dbError.message });
    }
  }

  try {
    const decoded = jwt.verify(token, env.NEXTAUTH_SECRET) as any;
    const githubId = decoded.sub;

    let user = await User.findOne({ githubId });
    if (!user) {
      const username = decoded.login || decoded.name || 'User';
      const email = decoded.email || `${username}@users.noreply.github.com`;
      const avatarUrl = decoded.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
      const githubAccessToken = decoded.accessToken || '';

      user = await User.create({
        githubId,
        username,
        email,
        avatarUrl,
        githubAccessToken,
      });
    } else {
      const githubAccessToken = decoded.accessToken || '';
      if (githubAccessToken && user.githubAccessToken !== githubAccessToken) {
        user.githubAccessToken = githubAccessToken;
        await user.save();
      }
    }

    req.userId = user._id.toString();
    req.githubUsername = decoded.login;
    req.isDemoMode = githubId === 'demo-user';
    req.githubAccessToken = user.githubAccessToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export default { requireAuth };
