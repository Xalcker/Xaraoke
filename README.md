# Xaraoke 🎤

Aplicación web de karaoke que reproduce archivos CDG+MP3 almacenados en un bucket S3 compatible.

## Características

- Reproducción de archivos de karaoke en formato CDG (gráficos) + MP3 (audio)
- Búsqueda de canciones con autocompletado
- Almacenamiento en la nube usando S3
- Interfaz simple y responsive
- Controles de reproducción (Play/Pausa/Detener)

## Requisitos

- Node.js (versión 14 o superior)
- Bucket S3 compatible (AWS S3, MinIO, DigitalOcean Spaces, etc.)
- Archivos de karaoke en formato .zip (conteniendo .cdg y .mp3)

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd xaraoke
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con tus credenciales de S3:
```env
S3_ENDPOINT=https://tu-endpoint.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=tu_access_key
S3_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=nombre-de-tu-bucket
```

4. Organiza tus archivos de karaoke en el bucket S3 dentro de una carpeta llamada `ZIP/`:
```
tu-bucket/
└── ZIP/
    ├── cancion1.zip
    ├── cancion2.zip
    └── cancion3.zip
```

## Uso

1. Inicia el servidor:
```bash
npm start
```

2. El navegador se abrirá automáticamente en `http://localhost:8081`

3. Busca una canción usando el campo de búsqueda

4. Selecciona una canción de la lista para cargarla

5. Usa los botones de control para reproducir, pausar o detener

## Estructura del Proyecto

```
xaraoke/
├── scripts/
│   ├── favicon.ico
│   ├── index.html             # Interfaz principal
│   ├── index.js               # Lógica del cliente
│   ├── server.js              # Servidor Node.js
│   ├── style.css              # Estilos
│   └── xaraoke.svg            # Logo
├── .env                       # Configuración (no incluido en git)
├── .gitignore
├── package.json
└── README.md
```

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Node.js, Connect, Serve-Static
- **Almacenamiento**: AWS SDK v3 para S3
- **Reproductor**: CDGPlayer (formato de karaoke CDG)

## Dependencias Principales

- `@aws-sdk/client-s3` - Cliente S3 para AWS SDK v3
- `@aws-sdk/s3-request-presigner` - Generación de URLs prefirmadas
- `cdgplayer` - Reproductor de archivos CDG
- `connect` - Servidor HTTP minimalista
- `dotenv` - Gestión de variables de entorno

## Configuración de S3

El proyecto utiliza URLs prefirmadas para acceder a los archivos de forma segura. Las URLs expiran después de 30 segundos por defecto.

Para usar con MinIO u otro servicio compatible con S3, simplemente ajusta el `S3_ENDPOINT` en tu archivo `.env`.

## Autor

Xalcker

## Licencia

ISC
