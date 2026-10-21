# VerdeGo — Design System, UI/UX Pro Max & Design Critique (`DESIGN_SYSTEM.md`)

Sistema de diseño y auditoría estructurada para **VerdeGo** (Logística Urbana y Delivery en Puno, Perú), construido a partir de las 4 skills instaladas en el proyecto:
1. **`frontend-design`** (`/skills/system_skills/frontend_design/SKILL.md` + `10_mobile_touch_apps.md`)
2. **`shadcn-ui`** (`/skills/system_skills/shadcn/SKILL.md`)
3. **`ui-ux-pro-max` + `design-system`** (`/.skills/ui-ux-pro-max/...` y `design-system/verdego/MASTER.md`)
4. **`design-critique`** (`/.skills/design-critique/SKILL.md`)

---

## 1. Arquitectura de Tokens de 3 Capas (`design-system` + `shadcn-ui`)

Siguiendo la arquitectura de tres capas (`Primitive → Semantic → Component`) definida en `.skills/ui-ux-pro-max/.../design-system/SKILL.md`:

### Capa 1: Tokens Primitivos (`Primitive`)
| Variable CSS | Valor Hex | Descripción |
| :--- | :--- | :--- |
| `--emerald-950` | `#0A221C` | Verde abisal para paneles HUD nocturnos |
| `--emerald-900` | `#102F27` | Tinta principal de máximo contraste |
| `--emerald-800` | `#064B3C` | Verde profundo para estados `:hover` / `:active` |
| `--emerald-600` | `#078F68` | Verde identidad principal de VerdeGo |
| `--emerald-200` | `#DCECE5` | Divisor estructural y borde de tarjeta |
| `--emerald-100` | `#EAF8F2` | Superficie tintada suave |
| `--emerald-50` | `#F6FAF8` | Lienzo base de la aplicación móvil |
| `--slate-green-600` | `#527368` | Tinta secundaria accesible (contraste WCAG AA `4.8:1` sobre `#FFFFFF`) |
| `--purple-600` | `#9333EA` | Púrpura neón para ruta 3D estilo GTA V |
| `--purple-300` | `#F0ABFC` | Resaltado luminoso en HUD de conducción 3D |

### Capa 2: Tokens Semánticos (`Semantic`)
- `--background`: `var(--emerald-50)`
- `--foreground`: `var(--emerald-900)`
- `--primary`: `var(--emerald-600)`
- `--secondary`: `var(--emerald-100)`
- `--muted-foreground`: `var(--slate-green-600)`
- `--border`: `var(--emerald-200)`
- `--destructive`: `#DC2626`
- `--warning`: `#D97706`

### Capa 3: Tokens de Componente (`Component`)
- `--button-primary-bg`: `var(--primary)`
- `--button-nav3d-bg`: `var(--color-nav-accent)`
- `--card-bg`: `var(--card)`
- `--bottom-nav-bg`: `rgba(255, 255, 255, 0.96)`
- `--hud-panel-bg`: `rgba(10, 34, 28, 0.95)`

---

## 2. Tipografía, Escala Móvil y Disciplina Numérica

- **Display (`--font-display`)**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Sans / Lectura (`--font-sans`)**: `'DM Sans', system-ui, -apple-system, sans-serif`
- **Números Tabulares (`tabular-nums`)**: Obligatorios en tarifas (`S/`), distancias (`km`/`m`), tiempos de llegada (`min`), grados de brújula (`245° SO`) y contadores de pedidos.

---

## 3. Reglas de UI/UX Pro Max (`pro-rules.md`)

1. **Tamaño y separación de objetivos táctiles (`Touch Target Minimum & Spacing`)**:
   - Altura mínima de `44px` (`h-11` / `h-12` / `h-14`) en todos los botones primarios, secundarios y controles flotantes del mapa.
   - Separación mínima de `8px` (`gap-2`) entre botones interactivos adyacentes para evitar toques accidentales en conducción o movimiento.
2. **Estabilidad de interacción (`Stable Interaction States`)**:
   - Feedback táctil rápido (`80–150ms`) mediante color, opacidad y sombra sin desplazar el layout circundante.
3. **Semántica de iconos (`@phosphor-icons/react`)**:
   - Una sola familia de iconos vectoriales consistente (`duotone` en reposo, `fill` en estado activo, `bold` en acciones direccionales).
   - `aria-hidden="true"` en iconos decorativos junto a texto visible y `aria-label` + `aria-pressed` en botones de solo icono sobre el mapa 3D.
4. **Respeto a `prefers-reduced-motion`**:
   - Regla global en `src/index.css` que desactiva animaciones no esenciales cuando el sistema operativo solicita movimiento reducido.

---

## 4. Evaluación Estructurada con `design-critique` (`SKILL.md`)

**User goal:** Escoger un pedido disponible como motorizado en Puno, revisar sus datos completos (tienda/agente, productos, pago y accesos peatonales) y completar la navegación guiada 3D en 2 etapas (Tienda → Cliente) evitando zonas restringidas como la Plaza Mayor.
**Context:** Aplicación web móvil progresiva (PWA) / Alta fidelidad en producción.
**Critique focus:** Claridad del flujo operativo del motorizado, ergonomía táctil y legibilidad del HUD 3D.

### 4.1. What's Working (Fortalezas Reales)
- **Jerarquía visual orientada a la tarea (Inicio → Revisión → GPS 3D)**: La tarjeta de pedido agrupa origen, destino, contenido y tarifa con un CTA inequívoco (`Aceptar pedido y revisar datos`), guiando la vista de arriba hacia abajo sin ruido decorativo.
- **Contraste dual adaptado al entorno**: Modo claro de alto contraste (`#102F27` sobre `#FFFFFF`) para revisar pedidos bajo luz diurna y HUD oscuro (`#0A221C/95`) con línea de ruta púrpura brillante (`#A855F7` / `#F0ABFC`) durante la conducción 3D.
- **Prevención de errores viales en Puno**: El sistema detecta automáticamente destinos dentro de la Plaza Mayor o Jr. Lima peatonal y ajusta la ruta vehicular a la esquina permitida más cercana indicando los metros a pie.

### 4.2. Priority Issues & Soluciones Aplicadas
- 🟡 **Medium — Issue 1: Separación táctil e hit-targets en acciones secundarias de pedidos**
  - **What's happening:** Los botones secundarios (`Ver datos` y `Navegar 3D`) tenían `36px` (`h-9`) y separación de `6px` (`gap-1.5`).
  - **Why it matters:** Un motorizado operando el teléfono con una mano o soporte de manubrio puede tocar el botón equivocado.
  - **Framework reference:** Ley de Fitts y regla `Touch Target Size & Spacing` de `ui-ux-pro-max` (`>= 44px` de alto y `>= 8px` de separación).
  - **Recommendation (Aplicada):** Elevar ambos controles a `44px` (`h-11`) con `gap-2` (`8px`) entre ellos.
- 🟡 **Medium — Issue 2: Visibilidad del estado activado en controles flotantes del mapa 3D**
  - **What's happening:** Los controles flotantes (`Mira`, `3D/2D`, `Bloquear calle`, `Voz`) cambiaban de color pero no exponían `aria-pressed` para tecnologías de asistencia.
  - **Framework reference:** Heurística #1 de Nielsen (Visibilidad del estado del sistema) y regla `Contextual Semantics` de `ui-ux-pro-max`.
  - **Recommendation (Aplicada):** Añadir `aria-pressed` y mantener un tamaño uniforme de `44x44px` (`w-11 h-11`) con `gap-2`.

### 4.3. Heuristic Assessment (10 Heurísticas de Nielsen)
| Heurística | Estado | Nota |
| :--- | :--- | :--- |
| 1. Visibilidad del estado del sistema | ✅ Pass | Muestra etapa activa (1 o 2), estado del GPS (`±m`), dirección exacta y rumbo cardinal en tiempo real. |
| 2. Relación entre el sistema y el mundo real | ✅ Pass | Usa referencias reales de Puno (Plaza Mayor, Jr. Lima, Laykakota, Bellavista) y moneda local (`S/`). |
| 3. Control y libertad del usuario | ✅ Pass | Permite salir de la navegación 3D, volver al inicio desde la hoja de datos o abrir/cerrar Bottom Sheets (`vaul`). |
| 4. Consistencia y estándares | ✅ Pass | Tres pestañas inferiores claras (`Inicio`, `Pedidos`, `Perfil`) e iconografía unificada con `@phosphor-icons/react`. |
| 5. Prevención de errores | ✅ Pass | Evita automáticamente trazar rutas vehiculares por calles peatonales de Puno y bloquea doble asignación de pedidos. |
| 6. Reconocer antes que recordar | ✅ Pass | El Bottom Sheet de **Vista rápida** y el de **Pasos** muestran toda la información sin obligar a memorizar direcciones. |
| 7. Flexibilidad y eficiencia de uso | ✅ Pass | Permite ir directo a `Navegar 3D` en pedidos ya aceptados o revisar el desglose completo cuando se necesita. |
| 8. Diseño estético y minimalista | ✅ Pass | Cumple la disciplina de cero píldoras decorativas; cada borde y color comunica estado o acción. |
| 9. Ayudar a reconocer y recuperarse de errores | ✅ Pass | Si el permiso de GPS es denegado o no hay pedidos disponibles, ofrece botones directos de recuperación. |
| 10. Ayuda y documentación | ✅ Pass | Incluye indicaciones explícitas para el motorizado y aviso de acceso peatonal en esquina cuando corresponde. |

### 4.4. Gestalt Principles Check
- **Proximity (Proximidad):** El bloque `De (Recogida)` y `A (Entrega)` está agrupado dentro de un contenedor interno (`rounded-2xl bg-[#F6FAF8]`), separándolo claramente del precio y de los botones de acción.
- **Similarity (Similitud):** Todos los botones de navegación 3D comparten el token `--button-nav3d-bg` (`#9333EA`), mientras que las acciones operativas de pedido usan `--button-primary-bg` (`#078F68`).
- **Figure/Ground (Figura/Fondo):** El lienzo `#F6FAF8` separa nítidamente las tarjetas `#FFFFFF`, y el panel HUD `#0A221C/95` destaca sobre el mapa 3D sin ocultar la línea de ruta.

### 4.5. JTBD Alignment (Jobs-to-be-Done)
- **Trabajo principal:** *"Cuando estoy trabajando como motorizado en Puno, quiero escoger un pedido cercano, saber exactamente qué recoger y dónde entregarlo, y seguir una ruta 3D legal sin meterme en calles peatonales prohibidas."*
- **Trabajo emocional:** **Confianza y velocidad operativa** — respaldado por tiempos de respuesta inmediatos, números tabulares claros y confirmación por etapas.
