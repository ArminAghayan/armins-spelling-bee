import { NextResponse } from 'next/server'

export const revalidate = 300 // cache for 5 minutes

export async function GET() {
  try {
    const res = await fetch(
      'https://api.github.com/repos/ArminAghayan/armins-spelling-bee/commits?per_page=40',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'armins-spelling-bee',
        },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch commits' }, { status: res.status })
    }

    const data = await res.json()

    const commits = (data as {
      sha: string
      commit: {
        message: string
        author: { name: string; date: string }
      }
    }[]).map(c => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
    }))

    return NextResponse.json(commits)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch commits' }, { status: 500 })
  }
}
