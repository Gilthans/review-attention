import { useEffect, useState } from 'react';

export class RepositorySelection {
  RepoOwner: string = '';
  RepoName: string = '';
}

export class Configuration {
  IsConfigured(): boolean {
    return !!(
      this.RepositorySelection?.RepoOwner &&
      this.RepositorySelection?.RepoName &&
      this.GithubToken
    );
  }

  RepositorySelection: RepositorySelection = new RepositorySelection();

  GithubToken: string = '';
}

const currentConfig: Configuration = new Configuration();
const onChangeCallbacks: ((config: Configuration) => void)[] = [];
const initialConfigLoadPromise = new Promise<void>((resolve) => {
  chrome.storage.sync.get(
    ['REPO_OWNER', 'REPO_NAME', 'GITHUB_TOKEN'],
    (config) => {
      currentConfig.RepositorySelection.RepoOwner = config.REPO_OWNER;
      currentConfig.RepositorySelection.RepoName = config.REPO_NAME;
      currentConfig.GithubToken = config.GITHUB_TOKEN;
      resolve();
    }
  );
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;
  let changedMade = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'REPO_OWNER') {
      currentConfig.RepositorySelection.RepoOwner = newValue || '';
      changedMade = true;
    } else if (key === 'REPO_NAME') {
      currentConfig.RepositorySelection.RepoName = newValue || '';
      changedMade = true;
    } else if (key === 'GITHUB_TOKEN') {
      currentConfig.GithubToken = newValue || '';
      changedMade = true;
    }
  }
  if (changedMade) {
    onChangeCallbacks.forEach((callback) => callback(currentConfig));
  }
});

export async function GetConfig(): Promise<Configuration> {
  await initialConfigLoadPromise;
  return currentConfig;
}

export async function UpdateConfig(
  newState: Partial<Configuration>
): Promise<void> {
  const updateSyncState = {};
  for (const key in newState) {
    if (!Object.prototype.hasOwnProperty.call(newState, key)) continue;
    if (key == 'RepositorySelection') {
      updateSyncState['REPO_OWNER'] = (newState[key] || {}).RepoOwner;
      updateSyncState['REPO_NAME'] = (newState[key] || {}).RepoName;
    } else if (key == 'GithubToken') {
      updateSyncState['GITHUB_TOKEN'] = newState[key] || '';
    }
  }
  await chrome.storage.sync.set(updateSyncState);
}

export function OnConfigChange(
  callback: (config: Configuration) => void
): () => void {
  onChangeCallbacks.push(callback);
  return () => {
    const index = onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      onChangeCallbacks.splice(index, 1);
    }
  };
}

export function useConfig(): [Configuration | null, number] {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [configVersion, setConfigVersion] = useState<number>(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    GetConfig().then((initialConfig) => {
      setConfig(initialConfig);
      setConfigVersion(1);
      unsubscribe = OnConfigChange((newConfig) => {
        setConfig(newConfig);
        setConfigVersion((prevVersion) => prevVersion + 1);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return [config, configVersion];
}
