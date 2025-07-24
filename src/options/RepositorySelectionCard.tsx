import { JSX, useState } from 'react';
import { ConfigCard } from '@options/ConfigCard.tsx';

export function RepositorySelectionCard(props: {
  selection: RepositorySelection;
  selectionChanged: (newSelection: RepositorySelection) => void;
}): JSX.Element {
  const { selection, selectionChanged } = props;
  const [owner, setOwner] = useState(selection.RepoOwner);
  const [repo, setRepo] = useState(selection.RepoName);

  return (
    <ConfigCard title='Repository Selection'>
      <form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor='repo-owner-input' className='label'>
            <span className='label-text'>Repo Owner</span>
            <input
              id='repo-owner-input'
              type='text'
              className='input input-bordered w-full'
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                selectionChanged({
                  RepoOwner: e.target.value,
                  RepoName: repo,
                });
              }}
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
              onChange={(e) => {
                setRepo(e.target.value);
                selectionChanged({
                  RepoOwner: owner,
                  RepoName: e.target.value,
                });
              }}
              placeholder='e.g. hello-world'
            />
          </label>
        </div>
      </form>
    </ConfigCard>
  );
}
