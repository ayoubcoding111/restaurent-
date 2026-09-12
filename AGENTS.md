# AGENTS.md — Delicious Restaurant (Project2)

## graphify — always-on knowledge graph (credit saver)

BEFORE answering any question about this codebase, its architecture, file relationships, or project content:
1. Load the `graphify` skill.
2. Check `graphify-out/GRAPH_REPORT.md` first (cheap summary), then `graphify-out/graph.json` as needed.
3. Prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, `graphify explain "<node>"` over scanning full source files.

Do NOT read all of `client/`, `server/` to "learn the project" — the graph already maps it:
- Frontend SPA & Features — index.html components, README specs
- Server Core & Auth — server.js, validators, sessions, middleware
- Client App Logic — app.js functions, router, UI helpers
- Admin Dashboard Panels / Staff Dashboard / Email System / Database Config / Product Photography

God nodes: Delicious Restaurant (21 edges), SPA Entry Point (18 edges), Anti-Koshary Skill (11 edges).

AFTER any code change (edit/write):
- Run `graphify update .` to rebuild the graph incrementally (no API cost).
- A post-commit hook (`graphify hook install`) also rebuilds on `git commit`. A session plugin in `.opencode/plugins/graphify-auto.js` does it on file edits.
