# Graph Report - Chepesauro-App  (2026-10-21)

## Corpus Check
- 36 files · ~124,493 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .lock 1)

## Summary
- 283 nodes · 585 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a41d1516`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ordersStore.ts
- GPSNavigationView.tsx
- App.tsx
- package.json
- react
- Design System Master File
- compilerOptions
- dependencies
- 4. Evaluación Estructurada con `design-critique` (`SKILL.md`)
- manifest.json
- devDependencies
- Navegación Vehicular de Alta Precisión en Puno: Zonas Restringidas, Esquinas de Acceso Vehicular y Calles Cerradas
- vercel.json
- sw.js
- OnboardingLayout.tsx

## God Nodes (most connected - your core abstractions)
1. `App()` - 24 edges
2. `react` - 19 edges
3. `GPSNavigationView()` - 18 edges
4. `compilerOptions` - 16 edges
5. `DemoOrder` - 15 edges
6. `@phosphor-icons/react` - 13 edges
7. `calculateDistanceMeters()` - 12 edges
8. `formatPenCurrency()` - 12 edges
9. `MainAppLayout()` - 11 edges
10. `isValidLngLat()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `MapboxViewProps` --references--> `DemoOrder`  [EXTRACTED]
  src/components/MapboxView.tsx → src/utils/ordersStore.ts
- `App()` --calls--> `DriverOrderReviewScreen()`  [EXTRACTED]
  src/App.tsx → src/components/DriverOrderReviewScreen.tsx
- `App()` --calls--> `GPSNavigationView()`  [EXTRACTED]
  src/App.tsx → src/components/GPSNavigationView.tsx
- `App()` --calls--> `MainAppLayout()`  [EXTRACTED]
  src/App.tsx → src/components/MainAppLayout.tsx
- `App()` --calls--> `OnboardingLayout()`  [EXTRACTED]
  src/App.tsx → src/components/OnboardingLayout.tsx

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "ordersStore.ts"
Cohesion: 0.11
Nodes (37): motion, @phosphor-icons/react, ClientOrdersView(), ClientOrdersViewProps, DriverOrderReviewScreen(), DriverOrderReviewScreenProps, DriverOrdersView(), DriverOrdersViewProps (+29 more)

### Community 1 - "GPSNavigationView.tsx"
Cohesion: 0.12
Nodes (34): mapbox-gl, GPSNavigationView(), ManeuverIcon(), MapboxViewProps, MapMarkerPoint, PUNO_COORDINATES, buildMapboxExcludeParam(), calculateBearing() (+26 more)

### Community 2 - "App.tsx"
Cohesion: 0.16
Nodes (25): react-dom, App(), ProfileSelectionScreen(), WelcomeScreen(), WelcomeScreenProps, activateDemoMotorizadoSession(), AppViewMode, confirmRoleSelection() (+17 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (28): name, private, scripts, build, clean, dev, lint, preview (+20 more)

### Community 4 - "react"
Cohesion: 0.18
Nodes (14): lucide-react, react, ClientRole3DRender(), DriverRole3DRender(), Parcel3DRender(), Store3DRender(), PWAInstallButtonProps, RoleCard() (+6 more)

### Community 5 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 7 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, dotenv, express, @google/genai, lucide-react, mapbox-gl, motion, @phosphor-icons/react (+8 more)

### Community 8 - "4. Evaluación Estructurada con `design-critique` (`SKILL.md`)"
Cohesion: 0.14
Nodes (13): 1. Arquitectura de Tokens de 3 Capas (`design-system` + `shadcn-ui`), 2. Tipografía, Escala Móvil y Disciplina Numérica, 3. Reglas de UI/UX Pro Max (`pro-rules.md`), 4.1. What's Working (Fortalezas Reales), 4.2. Priority Issues & Soluciones Aplicadas, 4.3. Heuristic Assessment (10 Heurísticas de Nielsen), 4.4. Gestalt Principles Check, 4.5. JTBD Alignment (Jobs-to-be-Done) (+5 more)

### Community 9 - "manifest.json"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, id, name, orientation, scope (+3 more)

### Community 10 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, esbuild, tailwindcss, tsx, @types/express, @types/mapbox-gl, @types/node (+3 more)

### Community 11 - "Navegación Vehicular de Alta Precisión en Puno: Zonas Restringidas, Esquinas de Acceso Vehicular y Calles Cerradas"
Cohesion: 0.20
Nodes (9): 1. Overview & Core Concept, 2. User Experience & Visual Design, 3. Key Product Decisions & Trade-Offs, 4. Technical Architecture & Data Strategy, Diagrama del Motor de Enrutamiento con Restricciones Viales, Experiencia en el Mapa 3D a Pantalla Completa, Mapa de Interacciones y Comportamiento, Navegación Vehicular de Alta Precisión en Puno: Zonas Restringidas, Esquinas de Acceso Vehicular y Calles Cerradas (+1 more)

### Community 12 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, headers, outputDirectory

### Community 14 - "OnboardingLayout.tsx"
Cohesion: 0.33
Nodes (9): three, OnboardingLayout(), OnboardingLayoutProps, STEP_LABELS, OnboardingSpatialStage(), OnboardingSpatialStageProps, ProfileSelectionScreenProps, OnboardingStepNumber (+1 more)

## Knowledge Gaps
- **14 isolated node(s):** `@google/genai`, `@types/three`, `dotenv`, `express`, `@types/express` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 139 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `ordersStore.ts`, `GPSNavigationView.tsx`, `App.tsx`, `package.json`, `OnboardingLayout.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `@google/genai`, `@types/three`, `dotenv` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ordersStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10993657505285412 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `GPSNavigationView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12439024390243902 - nodes in this community are weakly interconnected._
- **Why does `@phosphor-icons/react` connect `ordersStore.ts` to `GPSNavigationView.tsx`, `App.tsx`, `package.json`, `react`, `OnboardingLayout.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06881720430107527 - nodes in this community are weakly interconnected._