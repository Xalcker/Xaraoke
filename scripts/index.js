import { CDGPlayer, CDGControls } from './js/cdgplayer.js';

let currentPlayer = null;
let allSongs = [];

// La función 'resetPlayer' ha sido eliminada.

function loadPlayer(zipBuffer) {
  document.getElementById('cdg_wrapper').innerHTML = ''; // Limpia el canvas anterior
  
  // Si no hay instancia, la crea. Si ya existe, la reutiliza.
  if (!currentPlayer) {
    currentPlayer = new CDGPlayer('#cdg_wrapper');
  }

  new CDGControls('#cdg_controls', currentPlayer);
  document.getElementById('play-button').disabled = true;
  document.getElementById('stop-button').hidden = false;
  
  currentPlayer.props.on('status', (val) => {
    if (val === 'File Loaded') {
      currentPlayer.start();
      
      const audioElement = document.querySelector('#cdg_wrapper audio');
      if (audioElement) {
        // Cuando la canción termina, solo desbloquea la UI de búsqueda
        audioElement.addEventListener('ended', () => {
          document.getElementById('cdg_controls').innerHTML = '';
          document.getElementById('play-button').disabled = false;
          document.getElementById('stop-button').hidden = true;
        });
      }
    }
  });

  currentPlayer.load(zipBuffer);
}

async function loadAndPlayFromUrls(mp3Url, cdgUrl) {
  try {
    const [mp3Response, cdgResponse] = await Promise.all([ fetch(mp3Url), fetch(cdgUrl) ]);
    if (!mp3Response.ok || !cdgResponse.ok) throw new Error(`Error downloading files`);
    const [mp3Buffer, cdgBuffer] = await Promise.all([ mp3Response.arrayBuffer(), cdgResponse.arrayBuffer() ]);
    const zip = new JSZip();
    zip.file('song.mp3', mp3Buffer);
    zip.file('song.cdg', cdgBuffer);
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    loadPlayer(zipBuffer);
  } catch (error) {
    console.error('Error processing karaoke from URLs:', error);
    document.getElementById('cdg_wrapper').innerHTML = '<h2>Error al cargar la canción</h2>';
  }
}

async function populateSongList() {
    const playButton = document.getElementById('play-button');
    const songInputElement = document.getElementById('song-input');
    try {
        const response = await fetch('/get-song-list');
        if (!response.ok) throw new Error('Could not get the song list from the server.');
        allSongs = await response.json();
        allSongs.sort();
        const dataListElement = document.getElementById('song-list-options');
        dataListElement.innerHTML = '';
        allSongs.forEach(songKey => {
            const option = document.createElement('option');
            option.value = songKey;
            dataListElement.appendChild(option);
        });
        songInputElement.placeholder = "Busca una canción...";
        playButton.disabled = false;
    } catch (error) {
        console.error(error);
        songInputElement.placeholder = 'Error al cargar canciones';
    }
}

// ===================================================================
//  INICIO DE LA APLICACIÓN
// ===================================================================

populateSongList();

document.getElementById('play-button').addEventListener('click', async () => {
    const songInput = document.getElementById('song-input');
    const songKey = songInput.value;
    if (!allSongs.includes(songKey)) {
        alert('Por favor, selecciona una canción válida de la lista.');
        songInput.focus();
        return;
    }
    try {
        const urlResponse = await fetch(`/api/get-song-urls?key=${encodeURIComponent(songKey)}`);
        if (!urlResponse.ok) throw new Error('Could not get the song URLs.');
        const { mp3Url, cdgUrl } = await urlResponse.json();
        loadAndPlayFromUrls(mp3Url, cdgUrl);
    } catch (error) {
        console.error(error);
        alert('Error al cargar la canción seleccionada.');
    }
});

document.getElementById('stop-button').addEventListener('click', () => {
    if (currentPlayer) {
        currentPlayer.stop();
        // Al detener, solo desbloquea la UI de búsqueda sin limpiar la pantalla
        document.getElementById('cdg_controls').innerHTML = '';
        document.getElementById('play-button').disabled = false;
        document.getElementById('stop-button').hidden = true;
    }
});