export interface MonitoredDomain {
  id: string
  user_id: string
  domain: string
  notify_email: string
  active: boolean
  last_scan_id: string | null
  last_alerted_at: string | null
  created_at: string
  updated_at: string
}
