import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

const GITHUB_API = 'https://api.github.com';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const username = process.env.GITHUB_USERNAME?.trim();
    const token = process.env.GITHUB_TOKEN;

    if (!username) {
      return NextResponse.json(
        { error: 'Missing optional environment variable: GITHUB_USERNAME' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=public`,
      { headers, next: { revalidate: 300 } }
    );

    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: `GitHub API error: ${msg}` }, { status: res.status });
    }

    const repos = await res.json();

    const simplified = repos.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      homepage: r.homepage,
      language: r.language,
      topics: r.topics,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      updated_at: r.updated_at,
      fork: r.fork,
    }));

    return NextResponse.json(simplified);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GitHub repos' }, { status: 500 });
  }
}
