import { CDGPlayer, CDGControls } from './cdgplayer.js';

let currentPlayer = null;

function loadPlayer(zipBuffer) {
    document.getElementById('cdg_wrapper').innerHTML = '';
    currentPlayer = new CDGPlayer('#cdg_wrapper');
    new CDGControls('#cdg_controls', currentPlayer);

    document.getElementById('play-button').disabled = true;

    currentPlayer.props.on('status', (val) => {
        console.log('Player Status:', val);

        if (val === 'File Loaded') {
            currentPlayer.start();
        }
    });

    currentPlayer.load(zipBuffer);
}

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
        document.getElementById('cdg_wrapper').innerHTML = '<h2>Error loading song</h2>';
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
            songInputElement.placeholder = 'No songs found';
            return;
        }
        dataListElement.innerHTML = '';
        songKeys.forEach(songKey => {
            const option = document.createElement('option');
            option.value = songKey;
            dataListElement.appendChild(option);
        });
        songInputElement.placeholder = "Search your song...";
        playButton.disabled = false;
    } catch (error) {
        console.error(error);
        songInputElement.placeholder = 'Error loading songs';
    }
}

populateSongList();

document.getElementById('play-button').addEventListener('click', async () => {
    const songInput = document.getElementById('song-input');
    const songKey = songInput.value;
    const options = document.querySelectorAll('#song-list-options option');
    const songExists = Array.from(options).some(opt => opt.value === songKey);
    if (!songKey || !songExists) {
        alert('Please, select a valid song from the list.');
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