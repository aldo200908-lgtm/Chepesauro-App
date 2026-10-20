import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Layers,
  Compass,
  RotateCcw,
  Plus,
  Minus,
  Key,
  ExternalLink,
  AlertTriangle,
  MapPin,
  MapPinOff,
  Eye,
  Info,
  Loader2,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { DemoOrder } from '../utils/ordersStore';
import {
  fetchMapboxDirections,
  isValidLngLat,
  VERIFIED_PUNO_SAMPLE_POINTS,
  RouteDirectionsResult,
} from '../utils/mapboxDirections';

// Initial coordinates: Puno, Peru (Plaza Mayor / Cathedral of Puno demo area)
export const PUNO_COORDINATES = {
  lng: -70.0282,
  lat: -15.8402,
  zoom: 15.5,
  pitch: 60, // 3D camera tilt
  bearing: -17.6,
};

export interface MapMarkerPoint {
  id: string;
  lng: number;
  lat: number;
  title: string;
  description?: string;
  type?: 'pickup' | 'dropoff' | 'driver' | 'stop';
}

interface MapboxViewProps {
  activeOrder?: DemoOrder;
  customMarkers?: MapMarkerPoint[];
  className?: string;
  onStartNavigation?: (order: DemoOrder) => void;
}

export const MapboxView: React.FC<MapboxViewProps> = ({
  activeOrder,
  customMarkers = [],
  className = '',
  onStartNavigation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Token management: checks env var first, then sessionStorage/localStorage
  const envToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) || '';
  const [token, setToken] = useState<string>(() => {
    if (envToken && envToken.trim() !== '' && !envToken.includes('YOUR_MAPBOX')) {
      return envToken.trim();
    }
    if (typeof window !== 'undefined') {
      try {
        const saved =
          window.sessionStorage.getItem('chepesaurio_mapbox_token') ||
          window.localStorage.getItem('chepesaurio_mapbox_token');
        if (saved && saved.trim() !== '') return saved.trim();
      } catch {
        // Storage not available
      }
    }
    return '';
  });

  const [inputToken, setInputToken] = useState('');
  const [is3DActive, setIs3DActive] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Real route and directions state
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteDirectionsResult | null>(null);

  // State to toggle verified Puno sample points testing
  const [useVerifiedPunoSample, setUseVerifiedPunoSample] = useState(false);

  // Determine effective coordinates for current view:
  // If useVerifiedPunoSample is enabled, use real landmarks in Puno.
  // Otherwise, inspect activeOrder.pickup.coordinates and activeOrder.dropoff.coordinates.
  const activePickupCoords: [number, number] | undefined = useVerifiedPunoSample
    ? VERIFIED_PUNO_SAMPLE_POINTS.catedralPuno.coordinates
    : activeOrder?.pickup?.coordinates;

  const activeDropoffCoords: [number, number] | undefined = useVerifiedPunoSample
    ? VERIFIED_PUNO_SAMPLE_POINTS.puertoLacustre.coordinates
    : activeOrder?.dropoff?.coordinates;

  const hasValidOrigin = isValidLngLat(activePickupCoords);
  const hasValidDest = isValidLngLat(activeDropoffCoords);
  const canCalculateRoute = hasValidOrigin && hasValidDest;

  // Initialize and tear down Mapbox instance with realistic 3D lighting, buildings & terrain
  const initMap = useCallback(
    (accessToken: string) => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      setMapLoaded(false);
      setMapError(null);

      try {
        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          // Mapbox Standard style provides native 3D buildings, light presets, and landmarks
          style: 'mapbox://styles/mapbox/standard',
          center: [PUNO_COORDINATES.lng, PUNO_COORDINATES.lat],
          zoom: PUNO_COORDINATES.zoom,
          pitch: PUNO_COORDINATES.pitch,
          bearing: PUNO_COORDINATES.bearing,
          antialias: true,
          attributionControl: true,
          touchPitch: true,
          touchZoomRotate: true,
        });

        map.on('style.load', () => {
          // Configure realistic sunlight, shadows, and 3D architecture
          try {
            map.setConfigProperty('basemap', 'lightPreset', 'day');
            map.setConfigProperty('basemap', 'show3dObjects', true);
            map.setConfigProperty('basemap', 'showPlaceLabels', true);
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
            map.setConfigProperty('basemap', 'showTransitLabels', false);
          } catch {
            // Ignored if standard style configuration is not available
          }

          // Atmospheric horizon fog in VerdeGo emerald palette
          try {
            map.setFog({
              color: 'rgb(234, 248, 242)', // #EAF8F2
              'high-color': 'rgb(215, 236, 229)',
              'horizon-blend': 0.1,
              'space-color': 'rgb(6, 75, 60)', // #064B3C
            });
          } catch {
            // Fog not supported on older WebGL contexts
          }

          // Add Digital Elevation Model (DEM) for realistic Andean/Lake topography
          try {
            if (!map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
              });
              map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.15 });
            }
          } catch {
            // Terrain fallback
          }
        });

        map.on('load', () => {
          setMapLoaded(true);
          setIs3DActive(map.getPitch() > 10);
        });

        map.on('pitch', () => {
          setIs3DActive(map.getPitch() > 10);
        });

        map.on('error', (e) => {
          if (
            e.error &&
            (e.error.message?.includes('401') ||
              e.error.message?.includes('Unauthorized') ||
              e.error.message?.includes('Forbidden') ||
              e.error.message?.includes('token'))
          ) {
            setMapError(
              'Token de Mapbox inválido o no autorizado. Por favor ingresa un token válido.'
            );
          }
        });

        mapInstanceRef.current = map;
      } catch (err) {
        setMapError(
          err instanceof Error ? err.message : 'Error al inicializar Mapbox GL'
        );
      }
    },
    []
  );

  useEffect(() => {
    if (!token) return;

    initMap(token);

    // Resize observer to ensure zero layout shift or canvas distortions on mobile
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [token, initMap]);

  // Clean and remove route layers and sources
  const clearMapRoute = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.getLayer('order-route-line')) {
      map.removeLayer('order-route-line');
    }
    if (map.getLayer('order-route-casing')) {
      map.removeLayer('order-route-casing');
    }
    if (map.getSource('order-route-source')) {
      map.removeSource('order-route-source');
    }
  }, []);

  // Draw real route between two verified coordinates using Mapbox Directions API
  const applyRouteToMap = useCallback(
    async (origin: [number, number], dest: [number, number]) => {
      const map = mapInstanceRef.current;
      if (!map || !mapLoaded || !token) return;

      setRouteLoading(true);
      setRouteError(null);

      const res = await fetchMapboxDirections(origin, dest, token, 'driving');

      setRouteLoading(false);

      if (!res.success) {
        setRouteError(res.error);
        clearMapRoute();
        return;
      }

      setRouteData(res.data);

      // Render GeoJSON line on map
      try {
        clearMapRoute();

        map.addSource('order-route-source', {
          type: 'geojson',
          data: res.data.geoJson,
        });

        // Dark casing line for crisp contrast
        map.addLayer({
          id: 'order-route-casing',
          type: 'line',
          source: 'order-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#064B3C',
            'line-width': 7,
            'line-opacity': 0.45,
          },
        });

        // Emerald main route line
        map.addLayer({
          id: 'order-route-line',
          type: 'line',
          source: 'order-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#078F68',
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        });

        // Fit map bounds to show full route and both points with padding
        const coords = res.data.geoJson.geometry.coordinates;
        if (coords.length > 0) {
          const bounds = coords.reduce(
            (b, c) => b.extend(c as [number, number]),
            new mapboxgl.LngLatBounds(
              coords[0] as [number, number],
              coords[0] as [number, number]
            )
          );

          map.fitBounds(bounds, {
            padding: { top: 70, bottom: 70, left: 50, right: 50 },
            maxZoom: 16.5,
            duration: 1000,
          });
        }
      } catch (err) {
        setRouteError(
          err instanceof Error
            ? err.message
            : 'Error al dibujar la ruta en el mapa.'
        );
      }
    },
    [clearMapRoute, mapLoaded, token]
  );

  // Manage Markers & Route when order or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // If we have verified origin and destination, add verified pins and draw route
    if (canCalculateRoute && activePickupCoords && activeDropoffCoords) {
      // 1. Pickup Pin (Marker A)
      const pickupEl = document.createElement('div');
      pickupEl.className =
        'w-8 h-8 rounded-full bg-[#064B3C] border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#078F68]/40';
      pickupEl.innerHTML = 'A';

      const pickupPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-1.5 font-sans"><span class="text-[10px] font-bold uppercase tracking-wider text-[#064B3C]">Recogida</span><p class="text-xs font-semibold text-[#102F27] mt-0.5">${
          useVerifiedPunoSample
            ? VERIFIED_PUNO_SAMPLE_POINTS.catedralPuno.name
            : activeOrder?.pickup.address || 'Punto de recogida'
        }</p></div>`
      );

      const pickupMarker = new mapboxgl.Marker({ element: pickupEl })
        .setLngLat(activePickupCoords)
        .setPopup(pickupPopup)
        .addTo(map);

      markersRef.current.push(pickupMarker);

      // 2. Dropoff Pin (Marker B)
      const dropoffEl = document.createElement('div');
      dropoffEl.className =
        'w-8 h-8 rounded-full bg-[#078F68] border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#078F68]/40';
      dropoffEl.innerHTML = 'B';

      const dropoffPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-1.5 font-sans"><span class="text-[10px] font-bold uppercase tracking-wider text-[#078F68]">Destino</span><p class="text-xs font-semibold text-[#102F27] mt-0.5">${
          useVerifiedPunoSample
            ? VERIFIED_PUNO_SAMPLE_POINTS.puertoLacustre.name
            : activeOrder?.dropoff.address || 'Punto de destino'
        }</p></div>`
      );

      const dropoffMarker = new mapboxgl.Marker({ element: dropoffEl })
        .setLngLat(activeDropoffCoords)
        .setPopup(dropoffPopup)
        .addTo(map);

      markersRef.current.push(dropoffMarker);

      // Trigger Directions API calculation
      applyRouteToMap(activePickupCoords, activeDropoffCoords);
    } else {
      // Clear route and state when coordinates are not present
      clearMapRoute();
      setRouteData(null);
      setRouteError(null);
      setRouteLoading(false);

      // Add any custom external markers if provided
      customMarkers.forEach((markerPoint) => {
        const el = document.createElement('div');
        el.className =
          'w-6 h-6 rounded-full bg-[#078F68] border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold';
        el.innerHTML = '•';

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([markerPoint.lng, markerPoint.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-1 font-sans"><strong>${markerPoint.title}</strong>${
                markerPoint.description
                  ? `<p class="text-xs">${markerPoint.description}</p>`
                  : ''
              }</div>`
            )
          )
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [
    canCalculateRoute,
    activePickupCoords,
    activeDropoffCoords,
    activeOrder,
    useVerifiedPunoSample,
    mapLoaded,
    customMarkers,
    applyRouteToMap,
    clearMapRoute,
  ]);

  // Map Camera Controls
  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (is3DActive) {
      // Switch to flat 2D
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
      setIs3DActive(false);
    } else {
      // Switch to 3D perspective
      map.easeTo({
        pitch: PUNO_COORDINATES.pitch,
        bearing: PUNO_COORDINATES.bearing,
        duration: 800,
      });
      setIs3DActive(true);
    }
  };

  const handleResetCamera = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo({
      center: [PUNO_COORDINATES.lng, PUNO_COORDINATES.lat],
      zoom: PUNO_COORDINATES.zoom,
      pitch: PUNO_COORDINATES.pitch,
      bearing: PUNO_COORDINATES.bearing,
      essential: true,
      duration: 1200,
    });
    setIs3DActive(true);
  };

  const handleResetBearing = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.resetNorth({ duration: 500 });
  };

  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.zoomOut({ duration: 300 });
  };

  const handleSaveInputToken = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputToken.trim();
    if (!clean) return;

    try {
      window.sessionStorage.setItem('chepesaurio_mapbox_token', clean);
      window.localStorage.setItem('chepesaurio_mapbox_token', clean);
    } catch {
      // Ignore
    }
    setToken(clean);
    setShowTokenModal(false);
  };

  // 1. TOKEN SETUP / CONFIGURATION NOTICE (When token is not configured)
  if (!token) {
    return (
      <div
        data-testid="mapbox-config-screen"
        className={`rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] p-5 sm:p-6 space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#078F68] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Key className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#078F68]">
              Configuración de Mapbox
            </span>
            <h2 className="font-display text-lg font-bold text-[#102F27]">
              Token de acceso requerido
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#64877C] leading-relaxed">
          Para visualizar el mapa 3D de Mapbox en <strong>Puno, Perú</strong> con
          edificios, relieve y cálculo de rutas viales, agrega tu token público
          en la variable de entorno de Vite o pruébalo directamente aquí.
        </p>

        {/* Step-by-step guidance */}
        <div className="rounded-2xl bg-white border border-[#DCECE5] p-4 space-y-2.5 text-xs text-[#102F27]">
          <p className="font-bold text-[#064B3C] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#078F68]" aria-hidden="true" />
            <span>Pasos para obtener tu token gratis:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-[#64877C] pl-1">
            <li>
              Crea una cuenta gratuita en{' '}
              <a
                href="https://account.mapbox.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#078F68] font-semibold underline inline-flex items-center gap-0.5"
              >
                account.mapbox.com
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </li>
            <li>
              Copia tu <strong>Default Public Token</strong> (comienza con{' '}
              <code className="bg-[#EAF8F2] px-1 py-0.5 rounded text-[#064B3C]">
                pk.eyJ...
              </code>
              ).
            </li>
            <li>
              Añádelo a tu archivo{' '}
              <code className="bg-[#EAF8F2] px-1 py-0.5 rounded text-[#064B3C]">
                .env
              </code>
              :
              <pre className="mt-1.5 p-2 rounded-xl bg-[#102F27] text-[#EAF8F2] font-mono text-[11px] overflow-x-auto">
                VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1..."
              </pre>
            </li>
          </ol>
        </div>

        {/* Quick Test Token Input Form */}
        <form onSubmit={handleSaveInputToken} className="space-y-2.5 pt-1">
          <label
            htmlFor="quick-mapbox-token"
            className="block text-xs font-semibold text-[#064B3C]"
          >
            O ingresa tu token público aquí para probarlo ahora mismo:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="quick-mapbox-token"
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="pk.eyJ1..."
              className="flex-1 h-11 px-3.5 rounded-2xl bg-white border border-[#DCECE5] text-xs text-[#102F27] placeholder:text-[#64877C] focus:outline-none focus:ring-2 focus:ring-[#078F68]"
            />
            <button
              type="submit"
              disabled={!inputToken.trim()}
              className="h-11 px-5 rounded-full bg-[#078F68] hover:bg-[#064B3C] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Activar mapa 3D</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. ACTIVE MAP WITH 3D CONTROLS AND OVERLAY
  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Map Card Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl bg-[#EAF8F2] border border-[#DCECE5] overflow-hidden shadow-xs">
        {/* Mapbox Canvas Mount Point */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Error overlay if invalid token / initialization failure */}
        {mapError && (
          <div className="absolute inset-0 z-30 bg-[#FFFFFF]/92 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-display text-sm font-bold text-[#102F27]">
                Error al cargar el mapa
              </h3>
              <p className="text-xs text-[#64877C] leading-relaxed">
                {mapError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMapError(null);
                setToken('');
                try {
                  window.sessionStorage.removeItem('chepesaurio_mapbox_token');
                  window.localStorage.removeItem('chepesaurio_mapbox_token');
                } catch {
                  // Ignore
                }
              }}
              className="h-9 px-4 rounded-full bg-[#078F68] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#064B3C] transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Configurar nuevo token</span>
            </button>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCECE5] shadow-xs text-xs font-semibold text-[#102F27]">
            <MapPin className="w-3.5 h-3.5 text-[#078F68]" aria-hidden="true" />
            <span className="truncate">Puno, Perú · Modelo 3D</span>
          </div>

          <button
            type="button"
            onClick={() => setShowTokenModal(!showTokenModal)}
            className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCECE5] shadow-xs text-[11px] font-semibold text-[#064B3C] hover:bg-[#EAF8F2] transition-colors cursor-pointer"
            title="Opciones de Token de Mapbox"
          >
            <Key className="w-3 h-3 text-[#078F68]" aria-hidden="true" />
            <span className="hidden sm:inline">Token</span>
          </button>
        </div>

        {/* Token update floating modal */}
        {showTokenModal && (
          <div className="absolute top-12 right-3 z-20 w-72 rounded-2xl bg-white border border-[#DCECE5] p-3.5 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102F27]">
                Cambiar token de Mapbox
              </span>
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="text-xs text-[#64877C] hover:text-[#102F27] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveInputToken} className="space-y-2">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Nuevo token pk.eyJ..."
                className="w-full h-8 px-2.5 rounded-xl border border-[#DCECE5] text-xs text-[#102F27]"
              />
              <button
                type="submit"
                disabled={!inputToken.trim()}
                className="w-full h-8 rounded-full bg-[#078F68] hover:bg-[#064B3C] text-white text-xs font-semibold cursor-pointer"
              >
                Actualizar
              </button>
            </form>
          </div>
        )}

        {/* Route Loading / Status Floating Indicator */}
        {routeLoading && (
          <div className="absolute top-12 left-3 z-10 pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCECE5] shadow-xs text-[11px] font-semibold text-[#064B3C]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#078F68]" />
            <span>Consultando Mapbox Directions API...</span>
          </div>
        )}

        {/* Floating Mobile Controls Bar (Right Side) */}
        <div className="absolute right-3 bottom-14 z-10 flex flex-col gap-1.5 pointer-events-auto">
          {/* 3D Tilt Toggle Control */}
          <button
            type="button"
            onClick={handleToggle3D}
            aria-label={
              is3DActive
                ? 'Cambiar a vista plana 2D'
                : 'Cambiar a vista inclinada 3D'
            }
            title={
              is3DActive
                ? 'Vista 3D activa (Click para 2D)'
                : 'Vista 2D activa (Click para 3D)'
            }
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all cursor-pointer ${
              is3DActive
                ? 'bg-[#078F68] text-white ring-2 ring-white'
                : 'bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2]'
            }`}
          >
            <Layers className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Reset Camera to Puno Center */}
          <button
            type="button"
            onClick={handleResetCamera}
            aria-label="Volver a la vista inicial de Puno"
            title="Volver a la vista inicial"
            className="w-10 h-10 rounded-2xl bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#078F68]" aria-hidden="true" />
          </button>

          {/* Reset North / Compass */}
          <button
            type="button"
            onClick={handleResetBearing}
            aria-label="Orientar al norte"
            title="Orientar al norte"
            className="w-10 h-10 rounded-2xl bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#064B3C]" aria-hidden="true" />
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Acercar mapa"
            title="Acercar mapa"
            className="w-10 h-10 rounded-2xl bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#102F27]" aria-hidden="true" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Alejar mapa"
            title="Alejar mapa"
            className="w-10 h-10 rounded-2xl bg-white text-[#102F27] border border-[#DCECE5] hover:bg-[#EAF8F2] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4 text-[#102F27]" aria-hidden="true" />
          </button>
        </div>

        {/* Bottom Status Pill */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCECE5] shadow-xs text-[11px] font-semibold text-[#064B3C]">
            <Eye className="w-3.5 h-3.5 text-[#078F68]" aria-hidden="true" />
            <span>{is3DActive ? 'Inclinación 3D (60°)' : 'Plano 2D (0°)'}</span>
          </div>
        </div>
      </div>

      {/* Route Error Notification */}
      {routeError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo trazar la ruta</p>
              <p className="text-[11px] text-red-600 mt-0.5">{routeError}</p>
            </div>
          </div>
          {canCalculateRoute && activePickupCoords && activeDropoffCoords && (
            <button
              type="button"
              onClick={() =>
                applyRouteToMap(activePickupCoords, activeDropoffCoords)
              }
              className="text-[11px] font-bold text-red-700 underline shrink-0 cursor-pointer"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* GEOGRAPHIC DATA STATUS & ORDER CARD */}
      <div className="rounded-3xl bg-white border border-[#DCECE5] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#078F68] shrink-0" />
            <h3 className="font-display text-sm font-bold text-[#102F27]">
              {useVerifiedPunoSample
                ? 'Ruta de prueba verificada (Puno, Perú)'
                : activeOrder
                ? `Pedido ${activeOrder.id} · Estado de coordenadas`
                : 'Ubicaciones de entrega'}
            </h3>
          </div>

          {/* Quick toggle to test verified Puno coordinates with Mapbox Directions */}
          <button
            type="button"
            onClick={() => setUseVerifiedPunoSample(!useVerifiedPunoSample)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              useVerifiedPunoSample
                ? 'bg-[#078F68] text-white shadow-xs'
                : 'bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {useVerifiedPunoSample
                ? 'Volver a pedido actual'
                : 'Probar ruta real en Puno'}
            </span>
          </button>
        </div>

        {/* Case 1: Verified Route Active (Mapbox Directions API Succeeded) */}
        {canCalculateRoute ? (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-[#EAF8F2]/70 border border-[#DCECE5] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#064B3C] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#078F68]" />
                  <span>Ruta calculada con Mapbox Directions API</span>
                </span>
                {routeData && (
                  <span className="font-bold tabular-nums text-[#078F68]">
                    {(routeData.distanceMeters / 1000).toFixed(1)} km ·{' '}
                    {Math.ceil(routeData.durationSeconds / 60)} min
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[#102F27] pt-1">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-[#064B3C] text-[11px] shrink-0 w-4">
                    [A]
                  </span>
                  <p className="truncate">
                    <strong>Recogida:</strong>{' '}
                    {useVerifiedPunoSample
                      ? `${VERIFIED_PUNO_SAMPLE_POINTS.catedralPuno.name} (${VERIFIED_PUNO_SAMPLE_POINTS.catedralPuno.coordinates.join(
                          ', '
                        )})`
                      : activeOrder?.pickup.address}
                  </p>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-[#078F68] text-[11px] shrink-0 w-4">
                    [B]
                  </span>
                  <p className="truncate">
                    <strong>Destino:</strong>{' '}
                    {useVerifiedPunoSample
                      ? `${VERIFIED_PUNO_SAMPLE_POINTS.puertoLacustre.name} (${VERIFIED_PUNO_SAMPLE_POINTS.puertoLacustre.coordinates.join(
                          ', '
                        )})`
                      : activeOrder?.dropoff.address}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#64877C] leading-relaxed">
              La línea verde sobre el mapa sigue la red vial transitable real
              calculada por los servidores de Mapbox.
            </p>
          </div>
        ) : (
          /* Case 2: Absence of verified coordinates (Preserving geographic integrity) */
          <div className="rounded-2xl bg-[#EAF8F2]/50 border border-[#DCECE5] p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2.5 text-[#102F27]">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <MapPinOff className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-[#064B3C]">
                  Direcciones registradas como texto descriptivo (sin coordenadas)
                </p>
                <p className="text-[11px] text-[#64877C] leading-relaxed">
                  El pedido seleccionado cuenta con direcciones textuales de
                  demostración:
                </p>
                <ul className="text-[11px] text-[#102F27] space-y-0.5 pl-1">
                  <li>
                    <strong>Recogida:</strong> {activeOrder?.pickup.address}
                  </li>
                  <li>
                    <strong>Destino:</strong> {activeOrder?.dropoff.address}
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCECE5] text-[11px] text-[#64877C] flex items-center justify-between gap-2">
              <span>
                Para proteger la veracidad del mapa, <strong>no se inventan</strong>{' '}
                coordenadas ni líneas ficticias.
              </span>
              <button
                type="button"
                onClick={() => setUseVerifiedPunoSample(true)}
                className="text-[#078F68] font-bold underline shrink-0 cursor-pointer"
              >
                Probar en Puno
              </button>
            </div>
          </div>
        )}

        {onStartNavigation && activeOrder && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onStartNavigation(activeOrder)}
              className="w-full h-12 rounded-2xl bg-[#0091FF] hover:bg-[#0077D4] active:scale-98 text-white font-display text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#0091FF]/25 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Iniciar navegación GPS 3D en pantalla completa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
