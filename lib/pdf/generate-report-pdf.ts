import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import type { ScanResult, IssueCategory } from '@/types/scan'
import {
  issueBody,
  issueConfidenceLabel,
  issueSeverityLabel,
  issueTitle,
  normalizeStrategicRecommendationsForDisplay,
  strategicTimeframeLabel,
} from '@/lib/report/report-safety'

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
  accessibility: 'Accessibility',
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderIssue(issue: NonNullable<ScanResult['performance']['issues']>[number]) {
  const evidence = issue.evidence?.slice(0, 3).map(item =>
    `<span class="evidence">${escapeHtml(item.label ?? 'Evidence')}: ${escapeHtml(String(item.value ?? 'unknown'))}</span>`
  ).join('') ?? ''
  const severity = issueSeverityLabel(issue).toLowerCase()
  const confidence = issueConfidenceLabel(issue)

  return `
    <div class="issue">
      <div class="issue-meta">
        <span class="severity severity-${escapeHtml(severity)}">${escapeHtml(severity)}</span>
        ${confidence !== 'unknown' ? `<span class="confidence">${escapeHtml(confidence)}</span>` : ''}
        ${issue.value !== undefined ? `<span class="value">${escapeHtml(String(issue.value))}</span>` : ''}
      </div>
      <h4>${escapeHtml(issueTitle(issue))}</h4>
      <p>${escapeHtml(issueBody(issue))}</p>
      ${evidence ? `<div class="evidence-list">${evidence}</div>` : ''}
    </div>
  `
}

function renderHtml(result: ScanResult, options: { whiteLabel: boolean; domain: string }) {
  const categories = (['performance', 'seo', 'security', 'mobile', 'ai_visibility'] as IssueCategory[]).map(category => {
    const data = result[category]
    const issues = data.issues.map(renderIssue).join('')
    return `
      <section class="category">
        <div class="category-head">
          <h3>${CATEGORY_LABELS[category]}</h3>
          <div class="score">${data.score ?? '—'}</div>
        </div>
        ${data.measurement && data.measurement.status !== 'measured'
          ? `<p class="measurement">${escapeHtml(data.measurement.label)}: ${escapeHtml(data.measurement.message ?? 'Unavailable')}</p>`
          : ''}
        ${issues || '<p class="muted">No issues in this category.</p>'}
      </section>
    `
  }).join('')

  const priorities = result.topPriorities?.length
    ? `<div class="priorities"><h3>Top priorities</h3><ol>${result.topPriorities.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol></div>`
    : ''
  const safeStrategicRecommendations = normalizeStrategicRecommendationsForDisplay(result.strategicRecommendations)
  const strategicRecommendations = safeStrategicRecommendations.length
    ? `<section class="strategy"><h3>Strategic recommendations</h3>${safeStrategicRecommendations.map(item => `
        <div class="strategy-item">
          <span class="timeframe">${escapeHtml(strategicTimeframeLabel(item.timeframe))}</span>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.body)}</p>
        </div>
      `).join('')}</section>`
    : ''

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #121212; padding: 32px; font-size: 12px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; border-bottom:1px solid #e5e7eb; padding-bottom:20px; margin-bottom:24px; }
        .brand { font-size: 24px; font-weight: 700; }
        .muted { color:#6b7280; }
        .total { font-size: 56px; font-weight: 700; line-height:1; }
        .summary { margin: 18px 0 24px; padding:16px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; }
        .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin-bottom:24px; }
        .card { padding:14px; border:1px solid #e5e7eb; border-radius:12px; background:#fff; }
        .card h3 { margin:0 0 4px; font-size:13px; }
        .category { margin-bottom:20px; padding:16px; border:1px solid #e5e7eb; border-radius:14px; page-break-inside: avoid; }
        .category-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .category h3 { margin:0; font-size:16px; }
        .score { font-size:18px; font-weight:700; }
        .issue { border-top:1px solid #f1f5f9; padding-top:12px; margin-top:12px; }
        .issue:first-of-type { border-top:none; padding-top:0; margin-top:0; }
        .issue h4 { margin:6px 0; font-size:13px; }
        .issue p { margin:0; color:#374151; line-height:1.55; }
        .issue-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .severity, .confidence, .value, .evidence { display:inline-block; border-radius:999px; padding:3px 8px; font-size:10px; background:#f3f4f6; }
        .severity-critical { background:#fee2e2; color:#991b1b; }
        .severity-high { background:#ffedd5; color:#9a3412; }
        .severity-medium { background:#fef3c7; color:#92400e; }
        .severity-low { background:#dbeafe; color:#1d4ed8; }
        .evidence-list { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
        .measurement { margin:0 0 10px; color:#9a3412; }
        .strategy { margin:0 0 24px; padding:16px; border:1px solid #dbeafe; background:#f8fbff; border-radius:14px; page-break-inside: avoid; }
        .strategy h3 { margin:0 0 12px; font-size:16px; }
        .strategy-item { border-top:1px solid #dbeafe; padding-top:10px; margin-top:10px; }
        .strategy-item:first-of-type { border-top:none; padding-top:0; margin-top:0; }
        .strategy-item h4 { margin:6px 0; font-size:13px; }
        .strategy-item p { margin:0; color:#374151; line-height:1.55; }
        .timeframe { display:inline-block; border-radius:999px; padding:3px 8px; font-size:10px; background:#e0f2fe; color:#075985; text-transform:uppercase; }
        .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:11px; color:#6b7280; }
        ol { margin:8px 0 0 18px; padding:0; }
        li { margin:4px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${options.whiteLabel ? '' : '<div class="brand">ShipReady</div>'}
          <div class="muted">${escapeHtml(options.domain)}</div>
          <div class="muted">Scanned at ${escapeHtml(new Date(result.scannedAt).toLocaleString('en-US'))}</div>
        </div>
        <div>
          <div class="muted">Total score</div>
          <div class="total">${result.totalScore ?? '—'}</div>
        </div>
      </div>

      ${(result.aiSummary || priorities) ? `
        <section class="summary">
          ${result.aiSummary ? `<p>${escapeHtml(result.aiSummary)}</p>` : ''}
          ${priorities}
        </section>
      ` : ''}

      <section class="grid">
        ${(['performance', 'seo', 'security', 'mobile', 'ai_visibility'] as IssueCategory[]).map(category => `
          <div class="card">
            <h3>${CATEGORY_LABELS[category]}</h3>
            <div>${result[category].score ?? '—'}/100</div>
          </div>
        `).join('')}
      </section>

      ${strategicRecommendations}

      ${categories}

      ${options.whiteLabel ? '' : '<div class="footer">Generated by ShipReady</div>'}
    </body>
  </html>`
}

export async function generateReportPdf(
  result: ScanResult,
  options: { whiteLabel: boolean; domain: string },
): Promise<Buffer> {
  const systemChromium = process.env.CHROMIUM_PATH
  const isLocalChrome = Boolean(systemChromium)
  const bundledChromiumDir = path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin')
  const executablePath = systemChromium
    ?? await chromium.executablePath(bundledChromiumDir)
  const headlessMode = isLocalChrome ? true : 'shell'
  const launchArgs = isLocalChrome
    ? puppeteer.defaultArgs()
    : puppeteer.defaultArgs({ args: chromium.args, headless: headlessMode })

  const browser = await puppeteer.launch({
    args: launchArgs,
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: headlessMode,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(renderHtml(result, options), { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
