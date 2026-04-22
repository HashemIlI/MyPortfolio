'use client';
import { useState } from 'react';
import { Github, RefreshCw, ExternalLink, Star, GitFork, Import } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
}

export default function GitHubAdminPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [hideForks, setHideForks] = useState(true);

  async function fetchRepos() {
    setLoading(true);
    try {
      const data = await fetch('/api/github').then((r) => r.json());
      if (Array.isArray(data)) {
        setRepos(data);
      } else {
        toast({ title: 'GitHub API error', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to fetch repos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function importRepo(repo: Repo) {
    setImporting(repo.id);
    try {
      const payload = {
        titleEn: repo.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: slugify(repo.name),
        shortSummaryEn: repo.description || '',
        category: detectCategory(repo),
        tools: repo.language ? [repo.language, ...repo.topics.slice(0, 4)] : repo.topics.slice(0, 5),
        githubLink: repo.html_url,
        liveDemoLink: repo.homepage || '',
        visible: true,
        displayOrder: 99,
      };
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: `"${repo.name}" imported as project!`, variant: 'success' });
      } else {
        const d = await res.json();
        toast({ title: 'Import failed', description: d.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(null);
    }
  }

  const displayRepos = hideForks ? repos.filter((r) => !r.fork) : repos;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">GitHub Import</h1>
          <p className="text-gray-400 text-sm mt-0.5">Fetch your public repos and import as projects</p>
        </div>
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          {loading ? 'Fetching...' : 'Fetch Repos'}
        </button>
      </div>

      {repos.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
            <input type="checkbox" checked={hideForks} onChange={(e) => setHideForks(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Hide forked repos
          </label>
          <span className="text-xs text-gray-500">{displayRepos.length} of {repos.length} repos</span>
        </div>
      )}

      {repos.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500">
          <Github className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Click &quot;Fetch Repos&quot; to load your GitHub repositories.</p>
          <p className="text-xs mt-2">Make sure GITHUB_TOKEN is set in .env.local for higher rate limits.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {displayRepos.map((repo) => (
          <div key={repo.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-100 truncate">{repo.name}</div>
                {repo.language && (
                  <span className="text-xs text-emerald-400">{repo.language}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />{repo.stargazers_count}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" />{repo.forks_count}
                  </span>
                )}
              </div>
            </div>

            {repo.description && (
              <p className="text-xs text-gray-400 line-clamp-2">{repo.description}</p>
            )}

            {repo.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {repo.topics.slice(0, 4).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 text-xs">{t}</span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors">
                <ExternalLink className="h-3 w-3" /> View
              </a>
              <button onClick={() => importRepo(repo)} disabled={importing === repo.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs transition-colors ml-auto">
                {importing === repo.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Import className="h-3 w-3" />}
                {importing === repo.id ? 'Importing...' : 'Import as Project'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function detectCategory(repo: Repo): string {
  const text = `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ')}`.toLowerCase();
  if (text.includes('nlp') || text.includes('sentiment') || text.includes('text')) return 'NLP';
  if (text.includes('deep') || text.includes('neural') || text.includes('cnn')) return 'Deep Learning';
  if (text.includes('dashboard') || text.includes('powerbi') || text.includes('tableau')) return 'Dashboard';
  if (text.includes('ml') || text.includes('machine') || text.includes('predict')) return 'Machine Learning';
  if (text.includes('analysis') || text.includes('data') || text.includes('eda')) return 'Data Analysis';
  if (text.includes('vision') || text.includes('image') || text.includes('yolo')) return 'Computer Vision';
  if (text.includes('scraping') || text.includes('scrapy') || text.includes('selenium')) return 'Web Scraping';
  return 'Other';
}
