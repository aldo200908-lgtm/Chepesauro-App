import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_OPTIONS,
  createInitialOnboardingState,
  selectRole,
  confirmRoleSelection,
  resetOnboardingSelection,
  getPrimaryActionLabel,
} from './onboarding.ts';

test('initial state starts with no role selected on selection step', () => {
  const state = createInitialOnboardingState();
  assert.equal(state.selectedRole, null);
  assert.equal(state.step, 'selection');
  assert.equal(getPrimaryActionLabel(state.selectedRole), 'Selecciona un perfil para continuar');
});

test('selecting usuario updates selectedRole and action button label', () => {
  const initial = createInitialOnboardingState();
  const next = selectRole(initial, 'usuario');
  assert.equal(next.selectedRole, 'usuario');
  assert.equal(next.step, 'selection');
  assert.equal(getPrimaryActionLabel(next.selectedRole), 'Continuar como Usuario');
});

test('selecting motorizado updates selectedRole and action button label', () => {
  const initial = createInitialOnboardingState();
  const next = selectRole(initial, 'motorizado');
  assert.equal(next.selectedRole, 'motorizado');
  assert.equal(next.step, 'selection');
  assert.equal(getPrimaryActionLabel(next.selectedRole), 'Continuar como Motorizado');
});

test('confirmRoleSelection does not advance if no role is selected', () => {
  const initial = createInitialOnboardingState();
  const afterConfirm = confirmRoleSelection(initial);
  assert.equal(afterConfirm.step, 'selection');
  assert.equal(afterConfirm.selectedRole, null);
});

test('confirmRoleSelection transitions to confirmed step when role is chosen, and reset returns to selection', () => {
  const selected = selectRole(createInitialOnboardingState(), 'motorizado');
  const confirmed = confirmRoleSelection(selected);
  assert.equal(confirmed.step, 'confirmed');
  assert.equal(confirmed.selectedRole, 'motorizado');

  const backToSelection = resetOnboardingSelection(confirmed);
  assert.equal(backToSelection.step, 'selection');
  assert.equal(backToSelection.selectedRole, 'motorizado');
});

test('role options define both usuario and motorizado with complete Spanish copy', () => {
  assert.equal(ROLE_OPTIONS.usuario.title, 'Usuario');
  assert.equal(ROLE_OPTIONS.motorizado.title, 'Motorizado');
  assert.equal(ROLE_OPTIONS.usuario.highlights.length, 3);
  assert.equal(ROLE_OPTIONS.motorizado.highlights.length, 3);
});
