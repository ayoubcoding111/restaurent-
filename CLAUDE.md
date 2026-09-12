# graphify

Before answering any question about this codebase, check `graphify-out/graph.json` for existing structure. The graph contains 203 nodes across 20 communities covering the full project architecture.

When code changes are made, run `graphify update .` to rebuild the graph incrementally.

Key communities:
- **Frontend SPA & Features** — index.html components, README specs
- **Server Core & Auth** — server.js, validators, sessions, middleware
- **Client App Logic** — app.js functions, router, UI helpers
- **Code Quality Skill** — anti-koshary methodology, security checks
- **Admin Dashboard Panels** — admin UI sections
- **Email System** — nodemailer, password reset
- **Database Config** — mysql2, connection pool
- **Product Photography** — food/product images
- **Staff Dashboard** — kitchen alerts, staff flow

God nodes: Delicious Restaurant (21 edges), SPA Entry Point (18 edges), Anti-Koshary Skill (11 edges)
