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
