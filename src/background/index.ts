import { Configuration, GetConfig, OnConfigChange } from '@utils/config.ts';
import { Octokit } from 'octokit';

const octokit = new Octokit({});

let latestPRs: unknown[] = [];
let latestError: string | null = null;

async function fetchPRs(configuration: Configuration) {
  console.log('Fetching PRs...');
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

GetConfig().then((config) => {
  fetchPRs(config);
  setInterval(() => fetchPRs(config), 10000);
});
OnConfigChange(fetchPRs);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PRS') {
    sendResponse({ error: latestError, prs: latestPRs });
    return true; // Indicates async response
  }
  return false;
});
