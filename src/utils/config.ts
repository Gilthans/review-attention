import { useEffect, useState } from 'react';

export class Configuration {
  IsConfigured(): boolean {
    return !!(this.RepoOwner && this.RepoName && this.GithubToken);
  }

  RepoOwner: string = '';

  RepoName: string = '';

  GithubToken: string = '';
}

const currentConfig: Configuration = new Configuration();
const onChangeCallbacks: ((config: Configuration) => void)[] = [];
const initialConfigLoadPromise = new Promise<void>((resolve) => {
  chrome.storage.sync.get(
    ['REPO_OWNER', 'REPO_NAME', 'GITHUB_TOKEN'],
    (config) => {
      currentConfig.RepoOwner = config.REPO_OWNER;
      currentConfig.RepoName = config.REPO_NAME;
      currentConfig.GithubToken = config.GITHUB_TOKEN;
      resolve();
    }
  );
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;
  // eslint-disable-next-line no-restricted-syntax
  let changedMade = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'REPO_OWNER') {
      currentConfig.RepoOwner = newValue || '';
      changedMade = true;
    } else if (key === 'REPO_NAME') {
      currentConfig.RepoName = newValue || '';
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
