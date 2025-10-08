require('dotenv').config();
const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');
const open = require('open');
const ip = require('localip')();
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const port = 8081;

const s3Client = new S3Client({
  endpoint: `https://${process.env.S3_ENDPOINT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const app = connect();

app.use('/get-song-list', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET_NAME });
    const { Contents } = await s3Client.send(command);
    const songList = Contents
      .filter(file => file.Key.endsWith('.cdg'))
      .map(file => file.Key.replace('.cdg', ''));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(songList));
  } catch (error) {
    console.error('Error al listar archivos del bucket:', error);
    res.statusCode = 500;
    res.end('Error interno del servidor.');
  }
});

app.use('/api/get-song-urls', async (req, res) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const songKey = urlParams.get('key');
  if (!songKey) {
    res.statusCode = 400;
    return res.end('Falta el parámetro "key".');
  }
  try {
    const createPresignedUrl = (key) => {
      const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key });
      return getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutos
    };
    const [mp3Url, cdgUrl] = await Promise.all([
      createPresignedUrl(`${songKey}.mp3`),
      createPresignedUrl(`${songKey}.cdg`),
    ]);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ mp3Url, cdgUrl }));
  } catch (error) {
    console.error('Error al generar URLs prefirmadas:', error);
    res.statusCode = 500;
    res.end('Error interno del servidor.');
  }
});

app.use(function (req, res, next) {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

const setHeaders = (res) => res.setHeader('Content-Type', 'application/javascript');
app.use(serveStatic(__dirname));
app.use('/js', serveStatic(path.join(__dirname, '../dist'), { index: false, setHeaders }));
app.use('/node_modules', serveStatic(path.join(__dirname, '../node_modules'), { index: false, setHeaders }));

app.listen(port, function () {
  console.log(`Server running on http://${ip}:${port} ...`);
  open(`http://${ip}:${port}`);
});