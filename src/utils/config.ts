import { useEffect, useState } from 'react';

export interface Repository {
  owner: string;
  name: string;
}

interface StorageElement {
  REPO_SELECTION?: string;
  GITHUB_TOKEN?: string;
}

export class RepositorySelection {
  Owners: string[] = [];
  IndividualRepos: Repository[] = [];
}

export class Configuration {
  IsConfigured(): boolean {
    return !!(
      (this.RepositorySelection?.Owners?.length > 0 ||
        this.RepositorySelection?.IndividualRepos?.length > 0) &&
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
    ['REPO_SELECTION', 'GITHUB_TOKEN'],
    (loadedConfig) => {
      currentConfig.RepositorySelection = loadedConfig.REPO_SELECTION
        ? JSON.parse(loadedConfig.REPO_SELECTION)
        : new RepositorySelection();
      currentConfig.GithubToken = loadedConfig.GITHUB_TOKEN;
      resolve();
    }
  );
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;
  let changedMade = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'REPO_SELECTION') {
      currentConfig.RepositorySelection = newValue
        ? JSON.parse(newValue)
        : new RepositorySelection();
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
  const updateSyncState: StorageElement = {};
  for (const key in newState) {
    if (!Object.prototype.hasOwnProperty.call(newState, key)) continue;
    if (key == 'RepositorySelection') {
      updateSyncState['REPO_SELECTION'] = JSON.stringify(newState[key]);
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
