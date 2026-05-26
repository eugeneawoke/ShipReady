export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string; enum?: string[] }>
    required?: string[]
  }
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'scan_url',
    description: 'Submit a URL for a full ShipReady audit. Returns a scan ID. Poll get_report for results.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to audit (must be a valid https URL)' },
        goal: {
          type: 'string',
          description: 'Scan focus area',
          enum: ['seo', 'security', 'ai_visibility', 'full'],
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_report',
    description: 'Retrieve the current state of a scan by ID. Returns status and results when complete.',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: { type: 'string', description: 'The scan ID returned by scan_url' },
      },
      required: ['scan_id'],
    },
  },
  {
    name: 'list_issues',
    description: 'List all issues found in a completed scan, with optional filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: { type: 'string', description: 'The scan ID' },
        category: {
          type: 'string',
          description: 'Filter by category',
          enum: ['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility'],
        },
        severity: {
          type: 'string',
          description: 'Filter by severity',
          enum: ['critical', 'high', 'medium', 'low', 'pass'],
        },
        confidence: {
          type: 'string',
          description: 'Filter by confidence',
          enum: ['verified', 'likely', 'heuristic'],
        },
      },
      required: ['scan_id'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get a single issue by its ID from a completed scan.',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: { type: 'string', description: 'The scan ID' },
        issue_id: { type: 'string', description: 'The issue ID (e.g. lcp-slow, no-https)' },
      },
      required: ['scan_id', 'issue_id'],
    },
  },
]
