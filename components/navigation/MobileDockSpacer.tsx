/**
 * Invisible spacer that clears the fixed MobileBottomDock on mobile.
 * Height matches the dock height (h-36). Hidden on md+ breakpoints.
 */
export function MobileDockSpacer() {
  return <div aria-hidden="true" className="h-36 md:hidden" />
}
