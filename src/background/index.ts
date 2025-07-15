import { Octokit } from 'octokit';

const octokit = new Octokit({});

class Configuration {
  IsConfigured(): boolean {
    return !!(this.RepoOwner && this.RepoName && this.GithubToken);
  }

  RepoOwner: string = '';

  RepoName: string = '';

  GithubToken: string = '';
}
const configuration: Configuration = new Configuration();

let latestPRs: unknown[] = [];
let latestError: string | null = null;

async function fetchPRs() {
  if (!configuration.IsConfigured()) {
    latestError =
      'Configuration is missing. Please set up your GitHub repo and token.';
    return;
  }
  try {
    latestPRs = await octokit.paginate(
      `GET /repos/${configuration.RepoOwner}/${configuration.RepoName}/pulls?per_page=100`,
      {
        headers: {
          Authorization: `token ${configuration.GithubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
  } catch (error) {
    latestError = `${error}`;
    console.log('error:(', error);
  }
}

function LoadConfig() {
  chrome.storage.sync.get(
    ['REPO_OWNER', 'REPO_NAME', 'GITHUB_TOKEN'],
    (config) => {
      configuration.RepoOwner = config.REPO_OWNER;
      configuration.RepoName = config.REPO_NAME;
      configuration.GithubToken = config.GITHUB_TOKEN;
      fetchPRs();
      setInterval(fetchPRs, 10000);
    }
  );
}

LoadConfig();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'REPO_OWNER') {
      configuration.RepoOwner = newValue || '';
    } else if (key === 'REPO_NAME') {
      configuration.RepoName = newValue || '';
    } else if (key === 'GITHUB_TOKEN') {
      configuration.GithubToken = newValue || '';
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PRS') {
    sendResponse({ error: latestError, prs: latestPRs });
    return true; // Indicates async response
  }
  if (message.type === 'CONFIGURE') {
    latestError = null;
    latestPRs = [];
    fetchPRs();
    sendResponse({});
    return true;
  }
  return false;
});
