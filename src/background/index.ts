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
  UpdateState({ isUpdateInProgress: true });
  const latestPRs = [];
  const errorsByRepo: Record<string, Error> = {};
  for (const repo of configuration.RepositorySelection.IndividualRepos) {
    try {
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
    } catch (error) {
      const repoTitle = `${repo.owner}/${repo.name}`;
      errorsByRepo[repoTitle] = error;
      console.log('Error with repo ', repoTitle, error, repo);
    }
  }

  chrome.action.setBadgeText({ text: latestPRs?.length.toString() });
  chrome.action.setBadgeBackgroundColor({ color: 'red' });
  chrome.action.setBadgeTextColor({ color: 'white' });

  UpdateState({
    repos: configuration.RepositorySelection.IndividualRepos,
    latestError: !errorsByRepo
      ? ''
      : Object.entries(errorsByRepo)
          .map(([repo, error]) => `${repo}: ${error}`)
          .join('\n'),
    latestPRs: latestPRs,
    lastUpdateTime: new Date(),
    isUpdateInProgress: false,
  });
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
