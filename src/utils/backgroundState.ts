import { useEffect, useState } from 'react';

export type UserInfo = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
};

export type PR = {
  id: number;
  title: string;
  html_url: string;
  user: UserInfo;
  assignees: UserInfo[];
  requested_reviewers: UserInfo[];
  review_comments_url: string;
  draft: boolean;
};

class BackgroundState {
  latestPRs: PR[] = [];
  latestError: string | null = null;
  lastUpdateTime: Date | null = null;
  isUpdateInProgress: boolean = false;
}

const currentState: BackgroundState = new BackgroundState();
const onChangeCallbacks: ((config: BackgroundState) => void)[] = [];
const initialStateLoadPromise = new Promise<void>((resolve) => {
  chrome.storage.session.get(
    ['LATEST_PRS', 'LATEST_ERROR', 'LAST_UPDATE_TIME', 'IS_UPDATE_IN_PROGRESS'],
    (state) => {
      currentState.latestPRs = state.LATEST_PRS;
      currentState.latestError = state.LATEST_ERROR;
      currentState.lastUpdateTime =
        state.LAST_UPDATE_TIME && state.LAST_UPDATE_TIME > 0
          ? new Date(state.LAST_UPDATE_TIME)
          : null;
      currentState.isUpdateInProgress = state.IS_UPDATE_IN_PROGRESS;
      resolve();
    }
  );
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'session') return;
  let changedMade = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'LATEST_PRS') {
      currentState.latestPRs = newValue || [];
      changedMade = true;
    } else if (key === 'LATEST_ERROR') {
      currentState.latestError = newValue || '';
      changedMade = true;
    } else if (key === 'LAST_UPDATE_TIME' && newValue) {
      console.log('Updating lastUpdateTime:', newValue);
      currentState.lastUpdateTime = newValue ? new Date(newValue) : null;
      changedMade = true;
    } else if (key === 'IS_UPDATE_IN_PROGRESS') {
      currentState.isUpdateInProgress = newValue || false;
      changedMade = true;
    }
  }
  if (changedMade) {
    onChangeCallbacks.forEach((callback) => callback(currentState));
  }
});

export async function GetCurrentState(): Promise<BackgroundState> {
  await initialStateLoadPromise;
  return currentState;
}

export function OnStateChange(
  callback: (state: BackgroundState) => void
): () => void {
  onChangeCallbacks.push(callback);
  return () => {
    const index = onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      onChangeCallbacks.splice(index, 1);
    }
  };
}

export function UpdateState(newState: Partial<BackgroundState>) {
  const updatedSessionState = {};
  for (const key in newState) {
    if (!Object.prototype.hasOwnProperty.call(newState, key)) continue;
    if (key == 'latestPRs') {
      updatedSessionState['LATEST_PRS'] = newState[key] || [];
    } else if (key == 'latestError') {
      updatedSessionState['LATEST_ERROR'] = newState[key] || '';
    } else if (key == 'lastUpdateTime' && newState[key]) {
      if (!(newState[key] instanceof Date)) {
        console.warn(
          'lastUpdateTime should be a Date object, received:',
          newState[key]
        );
        continue;
      }
      updatedSessionState['LAST_UPDATE_TIME'] = newState[key]?.valueOf();
    } else if (key == 'isUpdateInProgress') {
      updatedSessionState['IS_UPDATE_IN_PROGRESS'] = newState[key] || false;
    }
  }
  chrome.storage.session.set(updatedSessionState);
}

export function useBackgroundState(): [BackgroundState | null, number] {
  const [state, setState] = useState<BackgroundState | null>(null);
  const [version, setVersion] = useState<number>(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    GetCurrentState().then((initialState) => {
      setState(initialState);
      setVersion(1);
      unsubscribe = OnStateChange((newState) => {
        setState(newState);
        setVersion((prevVersion) => prevVersion + 1);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return [state, version];
}
