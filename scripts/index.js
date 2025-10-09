import { CDGPlayer, CDGControls } from './js/cdgplayer.js';

// --- VARIABLES GLOBALES ---
const songMap = new Map();
let cdgPlayer = null; // Instancia reutilizable del reproductor
let isPlaying = false; // Para controlar el estado de reproducción

// --- FUNCIONES DEL REPRODUCTOR ---

/**
 * Inicializa el reproductor una sola vez al cargar la página.
 */
function initializePlayer() {
  const cdgWrapper = document.querySelector('#cdg_wrapper');
  const playPauseBtn = document.querySelector('#play-pause-btn');
  const stopBtn = document.querySelector('#stop-btn');
  
  if (!cdgPlayer) {
    cdgPlayer = new CDGPlayer('#cdg_wrapper');
    
    // Usamos .props.on para escuchar los eventos del reproductor
    cdgPlayer.props.on('play', () => {
      isPlaying = true;
      playPauseBtn.textContent = '⏸️ Pausa';
    });

    cdgPlayer.props.on('pause', () => {
      isPlaying = false;
      playPauseBtn.textContent = '▶️ Play';
    });

    cdgPlayer.props.on('stop', () => {
      isPlaying = false;
      playPauseBtn.textContent = '▶️ Play';
      cdgWrapper.classList.add('titleImage'); // Muestra el logo al detener
    });
    
    // Escuchamos el estado para saber cuándo se ha cargado un archivo
    cdgPlayer.props.on('status', (val) => {
      if (val === 'File Loaded') {
        console.log('File Loaded successfully and is ready to play.');
        
        // Habilitamos los botones pero NO iniciamos la reproducción
        playPauseBtn.disabled = false;
        stopBtn.disabled = false;
        
        // Nos aseguramos de que el botón muestre "Play"
        playPauseBtn.textContent = '▶️ Play';
        isPlaying = false;
      }
    });
  }
}

/**
 * Carga los datos de un archivo en la instancia existente del reproductor.
 * @param {ArrayBuffer} fileData - Los datos binarios del archivo .zip.
 */
function loadSong(fileData) {
  console.log('Attempting to load song into player...');
  cdgPlayer.load(fileData);
}

/**
 * Descarga el archivo de la canción desde la URL prefirmada y lo pasa a la función de carga.
 * @param {string} url - La URL prefirmada para descargar el archivo.
 */
async function loadSongFromUrl(url) {
  try {
    document.querySelector('#cdg_wrapper').classList.remove('titleImage');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const fileData = await response.arrayBuffer();
    loadSong(fileData);
  } catch (error) {
    console.error('Error loading song from URL:', error);
    alert('No se pudo cargar la canción. Revisa la consola.');
    document.querySelector('#cdg_wrapper').classList.add('titleImage');
  }
}

// --- LÓGICA DEL AUTOCOMPLETADO ---

/**
 * Puebla el <datalist> con las opciones de canciones obtenidas del servidor.
 * @param {string[]} songList - Un array de "keys" de canciones desde S3.
 */
function populateDatalist(songList) {
    const datalist = document.querySelector('#song-list');
    datalist.innerHTML = '';
    songList.forEach(songKey => {
        const songName = songKey.replace('ZIP/', '').replace('.zip', '');
        const option = document.createElement('option');
        option.value = songName;
        datalist.appendChild(option);
        songMap.set(songName, songKey);
    });
}

/**
 * Obtiene la lista de canciones desde nuestro backend y llama a la función para poblar el datalist.
 */
async function fetchAndPopulateSongs() {
    const searchInput = document.querySelector('#search-input');
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();
        populateDatalist(songs);
        searchInput.placeholder = 'Buscar canción...';
    } catch (error) {
        searchInput.placeholder = 'Error al cargar canciones';
        console.error('Failed to fetch song list:', error);
    }
}

// --- LÓGICA PRINCIPAL ---

document.addEventListener('DOMContentLoaded', () => {
  initializePlayer();
  fetchAndPopulateSongs();
  
  const searchInput = document.querySelector('#search-input');
  const playPauseBtn = document.querySelector('#play-pause-btn');
  const stopBtn = document.querySelector('#stop-btn');
  
  searchInput.addEventListener('input', async (event) => {
    const selectedName = event.target.value;
    
    if (songMap.has(selectedName)) {
      const selectedSongKey = songMap.get(selectedName);
      
      try {
        const encodedKey = encodeURIComponent(selectedSongKey);
        const response = await fetch(`/api/song-url?key=${encodedKey}`);
        const data = await response.json();
        await loadSongFromUrl(data.url);
        
        searchInput.value = '';
        
      } catch (error) {
        console.error('Could not get the signed URL:', error);
        alert('Error al obtener la URL de la canción.');
      }
    }
  });

  playPauseBtn.addEventListener('click', () => {
    cdgPlayer.togglePlay(); 
  });

  stopBtn.addEventListener('click', () => {
    cdgPlayer.stop();
  });
});