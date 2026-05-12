'use client'

import dynamic from 'next/dynamic'

// Client Component wrapper so the Server Component (layout.tsx) can include
// the dock without violating the `ssr: false` restriction on Server Components.
const MobileBottomDock = dynamic(() => import('./MobileBottomDock'), { ssr: false })

export function MobileBottomDockClient() {
  return <MobileBottomDock />
}
