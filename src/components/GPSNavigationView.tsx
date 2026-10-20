import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  X,
  Navigation,
  Crosshair,
  Volume2,
  VolumeX,
  Layers,
  MapPin,
  CheckCircle2,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  ArrowUpRight,
  ArrowUpLeft,
  CornerDownRight,
  Eye,
  Store,
  UserCheck,
  ArrowRight,
  Ban,
  Trash2,
  Footprints,
  Compass,
  LocateFixed,
} from 'lucide-react';
import { DemoOrder, formatPenCurrency } from '../utils/ordersStore';
import {
  RouteDirectionsResult,
  NavigationStep,
  CustomRoadblock,
  ReverseGeocodeResult,
  PUNO_RESTRICTED_ZONES,
  fetchMapboxDirections,
  fetchReverseGeocodeAddress,
  formatCardinalDirection,
  calculateDistanceMeters,
  calculateBearing,
  formatManeuverDistance,
  formatDurationMinutes,
  formatEstimatedArrivalTime,
  isValidLngLat,
  loadCustomRoadblocks,
  saveCustomRoadblocks,
  resolveVehicularAccessPoint,
} from '../utils/mapboxDirections';
import { useRealGPS } from '../utils/useRealGPS';

interface GPSNavigationViewProps {
  order: DemoOrder;
  targetType: 'pickup' | 'dropoff';
  onExit: () => void;
  onAdvanceOrderStatus?: (orderId: string, nextStage?: 'pickup' | 'dropoff') => void;
}

/**
 * Renderiza el icono adecuado según el tipo de maniobra devuelta por Mapbox Directions
 */
function ManeuverIcon({
  type,
  modifier,
  className = 'w-7 h-7',
}: {
  type: string;
  modifier?: string;
  className?: string;
}) {
  const normType = (type || '').toLowerCase();
  const normMod = (modifier || '').toLowerCase();

  if (normType === 'arrive') {
    return <CheckCircle2 className={`${className} text-white`} />;
  }

  if (normMod.includes('sharp right') || normMod === 'right') {
    return <CornerUpRight className={`${className} text-white`} />;
  }
  if (normMod.includes('slight right')) {
    return <ArrowUpRight className={`${className} text-white`} />;
  }
  if (normMod.includes('sharp left') || normMod === 'left') {
    return <CornerUpLeft className={`${className} text-white`} />;
  }
  if (normMod.includes('slight left')) {
    return <ArrowUpLeft className={`${className} text-white`} />;
  }
  if (normMod.includes('uturn')) {
    return <CornerDownRight className={`${className} text-white`} />;
  }

  return <ArrowUp className={`${className} text-white`} />;
}

export const GPSNavigationView: React.FC<GPSNavigationViewProps> = ({
  order,
  targetType,
  onExit,
  onAdvanceOrderStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vehicularCornerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customBlockMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Active stage in the 2-stage guided delivery ('pickup' = Stage 1 Store/Agent, 'dropoff' = Stage 2 Customer)
  const [activeStage, setActiveStage] = useState<'pickup' | 'dropoff'>(targetType);

  // Interactive Custom Roadblocks (Calles cerradas u obras marcadas por el motorizado)
  const [customRoadblocks, setCustomRoadblocks] = useState<CustomRoadblock[]>(() =>
    loadCustomRoadblocks()
  );
  const [isMarkingRoadblock, setIsMarkingRoadblock] = useState(false);
  const isMarkingRoadblockRef = useRef(false);

  // Aiming pointer mode ("Dirección a la que apunto en el mapa")
  const [aimPointerActive, setAimPointerActive] = useState(false);
  const [cameraBearing, setCameraBearing] = useState<number>(0);
  const [myExactAddress, setMyExactAddress] = useState<ReverseGeocodeResult | null>(
    null
  );
  const [aimedAddress, setAimedAddress] = useState<ReverseGeocodeResult | null>(
    null
  );

  useEffect(() => {
    isMarkingRoadblockRef.current = isMarkingRoadblock;
  }, [isMarkingRoadblock]);

  useEffect(() => {
    setActiveStage(targetType);
  }, [targetType]);

  // Token management
  const envToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) || '';
  const token = useMemo(() => {
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
        // storage disabled
      }
    }
    return '';
  }, [envToken]);

  // Real GPS + Device Compass Hook
  const {
    status: gpsStatus,
    currentCoords,
    accuracyMeters,
    effectiveHeading,
    compassHeading,
    retryGPS,
    requestCompassPermission,
  } = useRealGPS(true);

  // Exact target coordinates for the current stage of the 2-stage navigation
  const destinationCoords: [number, number] = useMemo(() => {
    if (activeStage === 'pickup' && order.pickup.coordinates) {
      return order.pickup.coordinates;
    }
    if (activeStage === 'dropoff' && order.dropoff.coordinates) {
      return order.dropoff.coordinates;
    }
    return activeStage === 'pickup' ? [-70.0282, -15.8402] : [-70.0165, -15.8368];
  }, [order, activeStage]);

  // Navigation Origin:
  // Prefer real GPS currentCoords if valid; otherwise use realistic vehicular starting point for the active stage
  const effectiveOriginCoords: [number, number] = useMemo(() => {
    if (currentCoords && isValidLngLat(currentCoords)) {
      return currentCoords;
    }
    if (activeStage === 'pickup') {
      const pickupLng = order.pickup.coordinates?.[0] ?? -70.0235;
      const pickupLat = order.pickup.coordinates?.[1] ?? -15.8465;
      const rawStart: [number, number] = [
        Number((pickupLng - 0.0055).toFixed(5)),
        Number((pickupLat - 0.0042).toFixed(5)),
      ];
      return resolveVehicularAccessPoint(rawStart, destinationCoords, customRoadblocks)
        .vehicularCoord;
    }
    const rawPickup = order.pickup.coordinates || [-70.0282, -15.8402];
    return resolveVehicularAccessPoint(rawPickup, destinationCoords, customRoadblocks)
      .vehicularCoord;
  }, [currentCoords, order, activeStage, destinationCoords, customRoadblocks]);

  // Route calculation and turn-by-turn state
  const [routeResult, setRouteResult] = useState<RouteDirectionsResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFollowingDriver, setIsFollowingDriver] = useState(true);
  const [is3DMode, setIs3DMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const lastSpokenInstructionRef = useRef<string>('');
  const lastRecalculateCoordsRef = useRef<[number, number] | null>(null);
  const lastReverseGeocodeCoordsRef = useRef<[number, number] | null>(null);

  // Direction the user is currently pointing (Compass / GPS / Map Camera Bearing)
  const activePointingDegrees = useMemo(() => {
    if (effectiveHeading !== null) return effectiveHeading;
    if (cameraBearing !== 0) return (Math.round(cameraBearing) + 360) % 360;
    return Math.round(calculateBearing(effectiveOriginCoords, destinationCoords));
  }, [effectiveHeading, cameraBearing, effectiveOriginCoords, destinationCoords]);

  const pointingCardinal = useMemo(
    () => formatCardinalDirection(activePointingDegrees),
    [activePointingDegrees]
  );

  // Resolve exact street address of the user's position ("Que sepa mi dirección exacta")
  useEffect(() => {
    let cancelled = false;
    if (lastReverseGeocodeCoordsRef.current) {
      const moved = calculateDistanceMeters(
        lastReverseGeocodeCoordsRef.current,
        effectiveOriginCoords
      );
      if (moved < 12 && myExactAddress) return;
    }

    lastReverseGeocodeCoordsRef.current = effectiveOriginCoords;
    fetchReverseGeocodeAddress(effectiveOriginCoords, token).then((res) => {
      if (!cancelled) {
        setMyExactAddress(res);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveOriginCoords, token, myExactAddress]);

  // Audio Voice Guidance using SpeechSynthesis
  const speakInstruction = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis blocked by autoplay policy
      }
    },
    [voiceEnabled]
  );

  // Fetch real vehicular directions from Mapbox Directions API avoiding restricted Puno zones & custom roadblocks
  const calculateRoute = useCallback(
    async (
      origin: [number, number],
      dest: [number, number],
      blocks: CustomRoadblock[]
    ) => {
      if (!token) return;
      setRouteError(null);

      const res = await fetchMapboxDirections(
        origin,
        dest,
        token,
        'driving',
        blocks
      );

      if (!res.success) {
        setRouteError(res.error);
        return;
      }

      setRouteResult(res.data);
      setCurrentStepIndex(0);
      lastRecalculateCoordsRef.current = origin;

      if (res.data.steps.length > 0) {
        const first = res.data.steps[0];
        const speech = first.bannerInstruction || first.maneuver.instruction;
        if (speech && speech !== lastSpokenInstructionRef.current) {
          lastSpokenInstructionRef.current = speech;
          speakInstruction(speech);
        }
      }
    },
    [token, speakInstruction]
  );

  // Request route whenever origin, stage destination, or custom roadblocks change
  useEffect(() => {
    calculateRoute(effectiveOriginCoords, destinationCoords, customRoadblocks);
  }, [calculateRoute, effectiveOriginCoords, destinationCoords, customRoadblocks]);

  // Clean Route Layers from Map
  const removeRouteLayers = useCallback((map: mapboxgl.Map) => {
    if (map.getLayer('gps-walking-connector-line'))
      map.removeLayer('gps-walking-connector-line');
    if (map.getSource('gps-walking-connector-source'))
      map.removeSource('gps-walking-connector-source');
    if (map.getLayer('gps-route-core')) map.removeLayer('gps-route-core');
    if (map.getLayer('gps-route-line')) map.removeLayer('gps-route-line');
    if (map.getLayer('gps-route-casing')) map.removeLayer('gps-route-casing');
    if (map.getSource('gps-route-source')) map.removeSource('gps-route-source');
  }, []);

  // Draw 3D GTA V Style Purple/Magenta Waypoint Route Line + Optional Pedestrian Connector
  const updateRouteOnMap = useCallback(
    (map: mapboxgl.Map, result: RouteDirectionsResult) => {
      try {
        removeRouteLayers(map);

        map.addSource('gps-route-source', {
          type: 'geojson',
          data: result.geoJson,
        });

        // 1. Deep Dark Violet-Black Casing (High contrast street border like GTA V radar/map)
        map.addLayer({
          id: 'gps-route-casing',
          type: 'line',
          source: 'gps-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#2E054E',
            'line-width': 13,
            'line-opacity': 0.9,
          },
        });

        // 2. Iconic GTA V Waypoint Purple Main Line
        map.addLayer({
          id: 'gps-route-line',
          type: 'line',
          source: 'gps-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#A855F7',
            'line-width': 8,
            'line-opacity': 0.98,
          },
        });

        // 3. Luminous Electric Magenta Inner Core for 3D Depth
        map.addLayer({
          id: 'gps-route-core',
          type: 'line',
          source: 'gps-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#F0ABFC',
            'line-width': 3,
            'line-opacity': 0.95,
          },
        });

        // 4. Optional Dotted Walking Path from Legal Vehicular Corner into Pedestrian Zone
        if (result.walkingConnectorGeoJson) {
          map.addSource('gps-walking-connector-source', {
            type: 'geojson',
            data: result.walkingConnectorGeoJson,
          });

          map.addLayer({
            id: 'gps-walking-connector-line',
            type: 'line',
            source: 'gps-walking-connector-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#10B981',
              'line-width': 4.5,
              'line-dasharray': [1.5, 1.8],
              'line-opacity': 0.95,
            },
          });
        }
      } catch {
        // Map not ready
      }
    },
    [removeRouteLayers]
  );

  // Remove a specific custom roadblock
  const handleRemoveRoadblock = useCallback((blockId: string) => {
    setCustomRoadblocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      saveCustomRoadblocks(updated);
      return updated;
    });
  }, []);

  // Clear all custom roadblocks
  const handleClearAllRoadblocks = useCallback(() => {
    setCustomRoadblocks([]);
    saveCustomRoadblocks([]);
  }, []);

  // Render custom roadblock markers on the 3D map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    customBlockMarkersRef.current.forEach((m) => m.remove());
    customBlockMarkersRef.current = [];

    customRoadblocks.forEach((block) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.title = 'Toca para quitar este bloqueo vial';
      el.className =
        'w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform';
      el.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m4.9 4.9 14.2 14.2"></path>
        </svg>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRemoveRoadblock(block.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(block.coordinates)
        .addTo(map);
      customBlockMarkersRef.current.push(marker);
    });
  }, [customRoadblocks, mapLoaded, handleRemoveRoadblock]);

  // Initialize Mapbox 3D Full-Screen Driving View
  useEffect(() => {
    if (!mapContainerRef.current || !token) return;

    mapboxgl.accessToken = token;

    const initialCenter = effectiveOriginCoords;
    const initialBearing = calculateBearing(effectiveOriginCoords, destinationCoords);
    setCameraBearing(initialBearing);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: initialCenter,
      zoom: 17.2,
      pitch: 65,
      bearing: initialBearing,
      antialias: true,
      attributionControl: false,
      touchPitch: true,
      touchZoomRotate: true,
    });

    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', 'day');
        map.setConfigProperty('basemap', 'show3dObjects', true);
        map.setConfigProperty('basemap', 'showPlaceLabels', true);
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
      } catch {
        // Standard config fallback
      }

      try {
        map.setFog({
          color: 'rgb(234, 248, 242)',
          'high-color': 'rgb(215, 236, 229)',
          'horizon-blend': 0.08,
          'space-color': 'rgb(6, 75, 60)',
        });
      } catch {
        // Fog fallback
      }
    });

    const restrictedZoneMarkers: mapboxgl.Marker[] = [];

    map.on('load', () => {
      setMapLoaded(true);
      mapInstanceRef.current = map;

      // Render subtle Pedestrian Zone Badges on Plaza Mayor & Paseo Peatonal Jr. Lima
      PUNO_RESTRICTED_ZONES.forEach((zone) => {
        const zEl = document.createElement('div');
        zEl.className =
          'px-2 py-0.5 rounded-full bg-amber-950/85 border border-amber-400/70 text-amber-200 text-[10px] font-bold shadow-md whitespace-nowrap pointer-events-none';
        zEl.textContent =
          zone.id === 'plaza-mayor-puno'
            ? 'Zona Peatonal · Plaza Mayor'
            : 'Zona Peatonal · Jr. Lima';

        const zMarker = new mapboxgl.Marker({ element: zEl })
          .setLngLat(zone.center)
          .addTo(map);
        restrictedZoneMarkers.push(zMarker);
      });

      // Create Driver 3D Navigation Puck with Directional Aiming Vision Cone ("Dirección a la que apunto")
      const driverEl = document.createElement('div');
      driverEl.className = 'driver-gps-puck relative flex items-center justify-center';
      driverEl.style.width = '110px';
      driverEl.style.height = '110px';
      driverEl.innerHTML = `
        <!-- Directional Aiming Vision Cone / Beam pointing forward (North of marker) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 110 110">
          <defs>
            <linearGradient id="aimBeamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#A855F7" stop-opacity="0.65" />
              <stop offset="65%" stop-color="#E879F9" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#F0ABFC" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 55 55 L 22 6 A 48 48 0 0 1 88 6 Z" fill="url(#aimBeamGrad)" />
          <line x1="55" y1="55" x2="55" y2="8" stroke="#F0ABFC" stroke-width="2" stroke-dasharray="3 3" opacity="0.85" />
        </svg>
        <div class="absolute w-12 h-12 rounded-full bg-[#A855F7]/25 animate-ping"></div>
        <div class="relative w-9 h-9 rounded-full bg-[#102F27] border-3 border-white shadow-2xl flex items-center justify-center">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#F0ABFC" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      `;

      const driverMarker = new mapboxgl.Marker({
        element: driverEl,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat(initialCenter)
        .setRotation(initialBearing)
        .addTo(map);

      driverMarkerRef.current = driverMarker;

      // Create GTA V Style Waypoint Destination Pin
      const destEl = document.createElement('div');
      destEl.className =
        'w-11 h-11 rounded-full bg-[#9333EA] border-3 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-[#A855F7]/40';
      destEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      `;

      const destMarker = new mapboxgl.Marker({ element: destEl })
        .setLngLat(destinationCoords)
        .addTo(map);

      destinationMarkerRef.current = destMarker;
    });

    // Track camera rotation ("Dirección a la que apunto con la cámara")
    map.on('rotate', () => {
      setCameraBearing(map.getBearing());
    });

    // When map movement ends, update camera bearing and resolve aimed street address if aimPointerActive
    map.on('moveend', () => {
      setCameraBearing(map.getBearing());
      const center = map.getCenter();
      const aimedCoords: [number, number] = [
        Number(center.lng.toFixed(5)),
        Number(center.lat.toFixed(5)),
      ];
      fetchReverseGeocodeAddress(aimedCoords, token).then((res) => {
        setAimedAddress(res);
      });
    });

    // Interactive Click Handler: When "Marcar calle cerrada" mode is active, add a roadblock at clicked street
    map.on('click', (e) => {
      if (!isMarkingRoadblockRef.current) return;
      const clickedCoord: [number, number] = [
        Number(e.lngLat.lng.toFixed(5)),
        Number(e.lngLat.lat.toFixed(5)),
      ];
      const newBlock: CustomRoadblock = {
        id: `rb-${Date.now()}`,
        coordinates: clickedCoord,
        label: 'Calle cerrada / Obra vial',
        createdAt: new Date().toISOString(),
      };
      setCustomRoadblocks((prev) => {
        const next = [...prev, newBlock];
        saveCustomRoadblocks(next);
        return next;
      });
      setIsMarkingRoadblock(false);
    });

    // Detect user manual interaction: temporarily pause camera tracking
    map.on('dragstart', () => {
      setIsFollowingDriver(false);
    });

    return () => {
      restrictedZoneMarkers.forEach((m) => m.remove());
      customBlockMarkersRef.current.forEach((m) => m.remove());
      if (vehicularCornerMarkerRef.current)
        vehicularCornerMarkerRef.current.remove();
      if (driverMarkerRef.current) driverMarkerRef.current.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [token]);

  // Rotate the Driver Vision Cone in real time whenever the user turns their phone or rotates the map
  useEffect(() => {
    if (!driverMarkerRef.current) return;
    driverMarkerRef.current.setRotation(activePointingDegrees);
  }, [activePointingDegrees]);

  // Update markers and camera smoothly when stage changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(effectiveOriginCoords);
      driverMarkerRef.current.setRotation(activePointingDegrees);
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLngLat(destinationCoords);
    }

    const nextBearing = calculateBearing(effectiveOriginCoords, destinationCoords);
    map.flyTo({
      center: effectiveOriginCoords,
      zoom: 17.2,
      pitch: is3DMode ? 65 : 0,
      bearing: is3DMode ? nextBearing : 0,
      duration: 1100,
    });
  }, [activeStage, destinationCoords, effectiveOriginCoords, is3DMode, mapLoaded]);

  // When route data updates, render the GTA V purple line + vehicular corner badge if snapped
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !routeResult) return;
    updateRouteOnMap(map, routeResult);

    if (vehicularCornerMarkerRef.current) {
      vehicularCornerMarkerRef.current.remove();
      vehicularCornerMarkerRef.current = null;
    }

    if (routeResult.accessResolution?.isSnappedToCorner) {
      const cornerEl = document.createElement('div');
      cornerEl.className =
        'px-2.5 py-1 rounded-full bg-[#078F68] border-2 border-white text-white text-[10px] font-bold shadow-xl flex items-center gap-1 whitespace-nowrap';
      cornerEl.innerHTML = `<span>Parada Moto Permitida</span>`;

      vehicularCornerMarkerRef.current = new mapboxgl.Marker({ element: cornerEl })
        .setLngLat(routeResult.accessResolution.vehicularCoord)
        .addTo(map);
    }
  }, [mapLoaded, routeResult, updateRouteOnMap]);

  // Real GPS & Compass Updates: Update Driver Marker Position, Aiming Cone & Camera
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const activePos = currentCoords || effectiveOriginCoords;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(activePos);
      driverMarkerRef.current.setRotation(activePointingDegrees);
    }

    if (isFollowingDriver && currentCoords) {
      const targetBearing =
        effectiveHeading !== null
          ? effectiveHeading
          : calculateBearing(currentCoords, destinationCoords);

      map.easeTo({
        center: currentCoords,
        pitch: is3DMode ? 65 : 0,
        bearing: is3DMode ? targetBearing : 0,
        zoom: 17.4,
        duration: 850,
      });
    }

    if (currentCoords && routeResult && routeResult.steps.length > 0) {
      const activeStep = routeResult.steps[currentStepIndex];
      if (activeStep) {
        const distToStep = calculateDistanceMeters(
          currentCoords,
          activeStep.maneuver.location
        );

        if (distToStep < 25 && currentStepIndex < routeResult.steps.length - 1) {
          const nextIdx = currentStepIndex + 1;
          setCurrentStepIndex(nextIdx);

          const nextStep = routeResult.steps[nextIdx];
          const announcement =
            nextStep.bannerInstruction || nextStep.maneuver.instruction;
          if (announcement && announcement !== lastSpokenInstructionRef.current) {
            lastSpokenInstructionRef.current = announcement;
            speakInstruction(announcement);
          }
        }
      }

      const arrivalTarget =
        routeResult.accessResolution?.vehicularCoord || destinationCoords;
      const distToDestination = calculateDistanceMeters(
        currentCoords,
        arrivalTarget
      );
      if (distToDestination < 28 && !hasArrived) {
        setHasArrived(true);
        speakInstruction(
          activeStage === 'pickup'
            ? 'Has llegado a la esquina vehicular de recogida.'
            : 'Has llegado a la ubicación del cliente.'
        );
      }

      if (lastRecalculateCoordsRef.current) {
        const distFromLastCalculation = calculateDistanceMeters(
          currentCoords,
          lastRecalculateCoordsRef.current
        );
        if (distFromLastCalculation > 75) {
          calculateRoute(currentCoords, destinationCoords, customRoadblocks);
        }
      }
    }
  }, [
    currentCoords,
    effectiveOriginCoords,
    effectiveHeading,
    activePointingDegrees,
    isFollowingDriver,
    is3DMode,
    mapLoaded,
    destinationCoords,
    routeResult,
    currentStepIndex,
    hasArrived,
    activeStage,
    customRoadblocks,
    speakInstruction,
    calculateRoute,
  ]);

  // Recenter Camera & Lock onto Exact GPS Location + Heading
  const handleLocateMyExactAddress = () => {
    retryGPS();
    const map = mapInstanceRef.current;
    if (!map) return;

    const centerPoint = currentCoords || effectiveOriginCoords;
    const targetBearing =
      effectiveHeading !== null
        ? effectiveHeading
        : calculateBearing(centerPoint, destinationCoords);

    fetchReverseGeocodeAddress(centerPoint, token).then((res) => {
      setMyExactAddress(res);
    });

    map.flyTo({
      center: centerPoint,
      pitch: is3DMode ? 65 : 0,
      bearing: is3DMode ? targetBearing : 0,
      zoom: 17.5,
      duration: 950,
    });
    setIsFollowingDriver(true);
    setAimPointerActive(false);
  };

  // Toggle Aiming Crosshair Mode ("Ver dirección exacta a la que apunto en el mapa")
  const handleToggleAimPointer = () => {
    requestCompassPermission();
    const next = !aimPointerActive;
    setAimPointerActive(next);
    if (next && mapInstanceRef.current) {
      const c = mapInstanceRef.current.getCenter();
      fetchReverseGeocodeAddress(
        [Number(c.lng.toFixed(5)), Number(c.lat.toFixed(5))],
        token
      ).then((res) => setAimedAddress(res));
    }
  };

  // Toggle 3D / 2D Camera
  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const next3D = !is3DMode;
    setIs3DMode(next3D);

    const centerPoint = currentCoords || effectiveOriginCoords;
    const targetBearing =
      effectiveHeading !== null
        ? effectiveHeading
        : calculateBearing(centerPoint, destinationCoords);

    map.easeTo({
      pitch: next3D ? 65 : 0,
      bearing: next3D ? targetBearing : 0,
      duration: 800,
    });
  };

  // Overview Camera: fit entire route
  const handleFitRouteOverview = () => {
    const map = mapInstanceRef.current;
    if (!map || !routeResult) return;

    setIsFollowingDriver(false);
    const coords = [...routeResult.geoJson.geometry.coordinates];
    if (routeResult.accessResolution?.exactCoord) {
      coords.push(routeResult.accessResolution.exactCoord);
    }
    if (coords.length > 0) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new mapboxgl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number]
        )
      );

      map.fitBounds(bounds, {
        padding: { top: 180, bottom: 250, left: 45, right: 45 },
        pitch: 35,
        duration: 1100,
      });
    }
  };

  // Complete Stage 1 (Pickup) and transition immediately to Stage 2 (Customer Dropoff)
  const handleCompleteStageAndContinue = () => {
    setHasArrived(false);
    if (activeStage === 'pickup') {
      if (onAdvanceOrderStatus) {
        onAdvanceOrderStatus(order.id, 'dropoff');
      }
      setActiveStage('dropoff');
      setIsFollowingDriver(true);
      speakInstruction(
        'Pedido recogido. Trazando ruta vehicular óptima hacia el cliente evitando zonas peatonales.'
      );
    } else {
      if (onAdvanceOrderStatus) {
        onAdvanceOrderStatus(order.id, 'dropoff');
      }
      onExit();
    }
  };

  // Turn-by-Turn current and next steps
  const activeStep: NavigationStep | undefined =
    routeResult?.steps[currentStepIndex];
  const nextStep: NavigationStep | undefined =
    routeResult?.steps[currentStepIndex + 1];

  // Real-time distance to current maneuver
  const distanceToCurrentManeuver = useMemo(() => {
    if (!activeStep) return 0;
    const fromPoint = currentCoords || effectiveOriginCoords;
    return calculateDistanceMeters(fromPoint, activeStep.maneuver.location);
  }, [activeStep, currentCoords, effectiveOriginCoords]);

  // Destination address details based on current stage
  const destinationAddress =
    activeStage === 'pickup' ? order.pickup.address : order.dropoff.address;
  const destinationReference =
    activeStage === 'pickup'
      ? order.pickup.referencePoint
      : order.dropoff.referencePoint;
  const destinationTitle =
    activeStage === 'pickup'
      ? order.businessName || 'Tienda / Agente de recogida'
      : 'Entrega al cliente final';

  const snappedResolution = routeResult?.accessResolution;

  return (
    <div
      data-testid="gps-navigation-screen"
      className="fixed inset-0 z-50 bg-[#061814] w-screen h-screen overflow-hidden flex flex-col select-none touch-none"
    >
      {/* 1. FULL-VIEWPORT 3D MAP CANVAS (100% OF SCREEN) */}
      <div
        ref={mapContainerRef}
        className={`absolute inset-0 w-full h-full ${
          isMarkingRoadblock ? 'cursor-crosshair' : ''
        }`}
      />

      {/* CENTER AIMING RETICLE WHEN AIM POINTER MODE IS ACTIVE */}
      {aimPointerActive && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="relative flex flex-col items-center">
            <div className="px-3 py-1.5 rounded-2xl bg-[#0A221C]/95 border border-[#F0ABFC] text-white text-xs font-bold shadow-2xl mb-2 max-w-[260px] text-center">
              <p className="text-[10px] text-[#F0ABFC] font-semibold">
                Dirección a la que apuntas ({pointingCardinal.label})
              </p>
              <p className="truncate">
                {aimedAddress?.streetAddress || 'Calculando calle apuntada...'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-[#F0ABFC] bg-[#9333EA]/25 flex items-center justify-center shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F0ABFC]" />
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP GOOGLE MAPS-STYLE TURN-BY-TURN HUD + 2-STAGE SWITCHER + COMPASS ORIENTATION */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-[max(env(safe-area-inset-top),10px)] px-3 pointer-events-none">
        <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
          {/* Main Google Maps Turn-by-Turn Banner */}
          <div className="rounded-3xl bg-[#064B3C]/95 backdrop-blur-md text-white border border-white/15 shadow-2xl p-3.5 transition-all">
            <div className="flex items-center gap-3">
              {/* Turn Icon Box */}
              <div className="w-13 h-13 rounded-2xl bg-[#078F68] border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                {activeStep ? (
                  <ManeuverIcon
                    type={activeStep.maneuver.type}
                    modifier={activeStep.maneuver.modifier}
                    className="w-7 h-7"
                  />
                ) : (
                  <Navigation className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Maneuver Distance & Street Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-black tracking-tight text-white tabular-nums">
                    {formatManeuverDistance(distanceToCurrentManeuver)}
                  </span>
                  {activeStep?.streetName && (
                    <span className="text-xs font-semibold text-[#F0ABFC] truncate">
                      {activeStep.streetName}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm text-[#EAF8F2] truncate mt-0.5 leading-snug">
                  {activeStep?.bannerInstruction ||
                    activeStep?.maneuver.instruction ||
                    'Calculando ruta vehicular óptima...'}
                </p>
              </div>

              {/* Close Full-Screen Navigation */}
              <button
                type="button"
                onClick={onExit}
                aria-label="Cerrar navegador"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Compass & Pointing Direction Bar ("Dirección a la que apunto") */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 text-[#F0ABFC]">
                <Compass
                  className="w-3.5 h-3.5 shrink-0 transition-transform duration-300"
                  style={{ transform: `rotate(${activePointingDegrees}deg)` }}
                />
                <span className="font-bold text-white shrink-0">Apuntas:</span>
                <span className="truncate font-semibold">
                  {pointingCardinal.label} · Hacia{' '}
                  {activeStep?.streetName || destinationTitle}
                </span>
              </div>

              {nextStep && (
                <span className="shrink-0 text-[#8BE0C8] font-medium tabular-nums">
                  Luego {formatManeuverDistance(nextStep.distanceMeters)}
                </span>
              )}
            </div>
          </div>

          {/* 2-Stage Delivery Selector Bar (Stage 1: Store/Agent -> Stage 2: Customer) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0A221C]/90 backdrop-blur-md border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveStage('pickup')}
              className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeStage === 'pickup'
                  ? 'bg-[#9333EA] text-white shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1. Ir a Tienda / Agente</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStage('dropoff')}
              className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeStage === 'dropoff'
                  ? 'bg-[#9333EA] text-white shadow-sm'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Ir al Cliente</span>
            </button>
          </div>

          {/* Interactive Roadblock Mode Banner */}
          {isMarkingRoadblock && (
            <div className="rounded-2xl bg-red-600/95 backdrop-blur-md border border-red-300 text-white px-3.5 py-2.5 shadow-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Ban className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  Toca una calle en el mapa 3D para marcarla cerrada u obra
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMarkingRoadblock(false)}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Route Error Alert if any */}
          {routeError && (
            <div className="rounded-2xl bg-red-600/90 backdrop-blur-md border border-red-400 text-white px-3.5 py-2 shadow-lg flex items-center justify-between gap-2 text-xs">
              <span className="truncate">{routeError}</span>
              <button
                type="button"
                onClick={() =>
                  calculateRoute(
                    effectiveOriginCoords,
                    destinationCoords,
                    customRoadblocks
                  )
                }
                className="underline font-bold text-white shrink-0 cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. FLOATING MAP CAMERA, COMPASS AIM & ROADBLOCK CONTROLS (RIGHT EDGE) */}
      <div className="absolute right-3 top-56 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Locate My Exact GPS & Street Address Button */}
        <button
          type="button"
          onClick={handleLocateMyExactAddress}
          aria-label="Centrar en mi ubicación y dirección exacta"
          title="Mi dirección exacta GPS y rumbo"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
            isFollowingDriver
              ? 'bg-[#9333EA] text-white ring-2 ring-white shadow-[#9333EA]/40'
              : 'bg-white text-[#102F27] hover:bg-[#EAF8F2]'
          }`}
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* Aiming Crosshair / Compass Pointer Toggle ("Dirección a la que apunto") */}
        <button
          type="button"
          onClick={handleToggleAimPointer}
          aria-label="Activar mira para ver la dirección a la que apunto"
          title="Mira de dirección a la que apunto"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
            aimPointerActive
              ? 'bg-[#F0ABFC] text-[#2E054E] ring-2 ring-white'
              : 'bg-white text-[#9333EA] hover:bg-[#F3E8FF]'
          }`}
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* 3D / 2D Perspective Toggle */}
        <button
          type="button"
          onClick={handleToggle3D}
          aria-label={is3DMode ? 'Cambiar a vista 2D' : 'Cambiar a 3D'}
          title={is3DMode ? 'Vista 3D activa' : 'Vista 2D'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
            is3DMode
              ? 'bg-[#064B3C] text-white ring-2 ring-white/50'
              : 'bg-white text-[#102F27] hover:bg-[#EAF8F2]'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Mark Closed Street / Construction Roadblock Toggle */}
        <button
          type="button"
          onClick={() => setIsMarkingRoadblock((prev) => !prev)}
          aria-label="Marcar calle cerrada u obra en el mapa"
          title="Marcar calle cerrada u obra vial"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
            isMarkingRoadblock
              ? 'bg-red-600 text-white ring-2 ring-white'
              : 'bg-white text-red-600 hover:bg-red-50'
          }`}
        >
          <Ban className="w-5 h-5" />
        </button>

        {/* Clear Custom Roadblocks Button */}
        {customRoadblocks.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllRoadblocks}
            aria-label="Quitar calles bloqueadas"
            title={`Quitar ${customRoadblocks.length} bloqueo(s) vial(es)`}
            className="w-11 h-11 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        {/* Voice Guidance Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (next && activeStep) {
              speakInstruction(
                activeStep.bannerInstruction || activeStep.maneuver.instruction
              );
            }
          }}
          aria-label={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 ${
            voiceEnabled
              ? 'bg-white text-[#078F68]'
              : 'bg-white/80 text-gray-400'
          }`}
        >
          {voiceEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        {/* Route Overview Fit Bounds Button */}
        <button
          type="button"
          onClick={handleFitRouteOverview}
          aria-label="Ver ruta completa"
          title="Ver recorrido completo"
          className="w-11 h-11 rounded-2xl bg-white text-[#102F27] hover:bg-[#EAF8F2] flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95"
        >
          <Eye className="w-5 h-5 text-[#064B3C]" />
        </button>
      </div>

      {/* 4. COMPACT BOTTOM ARRIVAL, MY EXACT ADDRESS & STAGE PROGRESSION PANEL */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-[max(env(safe-area-inset-bottom),12px)] px-3 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="rounded-3xl bg-[#0A221C]/95 backdrop-blur-md border border-white/15 p-4 shadow-2xl text-white space-y-2.5">
            {/* Top row: ETA, Distance, Arrival Time & Order Price */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-2xl font-extrabold text-[#F0ABFC] tracking-tight tabular-nums">
                  {routeResult
                    ? formatDurationMinutes(routeResult.durationSeconds)
                    : '-- min'}
                </span>
                <span className="text-xs font-medium text-white/80 tabular-nums">
                  {routeResult
                    ? `${(routeResult.distanceMeters / 1000).toFixed(1)} km · Llegada ${formatEstimatedArrivalTime(
                        routeResult.durationSeconds
                      )}`
                    : 'Trazando ruta vehicular...'}
                </span>
              </div>

              <span className="text-xs font-bold text-[#8BE0C8] tabular-nums shrink-0">
                {formatPenCurrency(order.totalAmount)}
              </span>
            </div>

            {/* MY EXACT CURRENT ADDRESS & COMPASS HEADING BOX */}
            <div className="rounded-2xl bg-white/8 border border-white/10 px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <LocateFixed className="w-4 h-4 text-[#F0ABFC] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#F0ABFC]">
                      Mi dirección exacta:
                    </span>
                    <span className="text-[10px] text-white/70 tabular-nums">
                      {gpsStatus === 'active'
                        ? `GPS Real${accuracyMeters ? ` ±${accuracyMeters}m` : ''}`
                        : compassHeading !== null
                        ? `Brújula ${compassHeading}°`
                        : 'Posición activa'}
                    </span>
                  </div>
                  <p className="font-semibold text-white truncate">
                    {myExactAddress?.streetAddress || 'Obteniendo calle exacta...'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLocateMyExactAddress}
                className="px-2.5 py-1 rounded-xl bg-[#9333EA]/40 hover:bg-[#9333EA]/70 border border-[#F0ABFC]/40 text-[11px] font-bold text-white shrink-0 transition-colors cursor-pointer"
              >
                Actualizar GPS
              </button>
            </div>

            {/* Vehicular Corner Resolution Alert (When Store/Client is in Plaza Mayor or Pedestrian Street) */}
            {snappedResolution?.isSnappedToCorner && (
              <div className="rounded-2xl bg-[#078F68]/35 border border-[#8BE0C8]/40 px-3 py-2 flex items-start gap-2 text-xs">
                <Footprints className="w-4 h-4 text-[#8BE0C8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[#8BE0C8] truncate">
                    Zona peatonal evitada · Parada en esquina permitida
                  </p>
                  <p className="text-[11px] text-white/90 truncate">
                    Moto hasta {snappedResolution.cornerLabel} (+
                    {snappedResolution.walkingDistanceMeters} m a pie)
                  </p>
                </div>
              </div>
            )}

            {/* Destination Address Line */}
            <div className="flex items-start gap-2.5 pt-1.5 border-t border-white/10">
              <div className="w-8 h-8 rounded-xl bg-[#9333EA]/30 border border-[#F0ABFC]/40 text-[#F0ABFC] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white truncate">
                    {activeStage === 'pickup'
                      ? `Etapa 1 · ${destinationTitle}`
                      : `Etapa 2 · ${destinationTitle}`}
                  </span>
                  <span className="text-[11px] text-[#8BE0C8] shrink-0 tabular-nums">
                    Rumbo {pointingCardinal.shortCardinal} ({pointingCardinal.degrees}°)
                  </span>
                </div>
                <p className="text-white/85 truncate mt-0.5">{destinationAddress}</p>
                {destinationReference && (
                  <p className="text-[11px] text-[#8BE0C8] truncate">
                    Ref: {destinationReference}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions: Exit + Complete Current Stage */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onExit}
                className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-display text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Salir</span>
              </button>

              <button
                type="button"
                onClick={handleCompleteStageAndContinue}
                className="flex-1 h-12 px-4 rounded-2xl bg-[#9333EA] hover:bg-[#7E22CE] active:scale-95 text-white font-display text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#9333EA]/30 transition-all cursor-pointer"
              >
                {activeStage === 'pickup' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      Confirmar recogida · Ir al Cliente
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Confirmar entrega final</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ARRIVAL MODAL */}
      {hasArrived && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#9333EA]">
                {activeStage === 'pickup'
                  ? 'Etapa 1 completada'
                  : 'Destino final alcanzado'}
              </span>
              <h3 className="font-display text-xl font-black text-[#102F27]">
                {activeStage === 'pickup'
                  ? 'Llegaste a la esquina de recogida'
                  : 'Llegaste donde el cliente'}
              </h3>
              <p className="text-xs text-[#64877C] leading-relaxed">
                {snappedResolution?.isSnappedToCorner
                  ? `Parada vehicular en ${snappedResolution.cornerLabel} para ingresar a ${destinationAddress}.`
                  : `Ubicación: ${destinationAddress}`}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCompleteStageAndContinue}
                className="w-full h-12 rounded-full bg-[#9333EA] hover:bg-[#7E22CE] text-white font-display text-sm font-bold shadow-lg transition-colors cursor-pointer"
              >
                {activeStage === 'pickup'
                  ? 'Recoger pedido e iniciar Etapa 2 (Cliente)'
                  : 'Completar entrega y finalizar'}
              </button>

              <button
                type="button"
                onClick={() => setHasArrived(false)}
                className="w-full h-11 rounded-full bg-[#EAF8F2] hover:bg-[#DCECE5] text-[#064B3C] font-display text-xs font-bold transition-colors cursor-pointer"
              >
                Seguir viendo el mapa 3D
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
