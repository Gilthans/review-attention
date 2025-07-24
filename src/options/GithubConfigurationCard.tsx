import { JSX } from 'react';
import { ConfigCard } from '@options/ConfigCard.tsx';

export function GithubConfigurationCard(props: {
  token: string;
  setToken: (token: string) => void;
}): JSX.Element {
  const { token, setToken } = props;

  return (
    <ConfigCard title='GitHub Configuration'>
      <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
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
      </form>
    </ConfigCard>
  );
}
