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

  const unlabeledRepos = selection.IndividualRepos.filter((repo) => {
    return (
      repos.findIndex(
        (knownRepo) =>
          knownRepo.owner?.login === repo.owner && knownRepo.name === repo.name
      ) === -1
    );
  });

  return (
    <ConfigCard title='Repository Selection'>
      {loading && <div>Loading repositories...</div>}
      {error && <div className='text-error'>{error}</div>}
      {!loading && !error && (
        <div className='flex flex-col gap-6'>
          {unlabeledRepos.length > 0 && (
            <div className='flex flex-col bg-amber-200 p-2'>
              <div className='mb-2 font-bold'>Unknown Repositories</div>
              <form className='space-y-2'>
                {unlabeledRepos.map((repo) => {
                  return (
                    <label
                      key={`${repo.owner}/${repo.name}`}
                      className='flex cursor-pointer items-center gap-2'
                    >
                      <input
                        type='checkbox'
                        checked={true}
                        onChange={() => {
                          const newSelection = { ...selection };
                          newSelection.IndividualRepos =
                            newSelection.IndividualRepos.filter(
                              (configuredRepo) => configuredRepo != repo
                            );
                          selectionChanged(newSelection);
                        }}
                        className='checkbox'
                      />
                      <span className='font-mono'>
                        {repo.owner}/{repo.name}
                      </span>
                    </label>
                  );
                })}
              </form>
            </div>
          )}
          {Object.entries(reposByOwner).map(([owner, ownerRepos]) => (
            <div key={owner} className='flex flex-col'>
              <div className='mb-2 font-bold'>{owner}</div>
              <form className='space-y-2'>
                {ownerRepos.map((repo) => {
                  const checked =
                    selection.IndividualRepos.findIndex(
                      (configuredRepo) =>
                        configuredRepo.owner === repo.owner.login &&
                        configuredRepo.name === repo.name
                    ) !== -1;
                  return (
                    <label
                      key={repo.id}
                      className='flex cursor-pointer items-center gap-2'
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => {
                          const newSelection = { ...selection };
                          if (checked) {
                            // Remove from selection
                            newSelection.IndividualRepos =
                              newSelection.IndividualRepos.filter(
                                (configuredRepo) =>
                                  configuredRepo.owner !== repo.owner.login ||
                                  configuredRepo.name !== repo.name
                              );
                          } else {
                            // Add to selection
                            newSelection.IndividualRepos.push({
                              owner: repo.owner.login,
                              name: repo.name,
                            });
                          }
                          selectionChanged(newSelection);
                        }}
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
