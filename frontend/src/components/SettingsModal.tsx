/**
 * SettingsModal — GitHub PAT / Repo 설정 패널
 * 값은 localStorage에 저장됩니다.
 */
import { useState, useEffect } from 'react';

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

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [pat, setPat] = useState('');
  const [repo, setRepo] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadGitHubSettings();
    setPat(s.pat);
    setRepo(s.repo);
  }, []);

  const handleSave = () => {
    localStorage.setItem(LS_PAT, pat.trim());
    localStorage.setItem(LS_REPO, repo.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="설정"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-80 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">⚙️ GitHub 설정</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* PAT */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="gh-pat"
            className="text-xs font-semibold text-gray-600"
          >
            GitHub Personal Access Token
          </label>
          <input
            id="gh-pat"
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <p className="text-[10px] text-gray-400">
            repo 스코프 권한 필요 ·{' '}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
            >
              토큰 발급
            </a>
          </p>
        </div>

        {/* Repo */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="gh-repo"
            className="text-xs font-semibold text-gray-600"
          >
            GitHub Repository
          </label>
          <input
            id="gh-repo"
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <p className="text-[10px] text-gray-400">예: HoonDongKang/lipcoding-2026</p>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}
