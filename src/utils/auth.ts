import { Octokit } from 'octokit';

const octokit = new Octokit({});

let authenticatedLogin: string | null = null;
let authenticatedLoginFetchedAt: number | null = null;
let token: string | null = null;

async function fetchAuthenticatedUser(): Promise<void> {
  const now = Date.now();
  // Refresh if never fetched or older than 15 minutes (900000 ms)
  if (
    !authenticatedLogin ||
    !authenticatedLoginFetchedAt ||
    now - authenticatedLoginFetchedAt > 900000
  ) {
    if (!token) return;
    try {
      const { data } = await octokit.request('GET /user', {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      authenticatedLogin = data.login;
      authenticatedLoginFetchedAt = now;
    } catch (error) {
      authenticatedLogin = null;
      authenticatedLoginFetchedAt = null;
    }
  }
}

chrome.storage.sync.get(['GITHUB_TOKEN'], (config) => {
  token = config.GITHUB_TOKEN || '';
  fetchAuthenticatedUser();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'GITHUB_TOKEN') {
      token = newValue || '';
      authenticatedLogin = null;
      authenticatedLoginFetchedAt = null;
      fetchAuthenticatedUser();
    }
  }
});

export default async function getAuthenticatedUser(): Promise<string | null> {
  await fetchAuthenticatedUser();
  return authenticatedLogin;
}
