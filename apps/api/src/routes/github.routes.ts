import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getGithubRepos, getGithubProfile } from '../controllers/github.controller';

const router = Router();

router.get('/repos', requireAuth, getGithubRepos);
router.get('/profile', requireAuth, getGithubProfile);

export default router;
