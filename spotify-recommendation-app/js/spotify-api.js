const clientId = 'e823d294425449efa68efc35996a5e5c';
const redirectUri = 'http://localhost:8000'; // Update this to your redirect URI

const spotifyApi = new Spotify.Web.Api();

function login() {
    const scopes = ['user-read-private', 'user-read-email', 'user-top-read'];
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=token`;
    window.location = url;
}

function getHashParams() {
    const hashParams = {};
    const r = /([^&;=]+)=?([^&;]*)/g;
    const q = window.location.hash.substring(1);
    let e;
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}