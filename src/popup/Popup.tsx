import { useEffect, useState } from 'react';
import getAuthenticatedUser from '@utils/auth';
import { useBackgroundState } from '@utils/backgroundState.ts';
import { useConfig } from '@utils/config';
import _ from 'lodash';

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) return `now`;
  if (seconds < 60) return `<1 minute ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function ErrorTooltip({ error }: { error: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [holdTooltip, setHoldTooltip] = useState(false);
  console.log('Error: ', error);
  return (
    <span
      className='relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-red-600 bg-red-600 text-xl text-white'
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => {
        setHoldTooltip(!holdTooltip);
      }}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      ⚠
      {(showTooltip || holdTooltip) && (
        <div
          className='absolute right-1/2 z-10 mt-2 max-h-[250px] w-max max-w-[400px] overflow-auto rounded bg-red-600 px-3 py-1 text-xs text-white shadow'
          style={{ whiteSpace: 'pre-line', top: '100%' }}
        >
          {error.status
            ? `${error.status}: ${error.response?.data?.message}`
            : _.isString(error)
              ? error
              : JSON.stringify(error)}
        </div>
      )}
    </span>
  );
}

function RefreshStatus(props: {
  backgroundState: BackgroundState;
  error: string | null;
}): JSX.Element {
  const [timeAgoText, setTimeAgoText] = useState<string | null>(null);
  useEffect(() => {
    if (!props.backgroundState?.lastUpdateTime) {
      setTimeAgoText(null);
      return;
    }
    const update = () =>
      setTimeAgoText(timeAgo(props.backgroundState.lastUpdateTime));
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [props.backgroundState?.lastUpdateTime]);

  const children = [];
  if (props.backgroundState?.isUpdateInProgress) {
    children.push(
      <span
        key='loading'
        className='loading loading-spinner loading-md text-sm'
      />
    );
  }
  if (!props.backgroundState?.lastUpdateTime) {
    children.push(
      <span key='no-data' className='text-sm text-base-content opacity-70'>
        No data
      </span>
    );
  } else {
    const reposTitleText = props.backgroundState?.repos
      ? [...props.backgroundState.repos]
          .map((repo) => `${repo.owner}/${repo.name}`)
          .join('\n')
      : '';
    children.push(
      <span key='updated' className='text-sm text-base-content opacity-70'>
        <p>Updated {timeAgoText}</p>
        <p title={reposTitleText}>
          from {props.backgroundState?.repos?.size ?? 0} repos
        </p>
      </span>
    );
  }

  return (
    <div id='status' className='flex items-center gap-2'>
      {children}
      {props.error && <ErrorTooltip error={props.error} />}
      <button
        className='btn btn-circle btn-outline btn-success btn-sm'
        onClick={() => chrome.runtime.sendMessage({ type: 'REFRESH_PRS' })}
      >
        ⟳
      </button>
    </div>
  );
}

export default function Popup() {
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [config, __] = useConfig();
  const [backgroundState, backgroundStateVersion] = useBackgroundState();
  useEffect(() => {
    setError(backgroundState?.latestError || null);
  }, [backgroundStateVersion, backgroundState?.latestError]);

  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    getAuthenticatedUser().then(setCurrentUser).catch(setLoadError);
  }, []);

  if (config === null || currentUser === null) {
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
  if (!config.IsConfigured() || loadError) {
    return (
      <div id='pr-hawk' className='container p-4' data-theme='light'>
        <h2 className='mb-2 text-lg font-bold'>Configuration Needed</h2>
        <p className='mb-4'>
          {!config.IsConfigured()
            ? 'Please set up your GitHub repo and token.'
            : `Unable to load data. Please check your configurations. (${loadError})`}
        </p>
        {config.IsConfigured() && loadError && (
          <div className='alert alert-error mb-4'>{loadError}</div>
        )}
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
      id='pr-hawk'
      className='container min-w-[350px] max-w-[650px] p-4'
      data-theme='light'
    >
      <div id='top-bar' className='mb-4 flex items-center justify-between'>
        <div className='mb-4 flex items-center gap-2 align-middle'>
          <h2 className='m-0 p-0 text-xl font-bold'>Pull Requests</h2>
          <button
            type='button'
            className='btn btn-circle btn-ghost btn-sm p-0 text-sm'
            title='Options'
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            ⚙
          </button>
        </div>
        <RefreshStatus backgroundState={backgroundState} error={error} />
      </div>
      <div className='max-h-[85vh] space-y-4 overflow-y-auto'>
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
          backgroundState?.latestPRs?.length === 0 &&
          !error && (
            <div className='text-center text-base-content opacity-70'>
              No pull requests found.
            </div>
          )}
      </div>
    </div>
  );
}
