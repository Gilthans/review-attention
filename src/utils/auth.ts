import { Configuration, GetConfig, OnConfigChange } from '@utils/config.ts';
import { Octokit } from 'octokit';

const octokit = new Octokit({});

let authenticatedLogin: string | null = null;
let authenticatedLoginFetchedAt: number | null = null;

async function fetchAuthenticatedUser(config: Configuration): Promise<string> {
  try {
    const { data } = await octokit.request('GET /user', {
      headers: {
        Authorization: `token ${config.GithubToken}`,
      },
    });
    authenticatedLogin = data.login;
    if (!authenticatedLogin) {
      throw new Error('Authenticated user login is empty.');
    }
    authenticatedLoginFetchedAt = Date.now();
    return authenticatedLogin;
  } catch (error) {
    console.error('Failed loading authenticated user...');
    authenticatedLogin = null;
    authenticatedLoginFetchedAt = null;
    throw error;
  }
}

GetConfig().then(fetchAuthenticatedUser);
OnConfigChange(fetchAuthenticatedUser);

export default async function getAuthenticatedUser(): Promise<string> {
  const now = Date.now();
  // Refresh if never fetched or older than 15 minutes (900000 ms)
  if (
    authenticatedLogin &&
    authenticatedLoginFetchedAt &&
    now - authenticatedLoginFetchedAt > 900000
  )
    return authenticatedLogin;
  const config = await GetConfig();
  if (!config.GithubToken) throw new Error('GitHub token is not configured.');

  return fetchAuthenticatedUser(config);
}
