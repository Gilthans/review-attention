import { useEffect, useState } from 'react';
import getAuthenticatedUser from '@utils/auth';
import { useBackgroundState } from '@utils/backgroundState.ts';
import { useConfig } from '@utils/config';

export default function Popup() {
  const [error, setError] = useState<string | null>(null);
  const [config, _] = useConfig();
  const [backgroundState, backgroundStateVersion] = useBackgroundState();
  useEffect(() => {
    setError(backgroundState?.latestError || null);
  }, [backgroundStateVersion, backgroundState?.latestError]);

  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    getAuthenticatedUser().then(setCurrentUser).catch(setError);
  }, []);

  if (config === null || currentUser === null) {
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
  if (!config.IsConfigured()) {
    return (
      <div id='my-ext' className='container p-4' data-theme='light'>
        <h2 className='mb-2 text-lg font-bold'>Configuration Needed</h2>
        <p className='mb-4'>Please set up your GitHub repo and token.</p>
        <button
          type='button'
          className='btn btn-primary'
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Go to Options
        </button>
      </div>
    );
  }

  return (
    <div
      id='my-ext'
      className='container min-w-[350px] max-w-[650px] p-4'
      data-theme='light'
    >
      <div id='top-bar' className='mb-4 flex items-center justify-between'>
        <h2 className='mb-4 text-xl font-bold'>Pull Requests</h2>
        <div id='status' className='flex items-center gap-2'>
          {backgroundState?.isUpdateInProgress && (
            <span className='loading loading-spinner loading-md text-sm' />
          )}

          <span className='text-sm text-base-content opacity-70'>
            Last updated: {backgroundState?.lastUpdateTime?.toLocaleString()}
          </span>
          <button
            className='btn btn-circle btn-outline btn-success btn-sm'
            onClick={() => chrome.runtime.sendMessage({ type: 'REFRESH_PRS' })}
          >
            ⟳
          </button>
        </div>
      </div>
      {error && (
        <div className='alert alert-error mb-4'>
          <span>Error fetching PRs: {error}</span>
        </div>
      )}
      <div className='max-h-[60vh] space-y-4 overflow-y-auto'>
        {backgroundState?.latestPRs &&
          backgroundState.latestPRs
            .filter(
              (pr) =>
                !pr.draft &&
                (pr.user.login === currentUser ||
                  pr.requested_reviewers.find(
                    (reviewer) => reviewer.login === currentUser
                  ) ||
                  pr.assignees.find(
                    (assignee) => assignee.login === currentUser
                  ))
            )
            .map((pr) => (
              <div key={pr.id} className='card bg-base-100 shadow-sm'>
                <div className='card-body flex flex-row items-center gap-4 p-4'>
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className='h-12 w-12 rounded-full border'
                  />
                  <div className='flex-1'>
                    <a
                      href={pr.html_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='link-hover link text-lg font-semibold text-primary'
                    >
                      {pr.title}
                    </a>
                    <div className='mt-1 text-sm text-base-content'>
                      <span>
                        <a
                          href={pr.user.html_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='link link-secondary'
                        >
                          @{pr.user.login}
                        </a>
                      </span>
                      {pr.draft && (
                        <span className='badge badge-warning ml-2'>Draft</span>
                      )}
                    </div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {pr.assignees.length > 0 && (
                        <span className='badge badge-info badge-outline'>
                          Assignees:{' '}
                          {pr.assignees.map((a) => a.login).join(', ')}
                        </span>
                      )}
                      {pr.requested_reviewers.length > 0 && (
                        <span className='badge badge-success badge-outline'>
                          Reviewers:{' '}
                          {pr.requested_reviewers
                            .map((r) => r.login)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={pr.html_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-outline btn-primary btn-sm'
                    title='Open PR'
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
        {backgroundState?.lastUpdateTime &&
          backgroundState?.latestPRs.length === 0 &&
          !error && (
            <div className='text-center text-base-content opacity-70'>
              No pull requests found.
            </div>
          )}
      </div>
    </div>
  );
}
