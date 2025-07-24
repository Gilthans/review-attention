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
    const latestPRs = [];
    for (const repo of configuration.RepositorySelection.IndividualRepos) {
      latestPRs.push(
        ...(await octokit.paginate(
          `GET /repos/${repo.owner}/${repo.name}/pulls?per_page=100`,
          {
            headers: {
              Authorization: `token ${configuration.GithubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        ))
      );
    }
    UpdateState({
      repos: configuration.RepositorySelection.IndividualRepos,
      latestPRs: latestPRs,
      lastUpdateTime: new Date(),
      isUpdateInProgress: false,
    });
  } catch (error) {
    // TODO: Catch errors by repo individually
    UpdateState({ latestError: error, isUpdateInProgress: false });
    console.log('error:(', error);
  }
}

GetConfig().then((config) => {
  fetchPRs(config);
  setInterval(() => GetConfig().then(fetchPRs), 60000);
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
