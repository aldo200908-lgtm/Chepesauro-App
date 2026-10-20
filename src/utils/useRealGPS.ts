import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateBearing, calculateDistanceMeters } from './mapboxDirections';

export type GPSStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout';

export interface RealGPSState {
  status: GPSStatus;
  currentCoords: [number, number] | null; // [lng, lat]
  accuracyMeters: number | null;
  heading: number | null; // Rumbo de desplazamiento GPS (0° a 360°)
  compassHeading: number | null; // Brújula / orientación física del dispositivo (0° a 360°)
  effectiveHeading: number | null; // Rumbo combinado (hacia donde apunta el usuario)
  speedMps: number | null; // Velocidad en m/s
  altitudeMeters: number | null;
  timestamp: number | null;
  errorMessage: string | null;
  startGPS: () => void;
  stopGPS: () => void;
  retryGPS: () => void;
  requestCompassPermission: () => Promise<void>;
}

export function useRealGPS(autoStart = true): RealGPSState {
  const [status, setStatus] = useState<GPSStatus>('idle');
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [speedMps, setSpeedMps] = useState<number | null>(null);
  const [altitudeMeters, setAltitudeMeters] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const prevCoordsRef = useRef<[number, number] | null>(null);

  // Device Orientation / Magnetometer listener for "Dirección a la que apunto"
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const anyEvent = event as any;
      // 1. iOS Safari webkitCompassHeading (0 = North, clockwise)
      if (
        typeof anyEvent.webkitCompassHeading === 'number' &&
        !Number.isNaN(anyEvent.webkitCompassHeading)
      ) {
        setCompassHeading(Math.round(anyEvent.webkitCompassHeading));
        return;
      }

      // 2. Android / Standard alpha angle (0..360 counter-clockwise -> convert to clockwise compass bearing)
      if (typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
        const screenAngle =
          typeof window.screen?.orientation?.angle === 'number'
            ? window.screen.orientation.angle
            : 0;
        const clockwiseHeading = (360 - event.alpha + screenAngle + 360) % 360;
        setCompassHeading(Math.round(clockwiseHeading));
      }
    };

    const win = window as any;
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation, true);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      if ('ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestCompassPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const DeviceOrientationEvt = window.DeviceOrientationEvent as any;
      if (
        DeviceOrientationEvt &&
        typeof DeviceOrientationEvt.requestPermission === 'function'
      ) {
        await DeviceOrientationEvt.requestPermission();
      }
    } catch {
      // Permission ignored or not required on Android/Desktop
    }
  }, []);

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startGPS = useCallback(() => {
    stopGPS();

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setErrorMessage('La geolocalización no está soportada en este navegador o dispositivo.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);

    const handleSuccess = (position: GeolocationPosition) => {
      const lng = position.coords.longitude;
      const lat = position.coords.latitude;
      const newCoords: [number, number] = [lng, lat];

      setStatus('active');
      setCurrentCoords(newCoords);
      setAccuracyMeters(
        typeof position.coords.accuracy === 'number' ? Math.round(position.coords.accuracy) : null
      );
      setSpeedMps(
        typeof position.coords.speed === 'number' && !Number.isNaN(position.coords.speed)
          ? position.coords.speed
          : null
      );
      setAltitudeMeters(
        typeof position.coords.altitude === 'number' ? position.coords.altitude : null
      );
      setTimestamp(position.timestamp);
      setErrorMessage(null);

      if (
        typeof position.coords.heading === 'number' &&
        !Number.isNaN(position.coords.heading) &&
        position.coords.heading !== null
      ) {
        setHeading(Math.round(position.coords.heading));
      } else if (prevCoordsRef.current) {
        const dist = calculateDistanceMeters(prevCoordsRef.current, newCoords);
        if (dist >= 2) {
          const calcBear = calculateBearing(prevCoordsRef.current, newCoords);
          setHeading(Math.round(calcBear));
        }
      }

      prevCoordsRef.current = newCoords;
    };

    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setStatus('denied');
          setErrorMessage(
            'Permiso de ubicación denegado. Activa el GPS en tu navegador para ver tu dirección exacta.'
          );
          break;
        case error.POSITION_UNAVAILABLE:
          setStatus('unavailable');
          setErrorMessage(
            'Señal de GPS no disponible en este momento. Comprueba que el GPS de tu celular esté encendido.'
          );
          break;
        case error.TIMEOUT:
          setStatus('timeout');
          setErrorMessage(
            'Tiempo de espera agotado al conectar con el sensor GPS. Reintentando...'
          );
          break;
        default:
          setStatus('unavailable');
          setErrorMessage(error.message || 'Error desconocido al acceder al GPS.');
      }
    };

    try {
      // Solicitud inmediata de ubicación exacta + seguimiento continuo
      navigator.geolocation.getCurrentPosition(handleSuccess, () => {}, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });

      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000,
      });
    } catch (err) {
      setStatus('unavailable');
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo iniciar el servicio de geolocalización.'
      );
    }
  }, [stopGPS]);

  const retryGPS = useCallback(() => {
    requestCompassPermission();
    startGPS();
  }, [requestCompassPermission, startGPS]);

  useEffect(() => {
    if (autoStart) {
      startGPS();
    }
    return () => {
      stopGPS();
    };
  }, [autoStart, startGPS, stopGPS]);

  // Prefer compassHeading when stationary or turning the phone; use GPS heading when moving fast
  const effectiveHeading =
    speedMps !== null && speedMps > 2.5 && heading !== null
      ? heading
      : compassHeading !== null
      ? compassHeading
      : heading;

  return {
    status,
    currentCoords,
    accuracyMeters,
    heading,
    compassHeading,
    effectiveHeading,
    speedMps,
    altitudeMeters,
    timestamp,
    errorMessage,
    startGPS,
    stopGPS,
    retryGPS,
    requestCompassPermission,
  };
}
