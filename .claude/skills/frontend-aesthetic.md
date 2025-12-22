<turbopuffer_gui_aesthetics> You tend to default to generic SaaS dashboards
(Inter, rounded cards, purple gradients). For Turbopuffer, that’s wrong.

Design a GUI that feels like a _serious database client_ for engineers:

- Functionality on par with tools like DataGrip, MongoDB Compass, and phpMyAdmin
- Aesthetic inspired by terminals, TUIs, and Turbopuffer’s own brand (monospace,
  ASCII diagrams, object-storage diagrams, pufferfish mascot)
- Built for long sessions, keyboard-heavy workflows, and dense information

HIGH-LEVEL AESTHETIC

- Default to a _terminal-like dark theme_: deep ink / navy background,
  high-contrast off‑white text, subtle colored accents (sea‑blue, cyan, muted
  greens).
- Everything should feel like a modern terminal + IDE hybrid, not a marketing
  site.
- Avoid noisy gradients and trendy “AI slop” visuals. Think precise,
  utilitarian, minimal.

TYPOGRAPHY

- Use a _monospace-first_ typography system.
- Recommended families (pick 1–2 max): JetBrains Mono, Iosevka, IBM Plex Mono,
  DM Mono, Space Mono.
- Never use: Inter, Roboto, Open Sans, Lato, Arial, generic system UI stacks.
- Use weight and size for hierarchy instead of changing font families:
  - Heavy monospace for headers / panel titles.
  - Normal weight for body and table content.
  - Slightly tighter letterspacing for navigation / status bars to feel
    “terminally dense”.
- Keep base font size very legible for long-running sessions (e.g. 14–15px
  equivalent), with small increments between levels.

COLOR & THEME

- Think “high-end terminal / IDE”:
  - Backgrounds: deep navy / charcoal for app background; slightly lighter
    panels for separation.
  - Primary accent: ocean/sea inspired cyan or blue (matching the Turbopuffer
    brand feel) for selection, active states, links, and query run buttons.
  - Secondary accents: muted green for success, amber for warnings, soft red for
    errors.
  - Use _very limited_ accent colors; let monochrome UI do most of the work.
- Define and consistently use CSS variables for the palette:
  - `--tp-bg`, `--tp-surface`, `--tp-surface-alt`
  - `--tp-border-subtle`, `--tp-border-strong`
  - `--tp-text`, `--tp-text-muted`, `--tp-text-faint`
  - `--tp-accent`, `--tp-accent-soft`
  - `--tp-danger`, `--tp-warning`, `--tp-success`
- Avoid:
  - Generic blue/purple gradients on white.
  - Overly colorful charts and candy-colored buttons.
  - Large areas of pure white — light themes should still feel like “paper
    terminal” (muted, low-glare backgrounds).

LAYOUT: “DATABASE CLIENT FOR TURBOPUFFER” Design layouts that clearly support
Turbopuffer workflows (vector + full-text search on object storage):

- Left rail: hierarchical navigation (connections → projects → namespaces →
  collections/index-like entities). Use a tree view similar to IDE project
  explorers.
- Main content: tabbed workspace.
  - Query editor tabs (vector search, full-text search, hybrid, raw JSON
    queries).
  - Data viewer tabs (documents, aggregations, schema, sample queries).
  - Metrics tabs (latency, throughput, cache warm vs cold, cost visibility).
- Query editor:
  - Top: monospace query input (JSON / DSL / HTTP payload style) with line
    numbers, syntax highlighting, inline validation, and a “Run query” button on
    the right.
  - Bottom: split view for results:
    - Table/grid of documents (sortable, filterable, horizontally scrollable).
    - Optional JSON/raw view, and “explain” / stats (latency, p50–p99, cache
      hit, vector vs BM25 contribution).
- Right-side inspector:
  - Shows selected document details, schema information, namespace metadata, or
    index configuration in a dense, monospace layout.
- Bottom status bar:
  - Current connection, namespace, latency of last query, cache state (cold /
    warm), and small logs or notifications.

TERMINAL / TUI FEEL

- Use sharp geometry: small or zero border radius, clear 1px borders, and strong
  alignment to a baseline grid.
- Use separators and “panels” instead of soft card shadows:
  - Hairline borders, subtle inner shadows, or dotted/ASCII-inspired separators
    (`···`, `──`, `│`).
- Incorporate tasteful terminal motifs:
  - Status lines with prefixed labels (e.g.
    `[namespace: logs-prod] [top_k: 50] [ANN+BM25]`).
  - Prompt-like elements (`>`, `$`, or `tpuf>`), especially in command palettes
    or quick actions.
  - Optional ASCII diagrams to represent architecture or data flows (like in
    Turbopuffer’s docs), but keep them sparse and purposeful.

INTERACTION & MOTION

- Favor _fast, minimal animation_:
  - Micro-transitions for panel resizing, tab changes, results appearing.
  - Subtle fades and translateY/scale transitions with short durations; no
    bouncy easing.
- Keyboard-first:
  - Design with command palette / quick open in mind (e.g. “Cmd+K” style
    overlay).
  - Clear focus states in all components: visible outlines or underline + accent
    color, never relying solely on color changes.
- Query feedback:
  - On run, show an inline compact summary bar above results:
    - `Query ANN+BM25 • 10k docs scanned • 50 results • p50 8ms • cache: warm`.
  - Use color sparingly to highlight anomalies (slow query, cold cache, high
    cost).

COMPONENT STYLE

- Tables:
  - Dense row height, monospace content, left-aligned keys, right-aligned
    numeric metrics.
  - Hover row states with subtle background change, not heavy accent color.
  - Support pinned columns, horizontal scrolling, and inline filters in headers.
- Forms & filters:
  - Inline, compact controls (inputs, dropdowns, tag-style filters) that feel
    like “flags” on a CLI command.
  - Use monospace for field labels and values to maintain the terminal feel.
- Charts:
  - Minimalist line and bar charts with 1–2 colors max, embedded within panels;
    no big marketing-style hero charts.
  - Prefer sparkline-style charts embedded in tables for query performance over
    time.

AVOID GENERIC AI AESTHETICS Explicitly avoid:

- Inter/Roboto/system fonts
- Soft, rounded “SaaS” cards and neumorphism
- White backgrounds with purple or blue gradients
- Overly large icons, emoji-heavy titles, or playful illustration styles

TONE & MICROCOPY

- Copy should sound like a serious, performance-oriented infra tool:
  - Concise, technical, and precise.
  - Surface the facts: latency, recalls, top_k, write throughput, cache state.
- Use consistent terminology from Turbopuffer’s docs: namespaces, vectors, BM25,
  hybrid search, object storage, cache, aggregations.

SUMMARY Create a Turbopuffer GUI that:

- Looks like a terminal-native IDE for object-storage search,
- Feels cohesive, minimal, and brand-aligned,
- Surfaces complex DB-client functionality (à la DataGrip/Compass/phpMyAdmin)
  without slipping into generic SaaS dashboards. Follow these principles in
  every layout, component, and code sample. </turbopuffer_gui_aesthetics>
