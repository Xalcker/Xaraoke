import { CDGPlayer, CDGControls } from './js/cdgplayer.js';

let currentPlayer = null;

function resetPlayer() {
  const wrapper = document.getElementById('cdg_wrapper');
  wrapper.innerHTML = '<h2>Selecciona una canción para comenzar</h2>';
  const controls = document.getElementById('cdg_controls');
  controls.innerHTML = '';

  document.getElementById('song-input').value = '';

  document.getElementById('play-button').disabled = false;
  document.getElementById('stop-button').hidden = true;
  currentPlayer = null;
}

function loadPlayer(zipBuffer) {
  document.getElementById('cdg_wrapper').innerHTML = '';
  currentPlayer = new CDGPlayer('#cdg_wrapper');
  new CDGControls('#cdg_controls', currentPlayer, { position: 'top' });

  document.getElementById('play-button').disabled = true;
  document.getElementById('stop-button').hidden = false;

  currentPlayer.props.on('status', (val) => {
    console.log('Player Status:', val);

    if (val === 'File Loaded') {
      currentPlayer.start();

      // --> CAMBIO 2: Lógica de fin de canción movida aquí.
      // Buscamos el elemento <audio> que el reproductor acaba de crear.
      const audioElement = document.querySelector('#cdg_wrapper audio');
      if (audioElement) {
        audioElement.addEventListener('ended', () => {
          console.log('Audio playback has ended.');
          resetPlayer();
        });
      }
    }
  });

  currentPlayer.load(zipBuffer);
}

// --- Las funciones loadAndPlayFromUrls y populateSongList se quedan exactamente igual ---
async function loadAndPlayFromUrls(mp3Url, cdgUrl) {
  try {
    const [mp3Response, cdgResponse] = await Promise.all([fetch(mp3Url), fetch(cdgUrl)]);
    if (!mp3Response.ok || !cdgResponse.ok) throw new Error(`Error downloading files`);
    const [mp3Buffer, cdgBuffer] = await Promise.all([mp3Response.arrayBuffer(), cdgResponse.arrayBuffer()]);
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
  const dataListElement = document.getElementById('song-list-options');
  const playButton = document.getElementById('play-button');
  const songInputElement = document.getElementById('song-input');
  try {
    const response = await fetch('/api/songs');
    if (!response.ok) throw new Error('Could not get the song list from the server.');
    const songKeys = await response.json();
    if (songKeys.length === 0) {
      songInputElement.placeholder = 'No se encontraron canciones';
      return;
    }
    dataListElement.innerHTML = '';
    songKeys.forEach(songKey => {
      const option = document.createElement('option');
      option.value = songKey;
      dataListElement.appendChild(option);
    });
    songInputElement.placeholder = "Escribe para buscar tu canción...";
    playButton.disabled = false;
  } catch (error) {
    console.error(error);
    songInputElement.placeholder = 'Error al cargar canciones';
  }
}

// --- Los listeners de los botones se quedan exactamente igual ---

populateSongList();

document.getElementById('play-button').addEventListener('click', async () => {
  const songInput = document.getElementById('song-input');
  const songKey = songInput.value;
  const options = document.querySelectorAll('#song-list-options option');
  const songExists = Array.from(options).some(opt => opt.value === songKey);
  if (!songKey || !songExists) {
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
    alert('Error loading the selected song.');
  }
});

document.getElementById('stop-button').addEventListener('click', () => {
  if (currentPlayer) {
    currentPlayer.stop();
    setTimeout(resetPlayer, 100);
  }
});