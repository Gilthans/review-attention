import { useEffect, useState } from 'react';

type PR = {
  id: number;
  title: string;
  html_url: string;
  user: { login: string };
};

export default function Popup() {
  const [prs, setPRs] = useState<PR[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsConfig, setNeedsConfig] = useState(false);
  useEffect(() => {
    chrome.storage.sync.get(
      ['REPO_OWNER', 'REPO_NAME', 'GITHUB_TOKEN'],
      (config) => {
        if (!config.REPO_OWNER || !config.REPO_NAME || !config.GITHUB_TOKEN) {
          setNeedsConfig(true);
          setLoading(false);
          return;
        }
        chrome.runtime.sendMessage({ type: 'GET_PRS' }, (response) => {
          setLoading(false);
          if (response?.error) {
            setError(response.error);
            setPRs([]);
          } else {
            setPRs(response.prs || []);
            setError(null);
          }
        });
      }
    );
  }, []);

  if (needsConfig) {
    return (
      <div className='container' data-theme='light'>
        <h2>Configuration Needed</h2>
        <p>Please set up your GitHub repo and token.</p>
        <button type='button' onClick={() => chrome.runtime.openOptionsPage()}>
          Go to Options
        </button>
      </div>
    );
  }

  return (
    <div className='container' data-theme='light'>
      <h2>Pull Requests</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error fetching PRs: {error}</div>}
      <ul>
        {prs.map((pr) => (
          <li key={pr.id}>
            <a href={pr.html_url} target='_blank' rel='noopener noreferrer'>
              {pr.title} ({pr.user.login})
            </a>
            {/* <pre> */}
            {/*  <code>{JSON.stringify(pr, null, 2)}</code> */}
            {/* </pre> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
