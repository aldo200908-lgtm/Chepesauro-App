# Navegación Vehicular de Alta Precisión en Puno: Zonas Restringidas, Esquinas de Acceso Vehicular y Calles Cerradas

Mejora del motor de enrutamiento de **VerdeGo** para ofrecer una navegación GPS seria, realista y adaptada a la vialidad real de **Puno, Perú**. El sistema evitará automáticamente las zonas peatonales restringidas (como el perímetro de la **Plaza Mayor de Puno** y el **Paseo Peatonal del Jr. Lima**), guiará al motorizado hasta la **esquina de acceso vehicular permitida más cercana** cuando un local o cliente se encuentre dentro de una cuadra peatonal, y permitirá al repartidor **marcar o desmarcar en el mapa 3D calles cerradas o en obras** para recalcular inmediatamente la mejor ruta alterna.

## User Review & Critical Decisions

> [!IMPORTANT]
> Estas decisiones recogen tus respuestas confirmadas para que la ruta 3D respete las restricciones reales de tránsito en Puno.

- **Decisión Confirmada 1 — Bloqueo de Zonas Peatonales + Marcado Interactivo de Calles Cerradas**: Además de excluir por defecto los tramos peatonales de la Plaza Mayor de Puno y del Jr. Lima, el navegador 3D incluirá un modo interactivo **"Reportar calle cerrada / obra"** para tocar cualquier calle del mapa 3D, colocar un bloqueo vial y recalcular la ruta al instante.
- **Decisión Confirmada 2 — Guiar en Moto hasta la Esquina Vehicular Permitida Más Cercana**: Si el comercio o el domicilio del cliente está dentro de una zona peatonal (por ejemplo, frente a la Catedral en la Plaza Mayor o en el Paseo Peatonal Jr. Lima), la ruta en moto terminará en la **esquina vehicular habilitada más próxima** (mostrando un tramo punteado corto de acceso a pie hasta la puerta exacta del local).
- **Decisión Confirmada 3 — Cálculo Automático de la Mejor Ruta Única**: El navegador no saturará la pantalla con múltiples líneas; calculará y dibujará automáticamente **una única ruta óptima (con el estilo morado GTA V)** que rodee todas las zonas prohibidas y los bloqueos activos.

---

## 1. Overview & Core Concept

- **Qué Hace**:
  1. **Exclusión Real en el Motor de Rutas (`exclude=point(...)` + Waypoints de Rodeo Seguro)**: Envía a la API de Mapbox Directions todos los puntos de restricción peatonal de Puno más los puntos de calles cerradas marcados por el motorizado, garantizando que el trazado vehicular nunca cruce por los cantos de la Plaza Mayor ni por el Paseo Peatonal.
  2. **Resolución Inteligente de Acceso Vehicular ("Punto de Estacionamiento / Esquina Permitida")**: Detecta si las coordenadas de recogida o entrega caen dentro de un polígono/radio peatonal restringido. Si es así, asigna automáticamente la **esquina vehicular permitida más cercana** como destino de conducción para la moto y dibuja un conector punteado de últimos metros a pie hasta el local.
  3. **Control Táctil de Calles Cerradas u Obras en el Mapa 3D**: Añade un botón en el navegador 3D para activar el modo **"Bloquear calle / obra"**. Al tocar cualquier vía en el mapa 3D, se añade un marcador de cierre vial (persistido en el dispositivo) y el GPS recalcula de inmediato la mejor ruta alterna sin pasar por ese punto.
- **Audiencia / Rol Objetivo**: Motorizados que operan en el centro histórico de Puno y necesitan rutas reales que respeten calles peatonales, desvíos municipales, ferias y obras viales.
- **Valor Principal**: Convierte el navegador 3D en una herramienta operativa seria y confiable que nunca envía a un vehículo motorizado por pasajes peatonales prohibidos.

---

## 2. User Experience & Visual Design

### Experiencia en el Mapa 3D a Pantalla Completa

1. **Visualización de Zonas Peatonales y Bloqueos Viales en 3D**:
   - Las zonas peatonales fijas (Plaza Mayor y Jr. Lima Peatonal) y los cierres viales reportados por el motorizado se señalizan discretamente en el mapa 3D con iconos de **Restricción Vehicular / Obra Vial**.
2. **Llegada a Locales en Zona Peatonal (Esquina Vehicular + Tramo a Pie)**:
   - La **línea morada estilo GTA V** guía al motorizado por calles 100% vehiculares (como Jr. Arequipa, Jr. Ayacucho, Jr. Tacna, Av. La Torre o Jr. Puno exterior) hasta la **Esquina de Acceso Vehicular Permitida**.
   - Desde esa esquina hasta la puerta exacta del negocio o cliente en la zona peatonal, se muestra una **línea punteada blanca/esmeralda** indicando los últimos metros de ingreso a pie, junto con un aviso claro en el panel: *"Acceso peatonal: estaciona en la esquina vehicular permitida"*.
3. **Modo Interactivo "Marcar Calle Cerrada / Obra"**:
   - En la columna derecha de controles flotantes del navegador 3D, un botón con icono de barrera vial activa el modo **"Marcar calle cerrada"**.
   - Cuando está activo, aparece una banda superior indicando: *"Toca cualquier calle en el mapa 3D para marcarla como cerrada y recalcular ruta"*.
   - Al tocar la calle, se coloca el bloqueo, Mapbox recalcula automáticamente la ruta óptima rodeando el punto bloqueado y el motorizado puede eliminar bloqueos individuales o limpiarlos cuando la vía se reabra.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Uso nativo del parámetro `exclude=point(lng lat)` de Mapbox Directions API v5 combinado con perfil `driving-traffic`**
  - *Enfoque elegido*: Pasar las coordenadas de las cuadras restringidas y de los cierres reportados en el parámetro oficial `exclude` de Mapbox Directions API, además de ajustar automáticamente el punto final de conducción a la esquina vehicular más cercana si el destino cae dentro de un área peatonal.
  - *Por qué*: Si el destino exacto está dentro de la Plaza Mayor, cualquier GPS forzará la entrada a la plaza salvo que se separe la **esquina de parada vehicular** de la **puerta peatonal** y se excluyan los nodos internos de la plaza. Combinar ambos mecanismos garantiza rutas 100% legales y realistas.
- **Decisión 2: Persistencia Local de Calles Cerradas Reportadas**
  - *Enfoque elegido*: Guardar las calles bloqueadas por el motorizado en `localStorage` junto con las zonas peatonales permanentes de Puno.
  - *Por qué*: Permite que los cierres por obras o ferias que marque el repartidor se mantengan activos en todos los pedidos hasta que decida quitarlos.

---

## 4. Technical Architecture & Data Strategy

### Diagrama del Motor de Enrutamiento con Restricciones Viales

```
┌───────────────────────────────────────────────────────────────────────────┐
│                GESTOR DE RESTRICCIONES VIALES (Puno, Perú)                │
│  • Zonas Peatonales Fijas: Plaza Mayor de Puno + Jr. Lima Peatonal        │
│  • Calles Cerradas / Obras: Puntos marcados por el motorizado en el mapa  │
│  • Puntos de Acceso Vehicular: Esquinas permitidas para locales peatonales│
└───────────────────┬───────────────────────────────────────┬───────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│     RESOLUCIÓN DE DESTINO SEGURO      │   │   CONSULTA MAPBOX DIRECTIONS  │
│  • ¿El local/cliente cae en zona      │   │  • Perfil: driving-traffic    │
│    peatonal restringida?              │   │  • Parámetro exclude:         │
│  • SÍ → Destino moto = Esquina        │   │    point(lng lat),point(...)  │
│         vehicular más cercana         │   │  • Devuelve 1 única ruta      │
│         + Tramo corto punteado a pie  │   │    óptima libre de bloqueos   │
└───────────────────┬───────────────────┘   └───────────────┬───────────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│             RENDERIZADO 3D EN PANTALLA COMPLETA (GPSNavigationView)       │
│  • Línea Morada GTA V por vías 100% vehiculares hasta esquina permitida   │
│  • Línea punteada de últimos metros a pie (si aplica)                     │
│  • Botón flotante "Marcar calle cerrada" con recálculo instantáneo        │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mapa de Interacciones y Comportamiento

1. **Detección Automática de Zona Peatonal en Origen o Destino**:
   - Antes de pedir la ruta a Mapbox, una función verifica si el punto de recogida o entrega está dentro del perímetro peatonal de la Plaza Mayor o del Jr. Lima.
   - Si está dentro, resuelve automáticamente la **esquina vehicular permitida más cercana** como punto de llegada de la moto y genera el segmento peatonal corto hasta el punto exacto.
2. **Exclusión de Nodos Prohibidos en Mapbox Directions**:
   - Se construyen los parámetros `exclude=point(lng lat),...` con los lados peatonales de la Plaza Mayor, las cuadras peatonales del Jr. Lima y todos los bloqueos viales añadidos por el usuario.
3. **Herramienta Interactiva de Cierre de Calles en el Navegador 3D**:
   - Botón en el HUD derecho para activar/desactivar el modo **"Bloquear calle"** y botón para restaurar/limpiar cierres temporales.
   - Al hacer clic sobre cualquier calle del mapa 3D con el modo activo, se registra la coordenada bloqueada, se dibuja el marcador de obra/cierre y se recalcula la ruta morada GTA V evitando esa calle.
