import { Octokit } from '@octokit/rest';
import { env } from '../config/env';
import { GitHubRepoSummary } from '@portfolioiq/shared';

// Exponential backoff with jitter for rate limit handling
const withBackoff = async <T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      const isRateLimit = error.status === 429 || error.status === 403;
      if (!isRateLimit) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 32000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export const fetchTopRepos = async (
  username: string,
  accessToken?: string
): Promise<GitHubRepoSummary[]> => {
  if (!accessToken) {
    throw { status: 401, message: 'GitHub access token is required' };
  }
  const octokit = new Octokit({ auth: accessToken });

  const { data: repos } = await withBackoff(() =>
    octokit.rest.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 5,
      type: 'owner',
    })
  );

  const repoDetails = await Promise.all(
    repos.map(async (repo) => {
      let readme = '';
      try {
        const { data } = await withBackoff(() =>
          octokit.rest.repos.getReadme({ owner: username, repo: repo.name })
        );
        readme = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 500);
      } catch {
        readme = 'No README found.';
      }
      return {
        repoName: repo.name,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count || 0,
        description: repo.description || '',
        readme,
      };
    })
  );

  return repoDetails;
};

export default { fetchTopRepos };
