import { UpdateState } from '@utils/backgroundState.ts';
import { Configuration, GetConfig, OnConfigChange } from '@utils/config.ts';
import { Octokit } from 'octokit';

const octokit = new Octokit({});

async function fetchPRs(configuration: Configuration) {
  console.log('Fetching PRs...');
  if (!configuration.IsConfigured()) {
    UpdateState({
      latestError:
        'Configuration is missing. Please set up your GitHub repo and token.',
    });
    return;
  }
  try {
    UpdateState({ isUpdateInProgress: true });
    const latestPRs = await octokit.paginate(
      `GET /repos/${configuration.RepoOwner}/${configuration.RepoName}/pulls?per_page=100`,
      {
        headers: {
          Authorization: `token ${configuration.GithubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    UpdateState({
      latestPRs: latestPRs,
      lastUpdateTime: new Date(),
      isUpdateInProgress: false,
    });
  } catch (error) {
    UpdateState({ latestError: error, isUpdateInProgress: false });
    console.log('error:(', error);
  }
}

GetConfig().then((config) => {
  fetchPRs(config);
  setInterval(() => fetchPRs(config), 60000);
});
OnConfigChange(fetchPRs);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REFRESH_PRS') {
    console.log('Received REFRESH_PRS message');
    GetConfig().then((config) => {
      fetchPRs(config);
    });
    sendResponse();
    return true;
  }
  return false;
});
