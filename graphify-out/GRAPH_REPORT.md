# Graph Report - Project2  (2026-09-13)

## Corpus Check
- 36 files · ~299,960 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 283 nodes · 293 edges · 33 communities (19 shown, 13 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6ee1bcd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend SPA & Features
- server.js
- Client App Logic
- NPM Dependencies
- Code Quality Skill
- Package Dependencies
- Product Photography
- Admin Dashboard Panels
- Email System
- Database Config
- Dependency Audit Script
- Staff Dashboard
- Brand Assets
- sw.js
- Admin Module
- Auth Module
- Cart Module
- i18n Module
- Icons Module
- UI Module
- What You Must Do When Invoked
- /graphify
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- AGENTS.md — Delicious Restaurant (Project2)
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md
- track.js

## God Nodes (most connected - your core abstractions)
1. `Delicious Restaurant` - 21 edges
2. `SPA Entry Point (index.html)` - 18 edges
3. `What You Must Do When Invoked` - 12 edges
4. `/graphify` - 11 edges
5. `Anti-Koshary Skill` - 11 edges
6. `graphify reference: extra exports and benchmark` - 8 edges
7. `Admin Dashboard Section with Sidebar Navigation` - 8 edges
8. `Family Pack Promotion` - 7 edges
9. `graphify reference: query, path, explain` - 5 edges
10. `Security Checks Reference` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Anti-Koshary Skill` --applies_to--> `Delicious Restaurant`  [INFERRED]
  .agents/skills/anti-koshary/SKILL.md → README.md
- `Customizable Menu Items (Options/Ingredients/Sizes)` --realized_by--> `Customize Item Modal`  [INFERRED]
  README.md → client/index.html
- `Internationalization (EN/FR/AR with RTL)` --realized_by--> `Language Switcher (Globe Menu with Flags)`  [INFERRED]
  README.md → client/index.html
- `Live Kitchen Dashboard` --realized_by--> `Staff Dashboard Section`  [INFERRED]
  README.md → client/index.html
- `Delicious Restaurant` --describes--> `SPA Entry Point (index.html)`  [EXTRACTED]
  README.md → client/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brand Identity Assets** — client_favicon_pizza_slice_svg, client_icons_icon_192_brand_logo, client_icons_icon_512_brand_logo [INFERRED 0.85]
- **Beverage Products** — client_imgs_coca_coca_cola_can, client_imgs_sprite_sprite_can [INFERRED 0.85]
- **Pizza Menu Products** — client_imgs_3fromages_four_cheese_pizza, client_imgs_4seasons_four_seasons_pizza, client_imgs_mega_all_cheese_pizza, client_imgs_frontpic_hero_pizza_image [INFERRED 0.85]

## Communities (33 total, 13 thin omitted)

### Community 0 - "Frontend SPA & Features"
Cohesion: 0.06
Nodes (39): Cart Page Section, Checkout Modal, Confirm Dialog Modal, Customize Item Modal, Edit Menu Item Modal (with Customization Options), Edit Staff Account Modal, Footer with Developer Attribution, Forgot Password Modal (+31 more)

### Community 1 - "server.js"
Cohesion: 0.05
Nodes (33): isValidDZPhone(), isValidEmail(), normalizeDZPhone(), app, authenticateToken(), authLimiter, bcrypt, bootstrapAdmin() (+25 more)

### Community 2 - "Client App Logic"
Cohesion: 0.09
Nodes (21): API, AppState, CartBadge, CartPage, Checkout, closeConfirm(), copyPhone(), Customizer (+13 more)

### Community 3 - "NPM Dependencies"
Cohesion: 0.08
Nodes (23): bcryptjs, cors, dotenv, express, express-rate-limit, multer, mysql2, nodemon (+15 more)

### Community 4 - "Code Quality Skill"
Cohesion: 0.15
Nodes (16): Auth Checks, Injection Checks, Secrets Detection, Security Checks Reference, Coincidental vs Coupled Duplication, Extracting a Reusable Piece, Structural Decay Reference, Anti-Koshary Skill (+8 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, multer, mysql2 (+1 more)

### Community 6 - "Product Photography"
Cohesion: 0.39
Nodes (8): Four Cheese Pizza, Four Seasons Pizza, Coca-Cola Can, Family Pack Promotion, Hero Pizza Image, All Cheese Mega Pizza, Sprite Can, Grilled Chicken Wrap

### Community 7 - "Admin Dashboard Panels"
Cohesion: 0.25
Nodes (8): Admin My Account Panel, Admin Analytics Panel with CSV Export, Admin Dashboard Section with Sidebar Navigation, Admin Menu Management Panel, Admin Orders Panel, Admin Reviews Panel, Admin Staff Panel, Admin Delivery Zones Panel

### Community 8 - "Email System"
Cohesion: 0.47
Nodes (5): nodemailer, getTransporter(), isMailConfigured(), nodemailer, sendPasswordResetEmail()

### Community 10 - "Dependency Audit Script"
Cohesion: 0.83
Nodes (3): section(), dep_audit.sh script, try()

### Community 11 - "Staff Dashboard"
Cohesion: 0.50
Nodes (3): KitchenAlerts, KitchenFlow, StaffDashboard

### Community 12 - "Brand Assets"
Cohesion: 1.00
Nodes (3): Pizza Slice SVG Favicon, Brand Logo Icon 192px, Brand Logo Icon 512px

### Community 20 - "What You Must Do When Invoked"
Cohesion: 0.13
Nodes (15): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 2 - Detect files, Step 3 - Extract entities and relationships (+7 more)

### Community 21 - "/graphify"
Cohesion: 0.17
Nodes (11): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, PowerShell 5.1: Vertical scrolling stops working (+3 more)

### Community 22 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 23 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 24 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 25 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 26 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **161 isolated node(s):** `AdminDashboard`, `AppState`, `ScrollReveal`, `API`, `Router` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 202 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Delicious Restaurant` connect `Frontend SPA & Features` to `Code Quality Skill`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `SPA Entry Point (index.html)` connect `Frontend SPA & Features` to `Admin Dashboard Panels`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Anti-Koshary Skill` connect `Code Quality Skill` to `Frontend SPA & Features`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `AdminDashboard`, `AppState`, `ScrollReveal` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend SPA & Features` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04995374653098982 - nodes in this community are weakly interconnected._
- **Should `Client App Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._