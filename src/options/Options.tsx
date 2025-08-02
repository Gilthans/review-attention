import { JSX, useEffect, useState } from 'react';
import { GithubConfigurationCard } from '@options/GithubConfigurationCard.tsx';
import { RepositorySelectionCard } from '@options/RepositorySelectionCard.tsx';
import { GetConfig, RepositorySelection, UpdateConfig } from '@utils/config.ts';

export default function Options(): JSX.Element {
  const [token, setToken] = useState('');
  const [repoSelection, setRepoSelection] = useState<RepositorySelection>(
    new RepositorySelection()
  );
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    GetConfig().then((config) => {
      setRepoSelection(config.RepositorySelection);
      setToken(config.GithubToken);
      setLoading(false);
    });
  }, []);

  const saveConfig = async () => {
    await UpdateConfig({
      GithubToken: token,
      RepositorySelection: repoSelection,
    });
    setStatus('Saved!');
    setTimeout(() => setStatus(''), 2000);
  };

  if (loading) {
    return (
      <div
        id='pr-hawk'
        className='flex min-h-screen items-center justify-center bg-base-200'
        data-theme='light'
      >
        <span className='loading loading-spinner loading-lg text-primary' />
      </div>
    );
  }
  return (
    <div id='pr-hawk' data-theme='light'>
      <div className='flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-base-200'>
        <GithubConfigurationCard token={token} setToken={setToken} />
        {token && (
          <RepositorySelectionCard
            token={token}
            selection={repoSelection}
            onSelectionChanged={setRepoSelection}
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
