const LS_PAT = 'smth_github_pat';
const LS_REPO = 'smth_github_repo';

export interface GitHubSettings {
  pat: string;
  repo: string;
}

export function loadGitHubSettings(): GitHubSettings {
  return {
    pat: localStorage.getItem(LS_PAT) ?? '',
    repo: localStorage.getItem(LS_REPO) ?? '',
  };
}

export function saveGitHubSettings(settings: GitHubSettings): void {
  localStorage.setItem(LS_PAT, settings.pat.trim());
  localStorage.setItem(LS_REPO, settings.repo.trim());
}
