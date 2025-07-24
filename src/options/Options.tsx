import { JSX, useEffect, useState } from 'react';
import { GithubConfigurationCard } from '@options/GithubConfigurationCard.tsx';
import { RepositorySelectionCard } from '@options/RepositorySelectionCard.tsx';
import { GetConfig } from '@utils/config.ts';

class RepositorySelection {
  RepoOwner: string = '';
  RepoName: string = '';
}

export default function Options(): JSX.Element {
  const [token, setToken] = useState('');
  const [repoSelection, setRepoSelection] = useState<RepositorySelection>({
    RepoOwner: '',
    RepoName: '',
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    GetConfig().then((config) => {
      setRepoSelection({
        RepoOwner: config.RepoOwner,
        RepoName: config.RepoName,
      });
      setToken(config.GithubToken);
      setLoading(false);
    });
  }, []);

  const saveConfig = () => {
    chrome.storage.sync.set(
      {
        REPO_OWNER: repoSelection.RepoOwner,
        REPO_NAME: repoSelection.RepoName,
        GITHUB_TOKEN: token,
      },
      () => {
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);
        chrome.runtime.sendMessage({ type: 'CONFIGURE' }, () => {});
      }
    );
  };

  if (loading) {
    return (
      <div
        id='my-ext'
        className='flex min-h-screen items-center justify-center bg-base-200'
        data-theme='light'
      >
        <span className='loading loading-spinner loading-lg text-primary' />
      </div>
    );
  }
  return (
    <div id='my-ext' data-theme='light'>
      <div className='flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-base-200'>
        <GithubConfigurationCard token={token} setToken={setToken} />
        {token && (
          <RepositorySelectionCard
            selection={repoSelection}
            selectionChanged={setRepoSelection}
          />
        )}
        <div className='flex justify-center'>
          <button
            type='button'
            className='btn btn-outline btn-primary'
            onClick={saveConfig}
          >
            Save
          </button>
        </div>
        {status && (
          <div className='mt-2 text-center text-success'>{status}</div>
        )}
      </div>
    </div>
  );
}
