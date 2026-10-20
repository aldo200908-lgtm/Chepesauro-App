import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidLngLat,
  fetchMapboxDirections,
  VERIFIED_PUNO_SAMPLE_POINTS,
} from './mapboxDirections.ts';

test('isValidLngLat validates coordinate boundaries and reject malformed coordinates', () => {
  // Valid coordinates
  assert.equal(isValidLngLat([-70.0282, -15.8402]), true);
  assert.equal(isValidLngLat([0, 0]), true);
  assert.equal(isValidLngLat([-180, -90]), true);
  assert.equal(isValidLngLat([180, 90]), true);

  // Invalid coordinates
  assert.equal(isValidLngLat(null), false);
  assert.equal(isValidLngLat(undefined), false);
  assert.equal(isValidLngLat([]), false);
  assert.equal(isValidLngLat([-70.0282]), false);
  assert.equal(isValidLngLat([-70.0282, -15.8402, 100]), false);
  assert.equal(isValidLngLat([-181, 0]), false);
  assert.equal(isValidLngLat([181, 0]), false);
  assert.equal(isValidLngLat([0, -91]), false);
  assert.equal(isValidLngLat([0, 91]), false);
  assert.equal(isValidLngLat(['-70.02', '-15.84']), false);
  assert.equal(isValidLngLat([NaN, -15.84]), false);
  assert.equal(isValidLngLat([-70.02, Infinity]), false);
});

test('fetchMapboxDirections rejects missing token and invalid coordinates without making network requests', async () => {
  // Missing token
  const noToken = await fetchMapboxDirections(
    [-70.0282, -15.8402],
    [-70.0165, -15.8368],
    ''
  );
  assert.equal(noToken.success, false);
  assert.ok(noToken.error.includes('Token'));

  // Invalid origin
  const invalidOrigin = await fetchMapboxDirections(
    [200, 0] as any,
    [-70.0165, -15.8368],
    'pk.test'
  );
  assert.equal(invalidOrigin.success, false);
  assert.ok(invalidOrigin.error.includes('origen'));

  // Invalid destination
  const invalidDest = await fetchMapboxDirections(
    [-70.0282, -15.8402],
    [0, 100] as any,
    'pk.test'
  );
  assert.equal(invalidDest.success, false);
  assert.ok(invalidDest.error.includes('destino'));
});

test('verified Puno sample points contain real, geographically accurate coordinates in Puno, Peru', () => {
  const { catedralPuno, puertoLacustre, mercadoCentral } = VERIFIED_PUNO_SAMPLE_POINTS;
  assert.equal(isValidLngLat(catedralPuno.coordinates), true);
  assert.equal(isValidLngLat(puertoLacustre.coordinates), true);
  assert.equal(isValidLngLat(mercadoCentral.coordinates), true);

  // Puno is located approximately at 70°W and 15°S
  assert.ok(catedralPuno.coordinates[0] < -69.9 && catedralPuno.coordinates[0] > -70.1);
  assert.ok(catedralPuno.coordinates[1] < -15.7 && catedralPuno.coordinates[1] > -15.9);
});

test('calculateDistanceMeters computes accurate haversine distance between real points', async () => {
  const { calculateDistanceMeters, calculateBearing } = await import('./mapboxDirections.ts');

  // Same point distance is 0
  const zero = calculateDistanceMeters([-70.0282, -15.8402], [-70.0282, -15.8402]);
  assert.equal(Math.round(zero), 0);

  // Distance between Plaza de Armas Puno and Puerto Lacustre is ~1.3 km
  const dist = calculateDistanceMeters([-70.0282, -15.8402], [-70.0165, -15.8368]);
  assert.ok(dist > 1100 && dist < 1500, `Expected ~1.3km, got ${dist}`);

  // Bearing between Plaza de Armas and Puerto Lacustre is roughly east-northeast (60° - 80°)
  const bearing = calculateBearing([-70.0282, -15.8402], [-70.0165, -15.8368]);
  assert.ok(bearing >= 0 && bearing <= 360);
  assert.ok(bearing > 50 && bearing < 90, `Expected ENE bearing, got ${bearing}`);
});

test('formatting utilities produce clear, driver-friendly instructions', async () => {
  const {
    formatManeuverDistance,
    formatDurationMinutes,
    formatEstimatedArrivalTime,
  } = await import('./mapboxDirections.ts');

  assert.equal(formatManeuverDistance(15), 'Ahora');
  assert.equal(formatManeuverDistance(25), 'Ahora');
  assert.equal(formatManeuverDistance(82), 'En 80 m');
  assert.equal(formatManeuverDistance(250), 'En 250 m');
  assert.equal(formatManeuverDistance(1500), 'En 1.5 km');

  assert.equal(formatDurationMinutes(45), '1 min');
  assert.equal(formatDurationMinutes(180), '3 min');
  assert.equal(formatDurationMinutes(3660), '1 h 1 min');

  const eta = formatEstimatedArrivalTime(600);
  assert.match(eta, /^\d{2}:\d{2}$/);
});

test('resolveVehicularAccessPoint snaps Plaza Mayor de Puno and Jr. Lima pedestrian points to nearest legal vehicular corner', async () => {
  const { resolveVehicularAccessPoint, buildMapboxExcludeParam } = await import(
    './mapboxDirections.ts'
  );

  // Point inside Plaza Mayor de Puno ([-70.0282, -15.8402]) is snapped to a legal vehicular corner
  const plazaResolution = resolveVehicularAccessPoint(
    [-70.0282, -15.8402],
    [-70.0235, -15.8465]
  );
  assert.equal(plazaResolution.isSnappedToCorner, true);
  assert.ok(plazaResolution.cornerLabel?.includes('Esquina vehicular'));
  assert.ok(plazaResolution.walkingDistanceMeters > 20);
  assert.notDeepEqual(plazaResolution.vehicularCoord, [-70.0282, -15.8402]);

  // Point on open vehicular road (Mercado Laykakota [-70.0235, -15.8465]) is not snapped
  const openRoadResolution = resolveVehicularAccessPoint([-70.0235, -15.8465]);
  assert.equal(openRoadResolution.isSnappedToCorner, false);
  assert.deepEqual(openRoadResolution.vehicularCoord, [-70.0235, -15.8465]);

  // Exclude param includes Puno pedestrian points and custom roadblocks
  const excludeStr = buildMapboxExcludeParam([
    {
      id: 'rb-test',
      coordinates: [-70.025, -15.839],
      label: 'Obra vial',
      createdAt: '2026-10-20T00:00:00Z',
    },
  ]);
  assert.ok(excludeStr.includes('point(-70.0282 -15.8402)'));
  assert.ok(excludeStr.includes('point(-70.025 -15.839)'));
});

test('formatCardinalDirection and fetchReverseGeocodeAddress return accurate direction and street info', async () => {
  const { formatCardinalDirection, fetchReverseGeocodeAddress } = await import(
    './mapboxDirections.ts'
  );

  const north = formatCardinalDirection(0);
  assert.equal(north.shortCardinal, 'N');
  assert.equal(north.fullName, 'Norte');

  const northEast = formatCardinalDirection(48);
  assert.equal(northEast.shortCardinal, 'NE');
  assert.equal(northEast.fullName, 'Noreste');

  const southWest = formatCardinalDirection(225);
  assert.equal(southWest.shortCardinal, 'SO');
  assert.equal(southWest.fullName, 'Suroeste');

  // Local fallback reverse geocoding for Mercado Laykakota in Puno
  const addr = await fetchReverseGeocodeAddress([-70.0235, -15.8465], '');
  assert.ok(addr.streetAddress.includes('Laykakota'));
});


