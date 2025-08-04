import { JSX, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigCard } from '@options/ConfigCard.tsx';
import { RepositorySelection } from '@utils/config.ts';
import { Octokit } from 'octokit';

type Repo = {
  id: number;
  name: string;
  owner: { login: string };
};

function OwnerRepoList(props: {
  owner: string;
  repos: Repo[];
  selection: RepositorySelection;
  onSelectionChanged: (selection: RepositorySelection) => void;
}): JSX.Element {
  const { owner, repos, selection, onSelectionChanged } = props;

  const allChecked = repos.every((repo) =>
    selection.IndividualRepos.some(
      (configuredRepo) =>
        configuredRepo.owner === repo.owner.login &&
        configuredRepo.name === repo.name
    )
  );
  const someChecked = repos.some((repo) =>
    selection.IndividualRepos.some(
      (configuredRepo) =>
        configuredRepo.owner === repo.owner.login &&
        configuredRepo.name === repo.name
    )
  );
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allChecked && someChecked;
    }
  }, [allChecked, someChecked]);

  return (
    <div key={owner} className='flex flex-col'>
      <div className='mb-2 font-bold'>
        <input
          ref={selectAllRef}
          type='checkbox'
          checked={allChecked}
          onChange={() => {
            const newSelection = { ...selection };
            if (allChecked) {
              newSelection.IndividualRepos =
                newSelection.IndividualRepos.filter((r) => r.owner !== owner);
            } else {
              const toAdd = repos
                .filter(
                  (repo) =>
                    !newSelection.IndividualRepos.some(
                      (r) =>
                        r.owner === repo.owner.login && r.name === repo.name
                    )
                )
                .map((repo) => ({
                  owner: repo.owner.login,
                  name: repo.name,
                }));
              newSelection.IndividualRepos = [
                ...newSelection.IndividualRepos,
                ...toAdd,
              ];
            }
            onSelectionChanged(newSelection);
          }}
          className='checkbox'
        />

        {owner}
      </div>
      <form className='space-y-2'>
        {repos.map((repo) => {
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
                  onSelectionChanged(newSelection);
                }}
                className='checkbox'
              />
              <span className='font-mono'>{repo.name}</span>
            </label>
          );
        })}
      </form>
    </div>
  );
}

export function RepositorySelectionCard(props: {
  token: string;
  selection: RepositorySelection;
  onSelectionChanged: (newSelection: RepositorySelection) => void;
}): JSX.Element {
  const { token, selection, onSelectionChanged } = props;
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const octokit = useMemo<Octokit>(() => new Octokit({}), []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    octokit
      .paginate<Repo>('GET /user/repos', {
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
                          onSelectionChanged(newSelection);
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
            <OwnerRepoList
              key={owner}
              owner={owner}
              repos={ownerRepos}
              selection={selection}
              onSelectionChanged={onSelectionChanged}
            />
          ))}
        </div>
      )}
    </ConfigCard>
  );
}
