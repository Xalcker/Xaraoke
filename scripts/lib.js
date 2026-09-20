// lib.js
// Funciones puras extraídas de server.js para poder testearlas sin
// necesidad de un servidor HTTP real ni credenciales de S3.

/**
 * Devuelve los nombres de las variables de entorno requeridas que
 * faltan (no están definidas o están vacías) en el objeto env dado.
 */
function getMissingEnvVars(env, requiredVars) {
  return requiredVars.filter(name => !env[name]);
}

/**
 * A partir de la respuesta de ListObjectsV2Command, devuelve las keys
 * de las canciones, excluyendo la propia "carpeta" (el objeto cuyo key
 * es igual al prefix). response.Contents puede ser undefined cuando no
 * hay objetos bajo el prefijo.
 */
function extractSongKeys(response, prefix) {
  return (response.Contents || [])
    .map(item => item.Key)
    .filter(key => key !== prefix);
}

module.exports = { getMissingEnvVars, extractSongKeys };
