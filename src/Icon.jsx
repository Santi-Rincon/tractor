const raw = import.meta.glob('./icons/*.svg', { query: '?raw', import: 'default', eager: true })
const icons = {}
for (const [path, svg] of Object.entries(raw)) {
  const name = path.slice('./icons/'.length, -'.svg'.length)
  icons[name] = svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
}

export function Icon({ name, class: cls = 'ic' }) {
  return <svg class={cls} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[name] }} />
}
