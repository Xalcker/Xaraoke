const test = require('node:test');
const assert = require('node:assert/strict');
const { getMissingEnvVars, extractSongKeys } = require('./lib');

test('getMissingEnvVars', async (t) => {
  await t.test('devuelve vacío cuando todas las variables están presentes', () => {
    const env = { A: '1', B: '2' };
    assert.deepEqual(getMissingEnvVars(env, ['A', 'B']), []);
  });

  await t.test('detecta variables faltantes', () => {
    const env = { A: '1', B: '' };
    assert.deepEqual(getMissingEnvVars(env, ['A', 'B', 'C']), ['B', 'C']);
  });
});

test('extractSongKeys', async (t) => {
  await t.test('extrae las keys y excluye la carpeta', () => {
    const response = { Contents: [{ Key: 'ZIP/' }, { Key: 'ZIP/cancion1.zip' }, { Key: 'ZIP/cancion2.zip' }] };
    assert.deepEqual(extractSongKeys(response, 'ZIP/'), ['ZIP/cancion1.zip', 'ZIP/cancion2.zip']);
  });

  await t.test('devuelve un array vacío cuando no hay objetos bajo el prefijo', () => {
    const response = {};
    assert.deepEqual(extractSongKeys(response, 'ZIP/'), []);
  });
});
