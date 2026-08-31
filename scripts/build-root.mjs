// Build for a host that serves the site at its root (Cloudflare Pages, Netlify,
// a local `vite preview`). Written as a Node script rather than an inline
// `BASE_PATH=/ vite build` so it also works from cmd.exe on Windows.
process.env.BASE_PATH = '/'

const { build } = await import('vite')
await build()
