# Graph Report - Project2  (2026-09-12)

## Corpus Check
- 24 files · ~286,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 205 nodes · 227 edges · 20 communities (12 shown, 8 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22823312`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend SPA & Features
- Server Core & Auth
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
- Service Worker & PWA
- Admin Module
- Auth Module
- Cart Module
- i18n Module
- Icons Module
- UI Module

## God Nodes (most connected - your core abstractions)
1. `Delicious Restaurant` - 21 edges
2. `SPA Entry Point (index.html)` - 18 edges
3. `Anti-Koshary Skill` - 11 edges
4. `Admin Dashboard Section with Sidebar Navigation` - 8 edges
5. `Family Pack Promotion` - 7 edges
6. `Security Checks Reference` - 5 edges
7. `Structural Decay Reference` - 5 edges
8. `normalizeDZPhone()` - 4 edges
9. `isValidDZPhone()` - 4 edges
10. `Four Cheese Pizza` - 4 edges

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

## Communities (20 total, 8 thin omitted)

### Community 0 - "Frontend SPA & Features"
Cohesion: 0.06
Nodes (39): Cart Page Section, Checkout Modal, Confirm Dialog Modal, Customize Item Modal, Edit Menu Item Modal (with Customization Options), Edit Staff Account Modal, Footer with Developer Attribution, Forgot Password Modal (+31 more)

### Community 1 - "Server Core & Auth"
Cohesion: 0.06
Nodes (32): isValidDZPhone(), isValidEmail(), normalizeDZPhone(), app, authenticateToken(), authLimiter, bcrypt, bootstrapAdmin() (+24 more)

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

## Knowledge Gaps
- **116 isolated node(s):** `AdminDashboard`, `AppState`, `ScrollReveal`, `API`, `Router` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 136 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Delicious Restaurant` connect `Frontend SPA & Features` to `Code Quality Skill`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `SPA Entry Point (index.html)` connect `Frontend SPA & Features` to `Admin Dashboard Panels`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Anti-Koshary Skill` connect `Code Quality Skill` to `Frontend SPA & Features`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `AdminDashboard`, `AppState`, `ScrollReveal` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend SPA & Features` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._
- **Should `Server Core & Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.06401137980085349 - nodes in this community are weakly interconnected._
- **Should `Client App Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._