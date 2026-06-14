// Tiny event bus so any element (e.g. the hero "Start a Project" button)
// can open the client portal / login, even if PortalLauncher mounted lazily.
export function openPortal() {
  window.__openPortalPending = true
  window.dispatchEvent(new Event('open-portal'))
}
