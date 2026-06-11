import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { fetchTopRepos } from '../services/github.service';
import { Octokit } from '@octokit/rest';
import { env } from '../config/env';

export const getGithubRepos = async (req: AuthRequest, res: Response) => {
  try {
    const { githubUsername } = req;
    if (!githubUsername) {
      return res.status(400).json({ success: false, error: 'GitHub username not found in session' });
    }

    if (req.isDemoMode) {
      return res.status(200).json({
        success: true,
        data: [
          {
            repoName: 'stripe-dashboard-clone',
            language: 'TypeScript',
            stars: 45,
            description: 'A React clone of Stripe dashboard.',
            readme: 'stripe-dashboard-clone readme contents...'
          },
          {
            repoName: 'react-performance-utility',
            language: 'JavaScript',
            stars: 12,
            description: 'A utility to measure and optimize React render cycles.',
            readme: 'react-performance-utility readme...'
          },
          {
            repoName: 'graphql-telemetry-demo',
            language: 'TypeScript',
            stars: 8,
            description: 'A telemetry client for GraphQL endpoint metrics.',
            readme: 'graphql-telemetry-demo readme...'
          }
        ]
      });
    }

    const repos = await fetchTopRepos(githubUsername, req.githubAccessToken);
    return res.status(200).json({ success: true, data: repos });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getGithubProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { githubUsername } = req;
    
    if (!githubUsername) {
      return res.status(400).json({ success: false, error: 'GitHub username not found in session' });
    }
    
    if (req.isDemoMode) {
      return res.status(200).json({
        success: true,
        data: {
          username: 'arivera_dev',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUck5mQyC92oMTZRFMu4g179A-V89wUL1Vo28Om02gOnOqOAiP6Gl4UoRF4c_wjLxZO-MceUcf-sz6rmSaA9Ys48e3kGVRKdeNFW4YTg8jKU2mjenCZuKMSapSVaY-9o6FvQD4FQkMAnyoyNMUr-MrtGxRUZSwo8TkSPgzgZDT52VOGwiLLcBkRJn0BH7T2TUlxMgnIX54Y-StvpdLW2Ef9DgMvaaWDT9MF7y0B4CBuTkgP3iAM13Dh4rOrxZds60Z2tZkezaEKeo',
          location: 'San Francisco, CA',
          publicRepos: 42,
          totalStars: 1200,
          topLanguages: [
            { name: 'TypeScript', percentage: 64 },
            { name: 'Rust', percentage: 22 },
            { name: 'Python', percentage: 14 }
          ]
        }
      });
    }
    
    // Connect Octokit
    const token = req.githubAccessToken || env.GITHUB_TOKEN;
    const octokit = new Octokit({ auth: token });
    
    const { data: profile } = await octokit.rest.users.getByUsername({
      username: githubUsername,
    });
    console.log("This is the user ", profile);

    // Let's list some repos to calculate total stars and languages
    const { data: repos } = await octokit.rest.repos.listForUser({
      username: githubUsername,
      per_page: 30,
      sort: 'updated',
    });

    let totalStars = 0;
    const languageCounts: { [key: string]: number } = {};
    let totalLangs = 0;

    repos.forEach((repo) => {
      totalStars += repo.stargazers_count || 0;
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        totalLangs++;
      }
    });

    const topLanguages = Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        percentage: totalLangs > 0 ? Math.round((count / totalLangs) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      data: {
        username: profile.login,
        avatarUrl: profile.avatar_url,
        location: profile.location || 'Unknown',
        publicRepos: profile.public_repos,
        totalStars,
        topLanguages,
      },
    });
  } catch (error: any) {
    console.log("This is the user error ", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default { getGithubRepos, getGithubProfile };
