export interface PRData {
  title: string;
  num: number;
  adds: number;
  dels: number;
  files: number;
  commits: number;
  merged: boolean;
  desc: string;
}

function parseGitHubPRUrl(url: string): { owner: string; repo: string; number: number } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error(`Invalid GitHub PR URL: ${url}`);
  return { owner: match[1], repo: match[2], number: parseInt(match[3], 10) };
}

function mockPRData(url: string): PRData {
  const { repo, number } = parseGitHubPRUrl(url);
  const hash = url.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(hash);
  return {
    title: `PR #${number} on ${repo}`,
    num: number,
    adds: (abs % 300) + 10,
    dels: (abs % 80) + 2,
    files: (abs % 8) + 1,
    commits: (abs % 6) + 1,
    merged: abs % 3 !== 0,
    desc: `Changes to ${repo} (fetched from mock data).`,
  };
}

export async function fetchPRData(url: string): Promise<PRData> {
  const { owner, repo, number } = parseGitHubPRUrl(url);
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const pr = await res.json();
    return {
      title: pr.title,
      num: pr.number,
      adds: pr.additions ?? 0,
      dels: pr.deletions ?? 0,
      files: pr.changed_files ?? 0,
      commits: pr.commits ?? 1,
      merged: pr.merged ?? false,
      desc: pr.body?.slice(0, 200) ?? '',
    };
  } catch {
    return mockPRData(url);
  }
}
