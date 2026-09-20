// server.js

// --- Dependencias existentes ---
const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');
const ip = require('localip')();

// --- NUEVAS DEPENDENCIAS ---
require('dotenv').config(); // Para leer el archivo .env
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { URL } = require('url');
const { getMissingEnvVars, extractSongKeys } = require('./lib');

const port = process.env.PORT || 8081;

// --- VALIDACIÓN DE VARIABLES DE ENTORNO ---
const REQUIRED_ENV_VARS = ['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
const missingEnvVars = getMissingEnvVars(process.env, REQUIRED_ENV_VARS);
if (missingEnvVars.length > 0) {
  console.error(`Faltan variables de entorno requeridas: ${missingEnvVars.join(', ')}`);
  console.error('Creá un archivo .env en la raíz del proyecto (ver .env.example).');
  process.exit(1);
}

// --- NUEVA CONFIGURACIÓN DEL CLIENTE S3 ---
// Lee las credenciales y configuración desde el archivo .env
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- Servidor Connect ---
connect()
  // --- NUEVO MIDDLEWARE PARA MANEJAR LAS PETICIONES A LA API ---
  .use(async (req, res, next) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    // Endpoint para listar las canciones
    if (requestUrl.pathname === '/api/songs') {
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: 'ZIP/', // La "carpeta" que especificaste
        });
        const response = await s3Client.send(command);
        // Filtramos para obtener solo los nombres de archivo y no la carpeta
        const songs = extractSongKeys(response, 'ZIP/');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(songs));
      } catch (error) {
        console.error('Error listing S3 objects:', error);
        res.writeHead(500);
        res.end('Error fetching song list.');
      }
      return; // Termina la ejecución para esta petición
    }

    // Endpoint para obtener la URL prefirmada
    if (requestUrl.pathname === '/api/song-url') {
      const songKey = requestUrl.searchParams.get('key');
      if (!songKey) {
        res.writeHead(400);
        res.end('Song key is missing.');
        return;
      }
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: songKey,
        });
        // La URL expirará en 30 segundos
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 30 });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: signedUrl }));
      } catch (error) {
        console.error('Error generating signed URL:', error);
        res.writeHead(500);
        res.end('Error generating URL.');
      }
      return; // Termina la ejecución
    }

    // Si no es una ruta de la API, continúa con los archivos estáticos
    next();
  })
  .use(serveStatic(__dirname)) // Sirve archivos como index.html
  // Sirve el build oficial de cdgplayer directamente desde node_modules,
  // para no mantener una copia duplicada del archivo en el repo.
  .use('/vendor/cdgplayer', serveStatic(path.join(__dirname, '..', 'node_modules', 'cdgplayer', 'dist')))

  .listen(port, async () => {
    console.log(`Server running on http://${ip}:${port} ...`);
    const open = (await import('open')).default;
    open(`http://${ip}:${port}`);
  });