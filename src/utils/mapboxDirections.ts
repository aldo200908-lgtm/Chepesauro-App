/**
 * Módulo de integración con Mapbox Directions API.
 * Proporciona cálculo y trazado de rutas reales entre coordenadas geográficas válidas [lng, lat].
 * No genera rutas ficticias ni interpola puntos sin datos verificados.
 */

export interface LngLatCoord {
  lng: number;
  lat: number;
}

export interface RouteDirectionsResult {
  geoJson: GeoJSON.Feature<GeoJSON.LineString>;
  distanceMeters: number;
  durationSeconds: number;
  summary: string;
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
 * Consulta la ruta de navegación real entre dos coordenadas usando Mapbox Directions API.
 * Perfil por defecto: 'driving' (también admite 'walking' o 'cycling').
 */
export async function fetchMapboxDirections(
  origin: [number, number],
  destination: [number, number],
  accessToken: string,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
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

  const originStr = `${origin[0]},${origin[1]}`;
  const destStr = `${destination[0]},${destination[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originStr};${destStr}?geometries=geojson&overview=full&access_token=${encodeURIComponent(
    cleanToken
  )}`;

  try {
    const response = await fetch(url);
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
        error: 'No se encontraron rutas disponibles entre estas ubicaciones.',
      };
    }

    const primaryRoute = data.routes[0];
    const geoJson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {
        distance: primaryRoute.distance,
        duration: primaryRoute.duration,
      },
      geometry: primaryRoute.geometry,
    };

    return {
      success: true,
      data: {
        geoJson,
        distanceMeters: primaryRoute.distance,
        durationSeconds: primaryRoute.duration,
        summary: primaryRoute.legs?.[0]?.summary || 'Ruta calculada',
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

/**
 * Puntos de referencia verificados de demostración en Puno, Perú.
 * Estos puntos corresponden a ubicaciones geográficas reales en la ciudad de Puno
 * para permitir la prueba real de la Directions API sin inventar datos.
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
