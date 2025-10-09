// server.js

// --- Dependencias existentes ---
const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');
const ip = require('localip')();
const port = 8081;

// --- NUEVAS DEPENDENCIAS ---
require('dotenv').config(); // Para leer el archivo .env
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { URL } = require('url');

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
        const songs = response.Contents
            .map(item => item.Key)
            .filter(key => key !== 'ZIP/');

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
  
  .listen(port, async () => {
    console.log(`Server running on http://${ip}:${port} ...`);
    const open = (await import('open')).default;
    open(`http://${ip}:${port}`);
  });