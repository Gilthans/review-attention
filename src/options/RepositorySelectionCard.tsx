import { JSX, useEffect, useMemo, useState } from 'react';
import { ConfigCard } from '@options/ConfigCard.tsx';
import { Octokit } from 'octokit';

type Repo = {
  id: number;
  name: string;
  owner: { login: string };
};

export function RepositorySelectionCard(props: {
  token: string;
  selection: RepositorySelection;
  selectionChanged: (newSelection: RepositorySelection) => void;
}): JSX.Element {
  const { token, selection, selectionChanged } = props;
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const octokit = useMemo<Octokit>(() => new Octokit({}), []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    octokit
      .paginate('GET /user/repos', {
        headers: { Authorization: `token ${token}` },
      })
      .then((data) => setRepos(data))
      .catch((e) => {
        console.log(e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [octokit, token]);

  // Group repos by owner
  const reposByOwner = repos.reduce<Record<string, Repo[]>>((acc, repo) => {
    const owner = repo.owner.login;
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(repo);
    return acc;
  }, {});

  return (
    <ConfigCard title='Repository Selection'>
      {loading && <div>Loading repositories...</div>}
      {error && <div className='text-error'>{error}</div>}
      {!loading && !error && (
        <div className='flex flex-col gap-6'>
          {Object.entries(reposByOwner).map(([owner, ownerRepos]) => (
            <div key={owner} className='flex flex-col'>
              <div className='mb-2 font-bold'>{owner}</div>
              <form className='space-y-2'>
                {ownerRepos.map((repo) => {
                  const checked =
                    selection.RepoOwner === repo.owner.login &&
                    selection.RepoName === repo.name;
                  return (
                    <label
                      key={repo.id}
                      className='flex cursor-pointer items-center gap-2'
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() =>
                          selectionChanged({
                            RepoOwner: repo.owner.login,
                            RepoName: repo.name,
                          })
                        }
                        className='checkbox'
                      />
                      <span className='font-mono'>{repo.name}</span>
                    </label>
                  );
                })}
              </form>
            </div>
          ))}
        </div>
      )}
    </ConfigCard>
  );
}
