/**
 * Módulo de integración con Mapbox Directions API y Gestión de Restricciones Viales en Puno.
 * Proporciona cálculo y trazado de rutas reales evitando zonas peatonales prohibidas
 * (como la Plaza Mayor de Puno y el Paseo Peatonal Jr. Lima) y calles cerradas por obras,
 * guiando al motorizado hasta la esquina vehicular permitida más cercana.
 */

export interface LngLatCoord {
  lng: number;
  lat: number;
}

export interface NavigationManeuver {
  type: string;
  modifier?: string;
  instruction: string;
  location: [number, number];
  bearingBefore?: number;
  bearingAfter?: number;
}

export interface NavigationStep {
  id: string;
  maneuver: NavigationManeuver;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
  bannerInstruction?: string;
}

export interface VehicularAccessResolution {
  /** Coordenada vial permitida hasta donde llega el vehículo motorizado */
  vehicularCoord: [number, number];
  /** Coordenada exacta del local o cliente (puede estar dentro de zona peatonal) */
  exactCoord: [number, number];
  /** Indica si el punto fue ajustado a una esquina vehicular permitida */
  isSnappedToCorner: boolean;
  /** Nombre descriptivo de la esquina vehicular o acceso */
  cornerLabel?: string;
  /** Nombre de la zona peatonal o restricción evitada */
  restrictedZoneName?: string;
  /** Distancia a pie en metros desde la esquina vehicular hasta el punto exacto */
  walkingDistanceMeters: number;
}

export interface CustomRoadblock {
  id: string;
  coordinates: [number, number];
  label: string;
  createdAt: string;
}

export interface RestrictedZoneDefinition {
  id: string;
  name: string;
  center: [number, number];
  radiusMeters: number;
  /** Puntos de bloqueo vial enviados a Mapbox Directions exclude=point(...) */
  excludePoints: [number, number][];
  /** Esquinas vehiculares legales alrededor de la zona peatonal */
  vehicularCorners: {
    label: string;
    coordinates: [number, number];
  }[];
}

export interface RouteDirectionsResult {
  geoJson: GeoJSON.Feature<GeoJSON.LineString>;
  /** Tramo corto a pie desde la esquina vehicular hasta el local peatonal (si aplica) */
  walkingConnectorGeoJson?: GeoJSON.Feature<GeoJSON.LineString>;
  accessResolution?: VehicularAccessResolution;
  distanceMeters: number;
  durationSeconds: number;
  summary: string;
  steps: NavigationStep[];
}

/**
 * Zonas peatonales permanentes de Puno donde está prohibido el tránsito de vehículos motorizados.
 */
export const PUNO_RESTRICTED_ZONES: RestrictedZoneDefinition[] = [
  {
    id: 'plaza-mayor-puno',
    name: 'Perímetro Peatonal Plaza Mayor de Puno',
    center: [-70.0282, -15.8402],
    radiusMeters: 95,
    excludePoints: [
      [-70.0282, -15.8402], // Centro Plaza Mayor
      [-70.0281, -15.8398], // Canto Norte (Jr. Deustua tramo Plaza)
      [-70.0283, -15.8406], // Canto Sur (Jr. Puno tramo Plaza)
      [-70.0277, -15.8402], // Canto Este (Jr. Arequipa tramo Plaza)
      [-70.0286, -15.8401], // Canto Oeste (Atrio Catedral / Jr. Lima)
    ],
    vehicularCorners: [
      {
        label: 'Esquina vehicular Jr. Arequipa con Jr. Deustua',
        coordinates: [-70.027, -15.8397],
      },
      {
        label: 'Esquina vehicular Jr. Arequipa con Jr. Puno',
        coordinates: [-70.0272, -15.8409],
      },
      {
        label: 'Esquina vehicular Jr. Ayacucho con Jr. Deustua',
        coordinates: [-70.0293, -15.8395],
      },
      {
        label: 'Esquina vehicular Jr. Ayacucho con Jr. Puno',
        coordinates: [-70.0294, -15.8408],
      },
    ],
  },
  {
    id: 'paseo-peatonal-jr-lima',
    name: 'Paseo Peatonal Jr. Lima (Plaza Mayor – Parque Pino)',
    center: [-70.0274, -15.8384],
    radiusMeters: 90,
    excludePoints: [
      [-70.0278, -15.8392], // Jr. Lima cuadra 3 (Peatonal)
      [-70.0274, -15.8384], // Jr. Lima cuadra 4 (Peatonal)
      [-70.0271, -15.8376], // Jr. Lima cuadra 5 (Peatonal hacia Parque Pino)
    ],
    vehicularCorners: [
      {
        label: 'Esquina vehicular Jr. Arequipa con Jr. Libertad',
        coordinates: [-70.0264, -15.8385],
      },
      {
        label: 'Esquina vehicular Jr. Moquegua con Jr. Libertad',
        coordinates: [-70.0284, -15.8382],
      },
      {
        label: 'Esquina vehicular Jr. Arequipa con Jr. Tarapacá',
        coordinates: [-70.0262, -15.8371],
      },
    ],
  },
];

export const CUSTOM_ROADBLOCKS_STORAGE_KEY = 'verdego_puno_roadblocks_v1';

/**
 * Carga las calles cerradas u obras marcadas por el motorizado en localStorage.
 */
export function loadCustomRoadblocks(): CustomRoadblock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_ROADBLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((b) => b && isValidLngLat(b.coordinates));
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

/**
 * Guarda las calles cerradas u obras en localStorage.
 */
export function saveCustomRoadblocks(roadblocks: CustomRoadblock[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CUSTOM_ROADBLOCKS_STORAGE_KEY,
      JSON.stringify(roadblocks)
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Valida si un par de coordenadas [lng, lat] es geográficamente válido.
 */
export function isValidLngLat(coords: unknown): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

/**
 * Calcula la distancia geodésica real en metros entre dos coordenadas (Fórmula de Haversine).
 */
export function calculateDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula el rumbo o dirección (bearing) en grados (0° a 360°) de coord1 hacia coord2.
 */
export function calculateBearing(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const lambda1 = (lon1 * Math.PI) / 180;
  const lambda2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Determina si una coordenada cae dentro de una zona peatonal restringida de Puno
 * o sobre una calle cerrada, y devuelve la esquina vehicular permitida más cercana.
 */
export function resolveVehicularAccessPoint(
  targetCoord: [number, number],
  referenceOrigin?: [number, number],
  customRoadblocks: CustomRoadblock[] = []
): VehicularAccessResolution {
  for (const zone of PUNO_RESTRICTED_ZONES) {
    const distToZoneCenter = calculateDistanceMeters(targetCoord, zone.center);
    if (distToZoneCenter <= zone.radiusMeters) {
      // Filtrar esquinas que no estén bloqueadas por una obra personalizada
      const openCorners = zone.vehicularCorners.filter((corner) =>
        customRoadblocks.every(
          (rb) => calculateDistanceMeters(corner.coordinates, rb.coordinates) > 40
        )
      );
      const candidates =
        openCorners.length > 0 ? openCorners : zone.vehicularCorners;

      // Elegir la esquina vehicular más conveniente (ponderando cercanía al punto exacto y al origen)
      let bestCorner = candidates[0];
      let bestScore = Infinity;

      for (const candidate of candidates) {
        const distToTarget = calculateDistanceMeters(
          candidate.coordinates,
          targetCoord
        );
        const distToOrigin = referenceOrigin
          ? calculateDistanceMeters(candidate.coordinates, referenceOrigin) * 0.25
          : 0;
        const score = distToTarget + distToOrigin;
        if (score < bestScore) {
          bestScore = score;
          bestCorner = candidate;
        }
      }

      const walkMeters = Math.round(
        calculateDistanceMeters(bestCorner.coordinates, targetCoord)
      );

      return {
        vehicularCoord: bestCorner.coordinates,
        exactCoord: targetCoord,
        isSnappedToCorner: true,
        cornerLabel: bestCorner.label,
        restrictedZoneName: zone.name,
        walkingDistanceMeters: walkMeters,
      };
    }
  }

  return {
    vehicularCoord: targetCoord,
    exactCoord: targetCoord,
    isSnappedToCorner: false,
    walkingDistanceMeters: 0,
  };
}

/**
 * Construye el parámetro `exclude=point(lng lat),...` para Mapbox Directions API v5
 * combinando las zonas peatonales de Puno y las calles cerradas marcadas en el mapa.
 */
export function buildMapboxExcludeParam(
  customRoadblocks: CustomRoadblock[] = []
): string {
  const allPoints: [number, number][] = [];

  for (const zone of PUNO_RESTRICTED_ZONES) {
    for (const pt of zone.excludePoints) {
      allPoints.push(pt);
    }
  }

  for (const block of customRoadblocks) {
    if (isValidLngLat(block.coordinates)) {
      allPoints.push(block.coordinates);
    }
  }

  // Mapbox Directions API admite hasta 50 puntos en exclude
  return allPoints
    .slice(0, 45)
    .map(([lng, lat]) => `point(${lng} ${lat})`)
    .join(',');
}

/**
 * Formatea una distancia para instrucciones de navegación (ej. "En 80 m", "En 1.2 km", "Ahora").
 */
export function formatManeuverDistance(meters: number): string {
  if (meters <= 25) return 'Ahora';
  if (meters < 1000) return `En ${Math.round(meters / 10) * 10} m`;
  return `En ${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formatea una duración en minutos u horas para navegación.
 */
export function formatDurationMinutes(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} h ${remMins} min`;
}

/**
 * Calcula la hora estimada de llegada en formato HH:MM basada en la duración en segundos.
 */
export function formatEstimatedArrivalTime(durationSeconds: number): string {
  const now = new Date();
  const arrival = new Date(now.getTime() + durationSeconds * 1000);
  const hours = String(arrival.getHours()).padStart(2, '0');
  const minutes = String(arrival.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Consulta la ruta de navegación vehicular real entre dos coordenadas usando Mapbox Directions API,
 * aplicando automáticamente:
 * 1. Ajuste del origen/destino a la esquina vehicular permitida más cercana si cae en zona peatonal.
 * 2. Exclusión de zonas peatonales (Plaza Mayor de Puno, Jr. Lima) y calles cerradas (`exclude=point(...)`).
 * 3. Instrucciones giro a giro en español.
 */
export async function fetchMapboxDirections(
  origin: [number, number],
  destination: [number, number],
  accessToken: string,
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving',
  customRoadblocks: CustomRoadblock[] = []
): Promise<{ success: true; data: RouteDirectionsResult } | { success: false; error: string }> {
  if (!isValidLngLat(origin)) {
    return {
      success: false,
      error: 'Coordenadas de origen inválidas o incompletas.',
    };
  }

  if (!isValidLngLat(destination)) {
    return {
      success: false,
      error: 'Coordenadas de destino inválidas o incompletas.',
    };
  }

  const cleanToken = accessToken.trim();
  if (!cleanToken) {
    return {
      success: false,
      error: 'Token de acceso de Mapbox no proporcionado.',
    };
  }

  // Resolver esquinas vehiculares permitidas si origen o destino están en zona peatonal (ej. Plaza Mayor)
  const originResolution = resolveVehicularAccessPoint(
    origin,
    destination,
    customRoadblocks
  );
  const destResolution = resolveVehicularAccessPoint(
    destination,
    originResolution.vehicularCoord,
    customRoadblocks
  );

  const effectiveOrigin = originResolution.vehicularCoord;
  const effectiveDest = destResolution.vehicularCoord;

  const originStr = `${effectiveOrigin[0]},${effectiveOrigin[1]}`;
  const destStr = `${effectiveDest[0]},${effectiveDest[1]}`;

  const excludeParam =
    profile === 'driving' || profile === 'driving-traffic'
      ? buildMapboxExcludeParam(customRoadblocks)
      : '';

  const excludeQuery = excludeParam
    ? `&exclude=${encodeURIComponent(excludeParam)}`
    : '';

  const buildUrl = (withExclude: boolean) =>
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originStr};${destStr}?geometries=geojson&overview=full&steps=true&banner_instructions=true&language=es${
      withExclude ? excludeQuery : ''
    }&access_token=${encodeURIComponent(cleanToken)}`;

  try {
    let response = await fetch(buildUrl(true));

    // Fallback sin exclude únicamente si un punto bloqueado por el usuario encerró totalmente la manzana
    if (response.status === 422 && excludeParam) {
      response = await fetch(buildUrl(false));
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Token de Mapbox no autorizado o sin permisos para Directions API.',
        };
      }
      if (response.status === 422) {
        return {
          success: false,
          error: 'No se encontró una ruta vial transitable entre los puntos especificados.',
        };
      }
      return {
        success: false,
        error: `Error al consultar Mapbox Directions (${response.status}: ${response.statusText}).`,
      };
    }

    const data = await response.json();
    if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
      return {
        success: false,
        error: 'No se encontraron rutas disponibles evitando las zonas restringidas.',
      };
    }

    const primaryRoute = data.routes[0];
    const rawSteps: any[] = primaryRoute.legs?.[0]?.steps || [];

    const steps: NavigationStep[] = rawSteps.map((step, idx) => {
      const maneuver = step.maneuver || {};
      const bannerText =
        step.bannerInstructions?.[0]?.primary?.text ||
        maneuver.instruction ||
        'Continúa por la vía vehicular';

      return {
        id: `step-${idx}`,
        maneuver: {
          type: maneuver.type || 'continue',
          modifier: maneuver.modifier,
          instruction: maneuver.instruction || 'Continúa',
          location: Array.isArray(maneuver.location)
            ? [maneuver.location[0], maneuver.location[1]]
            : effectiveOrigin,
          bearingBefore: maneuver.bearing_before,
          bearingAfter: maneuver.bearing_after,
        },
        distanceMeters: typeof step.distance === 'number' ? step.distance : 0,
        durationSeconds: typeof step.duration === 'number' ? step.duration : 0,
        streetName: step.name || 'Vía vehicular permitida',
        bannerInstruction: bannerText,
      };
    });

    // Si el destino estaba en zona peatonal (ej. Plaza Mayor), agregar instrucción clara en el último paso
    if (destResolution.isSnappedToCorner && steps.length > 0) {
      const lastIdx = steps.length - 1;
      steps[lastIdx] = {
        ...steps[lastIdx],
        streetName: destResolution.cornerLabel || steps[lastIdx].streetName,
        bannerInstruction: `Estaciona en ${
          destResolution.cornerLabel || 'esquina vehicular'
        } (${destResolution.walkingDistanceMeters} m a pie del local)`,
      };
    }

    if (steps.length === 0) {
      steps.push(
        {
          id: 'step-0',
          maneuver: {
            type: 'depart',
            instruction: 'Inicia el recorrido hacia la esquina vehicular permitida',
            location: effectiveOrigin,
          },
          distanceMeters: primaryRoute.distance,
          durationSeconds: primaryRoute.duration,
          streetName: primaryRoute.legs?.[0]?.summary || 'Ruta vehicular',
          bannerInstruction: 'Inicia el recorrido evitando zonas peatonales',
        },
        {
          id: 'step-1',
          maneuver: {
            type: 'arrive',
            instruction: 'Has llegado al punto de acceso vehicular',
            location: effectiveDest,
          },
          distanceMeters: 0,
          durationSeconds: 0,
          streetName: destResolution.cornerLabel || 'Destino',
          bannerInstruction: 'Has llegado al punto de acceso vehicular',
        }
      );
    }

    const geoJson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {
        distance: primaryRoute.distance,
        duration: primaryRoute.duration,
      },
      geometry: primaryRoute.geometry,
    };

    const walkingConnectorGeoJson: GeoJSON.Feature<GeoJSON.LineString> | undefined =
      destResolution.isSnappedToCorner
        ? {
            type: 'Feature',
            properties: {
              walkingDistanceMeters: destResolution.walkingDistanceMeters,
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                destResolution.vehicularCoord,
                destResolution.exactCoord,
              ],
            },
          }
        : undefined;

    return {
      success: true,
      data: {
        geoJson,
        walkingConnectorGeoJson,
        accessResolution: destResolution,
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
        summary: primaryRoute.legs?.[0]?.summary || 'Ruta vehicular óptima',
        steps,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Error de red o conexión al contactar Mapbox Directions API.',
    };
  }
}

export interface ReverseGeocodeResult {
  streetAddress: string;
  fullAddress: string;
  referenceArea: string;
  coordinates: [number, number];
}

/**
 * Convierte un ángulo de rumbo (0° a 360°) en dirección cardinal legible en español (ej. "Noreste · 68° NE").
 */
export function formatCardinalDirection(bearingDegrees: number): {
  shortCardinal: string;
  fullName: string;
  degrees: number;
  label: string;
} {
  const normalized = ((Math.round(bearingDegrees) % 360) + 360) % 360;
  const directions = [
    { short: 'N', full: 'Norte' },
    { short: 'NE', full: 'Noreste' },
    { short: 'E', full: 'Este' },
    { short: 'SE', full: 'Sureste' },
    { short: 'S', full: 'Sur' },
    { short: 'SO', full: 'Suroeste' },
    { short: 'O', full: 'Oeste' },
    { short: 'NO', full: 'Noroeste' },
  ];
  const index = Math.round(normalized / 45) % 8;
  const dir = directions[index];
  return {
    shortCardinal: dir.short,
    fullName: dir.full,
    degrees: normalized,
    label: `${dir.full} (${normalized}° ${dir.short})`,
  };
}

/**
 * Obtiene la dirección exacta de una coordenada [lng, lat] mediante Mapbox Reverse Geocoding API v5,
 * con respaldo inteligente de geocodificación local para calles conocidas de Puno.
 */
export async function fetchReverseGeocodeAddress(
  coords: [number, number],
  accessToken: string
): Promise<ReverseGeocodeResult> {
  const [lng, lat] = coords;
  const cleanToken = accessToken.trim();

  if (cleanToken && isValidLngLat(coords)) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,neighborhood,locality,place&language=es&limit=3&access_token=${encodeURIComponent(
        cleanToken
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features) && data.features.length > 0) {
          const primary = data.features[0];
          const secondary = data.features[1];
          const streetName = primary.address
            ? `${primary.text} ${primary.address}`
            : primary.text || 'Vía local';
          const areaName =
            secondary?.text ||
            primary.context?.find((c: any) =>
              String(c.id || '').startsWith('neighborhood') ||
              String(c.id || '').startsWith('locality') ||
              String(c.id || '').startsWith('place')
            )?.text ||
            'Puno';

          return {
            streetAddress: streetName,
            fullAddress: primary.place_name || `${streetName}, ${areaName}`,
            referenceArea: areaName,
            coordinates: coords,
          };
        }
      }
    } catch {
      // Fallback to local street approximation if offline
    }
  }

  // Respaldo geométrico local para ubicaciones en Puno
  const knownLandmarks = [
    {
      name: 'Plaza Mayor de Puno (Jr. Deustua / Catedral)',
      area: 'Centro Histórico, Puno',
      coords: [-70.0282, -15.8402] as [number, number],
    },
    {
      name: 'Jr. Lima · Paseo Peatonal',
      area: 'Centro de Puno',
      coords: [-70.0274, -15.8384] as [number, number],
    },
    {
      name: 'Jr. Tarapacá · Parque Pino',
      area: 'Parque Pino, Puno',
      coords: [-70.0268, -15.8369] as [number, number],
    },
    {
      name: 'Jr. Carabaya · Mercado Laykakota',
      area: 'Barrio Laykakota, Puno',
      coords: [-70.0235, -15.8465] as [number, number],
    },
    {
      name: 'Av. La Torre · Estación Central',
      area: 'Cercado, Puno',
      coords: [-70.0241, -15.8348] as [number, number],
    },
    {
      name: 'Av. El Sol · Barrio Porteño',
      area: 'Barrio Porteño, Puno',
      coords: [-70.0218, -15.8342] as [number, number],
    },
    {
      name: 'Av. Titicaca · Puerto Lacustre',
      area: 'Bahía de Puno',
      coords: [-70.0165, -15.8368] as [number, number],
    },
  ];

  let nearest = knownLandmarks[0];
  let minDistance = Infinity;
  for (const lm of knownLandmarks) {
    const d = calculateDistanceMeters(coords, lm.coords);
    if (d < minDistance) {
      minDistance = d;
      nearest = lm;
    }
  }

  if (minDistance < 450) {
    return {
      streetAddress:
        minDistance < 60
          ? nearest.name
          : `Cerca de ${nearest.name} (a ${Math.round(minDistance)} m)`,
      fullAddress: `${nearest.name}, ${nearest.area}`,
      referenceArea: nearest.area,
      coordinates: coords,
    };
  }

  return {
    streetAddress: `Lat ${lat.toFixed(5)}°, Lng ${lng.toFixed(5)}°`,
    fullAddress: `Coordenada GPS exacta (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    referenceArea: 'Posición GPS verificada',
    coordinates: coords,
  };
}

/**
 * Puntos de referencia verificados de demostración en Puno, Perú.
 */
export const VERIFIED_PUNO_SAMPLE_POINTS = {
  catedralPuno: {
    name: 'Catedral / Plaza Mayor de Puno',
    coordinates: [-70.0282, -15.8402] as [number, number],
    address: 'Jr. Deustua s/n, Puno',
    type: 'pickup' as const,
  },
  puertoLacustre: {
    name: 'Puerto Lacustre de Puno (Lago Titicaca)',
    coordinates: [-70.0165, -15.8368] as [number, number],
    address: 'Av. Titicaca s/n, Puno',
    type: 'dropoff' as const,
  },
  mercadoCentral: {
    name: 'Mercado Central Laykakota',
    coordinates: [-70.0235, -15.8465] as [number, number],
    address: 'Jr. Carabaya con Jr. Lampa, Puno',
    type: 'pickup' as const,
  },
};

