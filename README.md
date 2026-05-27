# ShipReady

Web audit for founders, developers, and agencies. Paste a URL — find out why Google, ChatGPT, and Perplexity can't find your site, and get the exact fix.

80+ checks across **SEO**, **AI visibility**, **security**, **performance**, **mobile**, and **accessibility**. Findings are confidence-graded (`verified` / `likely` / `heuristic`) — no invented facts.

[Get API Key](https://shipready.app/dashboard) · [Try it](https://shipready.app)

---

## What ShipReady checks

- **SEO** — meta tags, canonical URLs, structured data, sitemaps, indexability
- **AI visibility** — llms.txt, AI crawler access, answer-gap analysis, per-bot readiness (ChatGPT, Claude, Gemini, Perplexity)
- **Security** — HTTPS, headers, SSL validity, redirect chains, known vulnerabilities
- **Performance** — Core Web Vitals via Lighthouse, CrUX field data
- **Mobile** — tap targets, font sizes, viewport
- **Accessibility** — Lighthouse a11y audit

Report generates ready-to-paste artifacts: `llms.txt`, Schema.org JSON-LD, security headers config.

---

## MCP Integration

ShipReady exposes a remote MCP server at `/api/mcp`. Connect any MCP-compatible AI assistant to run audits, fetch reports, and filter issues directly in your workflow.

### Tools

| Tool | Description |
|------|-------------|
| `scan_url` | Submit a URL for audit. Optional `goal`: `seo` \| `security` \| `ai_visibility` \| `full` |
| `get_report` | Fetch scan status and full results by scan `id` |
| `list_issues` | List and filter issues from a completed scan |
| `get_issue` | Fetch a single issue with full details and fix prompt |

### Setup

Replace `YOUR_API_KEY` with your key from [Dashboard → API Keys](https://shipready.app/dashboard).

<details>
<summary>Claude Desktop</summary>

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shipready": {
      "url": "https://shipready.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```
</details>

<details>
<summary>Cursor</summary>

**Global:** `~/.cursor/mcp.json`  
**Project:** `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "shipready": {
      "url": "https://shipready.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```
</details>

<details>
<summary>Windsurf</summary>

**File:** `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "shipready": {
      "url": "https://shipready.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```
</details>

<details>
<summary>Codex CLI</summary>

**File:** `~/.codex/mcp_servers.json`

```json
{
  "mcpServers": {
    "shipready": {
      "url": "https://shipready.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```
</details>

<details>
<summary>VS Code — Cline</summary>

Open Cline extension → MCP Servers → Add Server. Or edit directly:

**macOS:** `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "shipready": {
      "url": "https://shipready.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```
</details>

---

## REST API

All endpoints require `Authorization: Bearer YOUR_API_KEY`.

### Scan a URL

```bash
curl -X POST https://shipready.app/api/v1/scan \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "goal": "full"}'
```

```json
{ "id": "scan_abc123", "url": "https://example.com", "status": "pending" }
```

### Get report

```bash
curl https://shipready.app/api/v1/scan/scan_abc123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Bulk scan (Agency plan)

```bash
curl -X POST https://shipready.app/api/v1/bulk-scan \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com", "https://another.com"]}'
```

Max 10 URLs per request.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/scan` | Submit scan |
| `GET` | `/api/v1/scan/:id` | Get results |
| `GET` | `/api/v1/scan/:id/issues` | List issues |
| `POST` | `/api/v1/bulk-scan` | Bulk scan (Agency) |

---

## Get API Key

Sign in at [shipready.app/dashboard](https://shipready.app/dashboard) → Settings → API Keys.

---

## Development

```bash
npm install
npm run dev   # http://localhost:3000
npm run lint
npm run build
```

Environment variables: [`.env.example`](.env.example)  
Architecture and scan flow: [`CLAUDE.md`](CLAUDE.md)
