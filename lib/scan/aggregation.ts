import type { Issue, SiteSummary } from '@/types/scan'

interface PageIssueSnapshot {
  url: string
  issues: Array<Pick<Issue, 'id' | 'title' | 'category'>>
}

export function buildSiteSummary(pages: PageIssueSnapshot[]): SiteSummary {
  const recurring = new Map<string, { issueId: string; title: string; category: Issue['category']; urls: string[] }>()

  for (const page of pages) {
    for (const issue of page.issues) {
      const key = `${issue.category}:${issue.id}`
      const current = recurring.get(key)
      if (current) {
        current.urls.push(page.url)
      } else {
        recurring.set(key, {
          issueId: issue.id,
          title: issue.title,
          category: issue.category,
          urls: [page.url],
        })
      }
    }
  }

  return {
    pagesCrawled: pages.length,
    recurringIssues: [...recurring.values()]
      .filter((issue) => issue.urls.length > 1)
      .sort((left, right) => right.urls.length - left.urls.length)
      .map((issue) => ({
        issueId: issue.issueId,
        title: issue.title,
        category: issue.category,
        occurrenceCount: issue.urls.length,
        urls: issue.urls,
      })),
  }
}
