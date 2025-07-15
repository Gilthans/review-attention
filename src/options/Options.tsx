import { JSX, useEffect, useState } from 'react';

export default function Options(): JSX.Element {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(
      ['REPO_OWNER', 'REPO_NAME', 'GITHUB_TOKEN'],
      (config) => {
        setOwner(config.REPO_OWNER || '');
        setRepo(config.REPO_NAME || '');
        setToken(config.GITHUB_TOKEN || '');
      }
    );
  }, []);

  const saveConfig = () => {
    chrome.storage.sync.set(
      {
        REPO_OWNER: owner,
        REPO_NAME: repo,
        GITHUB_TOKEN: token,
      },
      () => {
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);

        chrome.runtime.sendMessage({ type: 'CONFIGURE' }, () => {});
      }
    );
  };
  return (
    <div
      id='my-ext'
      className='flex min-h-screen items-center justify-center bg-base-200'
      data-theme='light'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title mb-4'>GitHub Configuration</h2>
          <form className='space-y-4'>
            <div>
              <label htmlFor='repo-owner-input' className='label'>
                <span className='label-text'>Repo Owner</span>
                <input
                  id='repo-owner-input'
                  type='text'
                  className='input input-bordered w-full'
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder='e.g. octocat'
                />
              </label>
            </div>
            <div>
              <label htmlFor='repo-name-input' className='label'>
                <span className='label-text'>Repo Name</span>
                <input
                  id='repo-name-input'
                  type='text'
                  className='input input-bordered w-full'
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder='e.g. hello-world'
                />
              </label>
            </div>
            <div>
              <label htmlFor='github-token-input' className='label'>
                <span className='label-text'>GitHub Token</span>
                <input
                  id='github-token-input'
                  type='password'
                  className='input input-bordered w-full'
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder='Personal access token'
                />
              </label>
            </div>
            <div className='mt-2'>
              <a
                href='https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=Review%20Attention%20Access%20Token'
                target='_blank'
                rel='noopener noreferrer'
                className='link link-primary'
              >
                Create a GitHub access token
              </a>
            </div>
            <button
              type='button'
              className='btn btn-outline btn-primary w-full'
              onClick={saveConfig}
            >
              Save
            </button>
            {status && (
              <div className='mt-2 text-center text-success'>{status}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
