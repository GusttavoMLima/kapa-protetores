import assert from 'node:assert/strict';
import test from 'node:test';
import { animalEditorSchema, managementPageSchema } from '../src/screens/animalManagement/model.ts';

const form = { name: 'Amora', breed: '', species: 'cat', gender: 'female', age: '2', weightKg: '4,5', size: 2,
  status: 'rescued', healthCondition: 'healthy', castrated: 'unknown', dewormed: 'yes', vaccinated: true,
  mood: 'Tranquila', place: '', observations: 'Anotações internas' };

test('editor accepts Brazilian decimal weights and does not send hidden fields', () => {
  const input = animalEditorSchema.parse({ ...form, ageStage: 9, photos: [] });
  assert.equal(input.weightKg, 4.5); assert.equal(input.age, 2);
  assert.equal('ageStage' in input, false); assert.equal('photos' in input, false);
});
test('editor rejects blank, invalid, negative and out of range values', () => {
  for (const patch of [{ name: ' ' }, { age: '' }, { age: '1.5' }, { weightKg: '-2' }, { weightKg: '501' }, { weightKg: 'abc' }, { mood: '' }]) {
    assert.equal(animalEditorSchema.safeParse({ ...form, ...patch }).success, false);
  }
});
test('page validation accepts empty state and rejects malformed data', () => {
  const page = { items: [], total: 0, page: 1, pageSize: 12, counts: { rescued: 0, treating: 0, available: 0, adopted: 0 } };
  assert.equal(managementPageSchema.safeParse(page).success, true);
  assert.equal(managementPageSchema.safeParse({ ...page, items: [{ name: 'Missing required fields' }] }).success, false);
});
