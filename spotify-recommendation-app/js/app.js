document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const mySongsButton = document.getElementById('my-songs-button');
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const recommendationsElement = document.getElementById('recommendations');
    const searchDropdown = document.getElementById('search-dropdown');
    const mySongsSection = document.getElementById('my-songs');
    const savedSongsList = document.getElementById('saved-songs-list');
    let debounceTimer;

    // Initialize Spotify Web API wrapper
    const spotifyApi = new SpotifyWebApi();
    let selectedTrackId = null;
    let currentAudio = null;
    let currentPlayingButton = null;

    let isAuthenticated = false;

    function checkAuthentication() {
        isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        updateUIBasedOnAuth();
    }

    function updateUIBasedOnAuth() {
        if (isAuthenticated) {
            loginButton.textContent = 'Log Out';
            mySongsButton.classList.remove('hidden');
        } else {
            loginButton.textContent = 'Log In';
            mySongsButton.classList.add('hidden');
        }
    }

    loginButton.addEventListener('click', () => {
        if (isAuthenticated) {
            // Log out
            isAuthenticated = false;
            localStorage.setItem('isAuthenticated', 'false');
            updateUIBasedOnAuth();
            alert('Logged out successfully.');
        } else {
            // Log in
            simulateSignIn();
        }
    });

    function simulateSignIn() {
        setTimeout(() => {
            isAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            updateUIBasedOnAuth();
            alert('Logged in successfully! You now have access to personalized recommendations and can save songs.');
        }, 1000);
    }

    // Check authentication status when the app loads
    checkAuthentication();

    // Set up search functionality
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchTracks(query);
        }
    });

    function searchTracks(query, isDropdown = false) {
        if (!query) return;

        fetchAccessToken()
            .then(() => performSearch(query, isDropdown))
            .catch(err => {
                console.error('Error fetching access token:', err);
                searchResults.innerHTML = '<p>Error authenticating with Spotify. Please try again later.</p>';
            });
    }

    function performSearch(query, isDropdown) {
        spotifyApi.searchTracks(query, { limit: 5 })
            .then(data => {
                console.log('Search results:', data);
                const tracks = data.tracks.items;
                if (isDropdown) {
                    displayDropdownResults(tracks);
                } else {
                    displaySearchResults(tracks);
                }
            })
            .catch(err => {
                console.error('Error searching tracks:', err);
                if (!isDropdown) {
                    searchResults.innerHTML = '<p>Error searching tracks. Please try again.</p>';
                }
            });
    }

    // Fetch access token from server
    function fetchAccessToken() {
        console.log('Fetching access token...');
        return fetch('/get-token')
            .then(response => {
                console.log('Token response:', response);
                return response.json();
            })
            .then(data => {
                console.log('Token data:', data);
                if (data.access_token) {
                    console.log('Access token received:', data.access_token);
                    accessToken = data.access_token;
                    spotifyApi.setAccessToken(accessToken);
                } else {
                    console.error('No access token in response');
                    throw new Error('No access token received');
                }
            })
            .catch(error => {
                console.error('Error fetching token:', error);
                throw error;
            });
    }

    function displayDropdownResults(tracks) {
        const dropdownHtml = tracks.map(track => 
            `<div class="search-dropdown-item" data-track-id="${track.id}">
                ${track.name} by ${track.artists[0].name}
            </div>`
        ).join('');

        searchDropdown.innerHTML = dropdownHtml;
        searchDropdown.style.display = tracks.length > 0 ? 'block' : 'none';

        searchDropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                searchInput.value = item.textContent.trim();
                searchDropdown.style.display = 'none';
                getRecommendations(item.dataset.trackId);
            });
        });
    }

    function displaySearchResults(tracks) {
        const resultsHtml = tracks.map(track => 
            `<div class="search-result" data-track-id="${track.id}">
                <p>${track.name} by ${track.artists[0].name}</p>
            </div>`
        ).join('');
        searchResults.innerHTML = '<h2>Search Results:</h2>' + resultsHtml;

        searchResults.querySelectorAll('.search-result').forEach(div => {
            div.addEventListener('click', () => {
                selectedTrackId = div.dataset.trackId;
                searchResults.querySelectorAll('.search-result').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                getRecommendations(selectedTrackId);
            });
        });
    }

    /**
     * Get and display recommendations based on selected track
     * @param {string} trackId - The ID of the selected track
     */
    async function getRecommendations(trackId) {
        if (!trackId) {
            console.error('No track ID provided for recommendations');
            recommendationsElement.innerHTML = '<p>Error: No track selected for recommendations.</p>';
            return;
        }

        try {
            if (!accessToken) {
                console.log('No access token, fetching one...');
                await fetchAccessToken();
            }

            console.log('Fetching track info for:', trackId);
            const trackInfo = await spotifyApi.getTrack(trackId);
            console.log('Track info received:', trackInfo);

            console.log('Fetching audio features for:', trackId);
            const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(trackId);
            console.log('Audio features received:', audioFeatures);

            console.log('Fetching artist info for:', trackInfo.artists[0].id);
            const artistInfo = await spotifyApi.getArtist(trackInfo.artists[0].id);
            console.log('Artist info received:', artistInfo);

            const seedGenres = artistInfo.genres.slice(0, 2);
            console.log('Seed genres:', seedGenres);

            let recommendationsParams = {
                seed_tracks: [trackId],
                limit: 20
            };

            if (isAuthenticated) {
                console.log('User is authenticated, adding personalized parameters');
                recommendationsParams = {
                    ...recommendationsParams,
                    target_popularity: 70,
                    min_popularity: 20,
                    target_energy: audioFeatures.energy,
                    target_danceability: audioFeatures.danceability,
                    min_instrumentalness: 0.1,
                    max_instrumentalness: 0.9
                };
            }

            console.log('Fetching recommendations with params:', recommendationsParams);
            const recommendations = await spotifyApi.getRecommendations({
                seed_tracks: [trackId],
                limit: 20 // Ensure we don't exceed 20 items
            });
            console.log('Recommendations received:', recommendations);

            const diverseRecommendations = filterForDiversity(recommendations.tracks);
            console.log('Diverse recommendations:', diverseRecommendations);

            if (diverseRecommendations.length === 0) {
                recommendationsElement.innerHTML = '<p>No recommendations found. Try a different track.</p>';
                return;
            }

            // Generate HTML for recommendations
            const recommendationsHtml = diverseRecommendations.map(track => 
                `<div class="recommendation">
                    <img src="${track.album.images[0].url}" alt="${track.album.name}" class="album-artwork">
                    <div class="track-info">
                        <span class="track-name">${track.name}</span>
                        <span class="artist-name">${track.artists[0].name}</span>
                        ${track.explicit ? '<span class="explicit-badge">E</span>' : ''}
                    </div>
                    <div class="track-actions">
                        ${track.preview_url ? `<button class="play-button" data-preview-url="${track.preview_url}"><i class="fas fa-play"></i></button>` : '<span class="no-preview">No preview</span>'}
                        <button class="add-to-my-songs" data-track='${JSON.stringify(track)}'><i class="fas fa-plus"></i></button>
                        <button class="hide-track" data-track-id="${track.id}"><i class="fas fa-minus-circle"></i></button>
                        <a href="${track.external_urls.spotify}" target="_blank" class="spotify-play-button">
                            <i class="fab fa-spotify"></i> Play on Spotify
                        </a>
                    </div>
                 </div>`
            ).join('');
            recommendationsElement.innerHTML = '<h2>TuneFuse Recommendations:</h2>' + recommendationsHtml;

            // Add click event listeners to play buttons, add-to-my-songs buttons, and hide-track buttons
            document.querySelectorAll('.play-button').forEach(button => {
                button.addEventListener('click', () => togglePlayPause(button, button.dataset.previewUrl));
            });

            document.querySelectorAll('.add-to-my-songs').forEach(button => {
                button.addEventListener('click', () => addToMySongs(JSON.parse(button.dataset.track)));
            });

            document.querySelectorAll('.hide-track').forEach(button => {
                button.addEventListener('click', () => hideTrack(button.dataset.trackId));
            });
        } catch (err) {
            console.error('Error getting recommendations:', err);
            if (err.status === 401) {
                console.log('Token expired, fetching new token...');
                try {
                    await fetchAccessToken();
                    console.log('New token fetched, retrying recommendations...');
                    await getRecommendations(trackId);
                } catch (tokenErr) {
                    console.error('Error fetching new token:', tokenErr);
                    recommendationsElement.innerHTML = '<p>Error authenticating with Spotify. Please try again later.</p>';
                }
            } else {
                recommendationsElement.innerHTML = `<p>Error getting recommendations: ${err.message}. Please try again.</p>`;
            }
        }
    }

    /**
     * Filter recommendations for diversity
     * @param {Array} tracks - Array of track objects
     * @param {number} maxPerArtist - Maximum number of tracks per artist
     * @returns {Array} Filtered array of tracks
     */
    function filterForDiversity(tracks, maxPerArtist = 2) {
        const artistCounts = {};
        return tracks.filter(track => {
            if (hiddenTracks.includes(track.id)) {
                return false;
            }
            const artistId = track.artists[0].id;
            artistCounts[artistId] = (artistCounts[artistId] || 0) + 1;
            return artistCounts[artistId] <= maxPerArtist;
        });
    }

    /**
     * Play audio preview of a track
     * @param {HTMLElement} button - The button element
     * @param {string} previewUrl - URL of the audio preview
     */
    function togglePlayPause(button, previewUrl) {
        if (currentAudio && currentPlayingButton) {
            currentAudio.pause();
            currentPlayingButton.innerHTML = '<i class="fas fa-play"></i>';
            currentPlayingButton.classList.remove('playing');
        }

        if (currentPlayingButton !== button) {
            currentAudio = new Audio(previewUrl);
            currentAudio.play();
            button.innerHTML = '<i class="fas fa-pause"></i>';
            button.classList.add('playing');
            currentPlayingButton = button;

            currentAudio.onended = () => {
                button.innerHTML = '<i class="fas fa-play"></i>';
                button.classList.remove('playing');
                currentPlayingButton = null;
            };
        } else {
            currentPlayingButton = null;
        }
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length > 1) {
                searchTracks(query, true);
            } else {
                searchDropdown.style.display = 'none';
            }
        }, 300);
    });

    searchInput.addEventListener('focus', () => {
        if (searchDropdown.children.length > 0) {
            searchDropdown.style.display = 'block';
        }
    });

    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !searchDropdown.contains(event.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    // Fetch the token when the app loads
    fetchAccessToken().catch(err => {
        console.error('Initial token fetch failed:', err);
        alert('Failed to connect to Spotify. Please try refreshing the page.');
    });

    let mySongs = JSON.parse(localStorage.getItem('mySongs')) || [];

    mySongsButton.addEventListener('click', toggleMySongs);

    function toggleMySongs() {
        mySongsSection.classList.toggle('hidden');
        recommendationsElement.classList.toggle('hidden');
        if (!mySongsSection.classList.contains('hidden')) {
            displayMySongs();
        }
    }

    function displayMySongs() {
        if (mySongs.length === 0) {
            savedSongsList.innerHTML = '<li>No songs saved yet.</li>';
        } else {
            savedSongsList.innerHTML = mySongs.map(song => 
                `<li>
                    ${song.name} by ${song.artists[0].name}
                    <button class="play-button" data-preview-url="${song.preview_url}"><i class="fas fa-play"></i></button>
                    <button class="remove-song" data-song-id="${song.id}">Remove</button>
                </li>`
            ).join('');

            savedSongsList.querySelectorAll('.play-button').forEach(button => {
                button.addEventListener('click', () => togglePlayPause(button, button.dataset.previewUrl));
            });

            savedSongsList.querySelectorAll('.remove-song').forEach(button => {
                button.addEventListener('click', () => removeSong(button.dataset.songId));
            });
        }
    }

    function addToMySongs(track) {
        if (!mySongs.some(song => song.id === track.id)) {
            mySongs.push(track);
            localStorage.setItem('mySongs', JSON.stringify(mySongs));
            alert('Added to Liked Songs');
        } else {
            mySongs = mySongs.filter(song => song.id !== track.id);
            localStorage.setItem('mySongs', JSON.stringify(mySongs));
            alert('Removed from Liked Songs');
        }
        updateLikeButton(track.id);
    }

    function updateLikeButton(trackId) {
        const likeButton = document.querySelector(`.add-to-my-songs[data-track-id="${trackId}"]`);
        if (likeButton) {
            likeButton.innerHTML = mySongs.some(song => song.id === trackId) ? 
                '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>';
        }
    }

    function removeSong(songId) {
        mySongs = mySongs.filter(song => song.id !== songId);
        localStorage.setItem('mySongs', JSON.stringify(mySongs));
        displayMySongs();
    }

    let hiddenTracks = JSON.parse(localStorage.getItem('hiddenTracks')) || [];

    function hideTrack(trackId) {
        if (!hiddenTracks.includes(trackId)) {
            hiddenTracks.push(trackId);
            localStorage.setItem('hiddenTracks', JSON.stringify(hiddenTracks));
            alert('Track hidden from future recommendations.');
            // Remove the track from the current recommendations display
            const trackElement = document.querySelector(`.recommendation button[data-track-id="${trackId}"]`).closest('.recommendation');
            if (trackElement) {
                trackElement.remove();
            }
        } else {
            alert('This track is already hidden.');
        }
    }

    function displayHiddenTracks() {
        const hiddenTracksElement = document.getElementById('hidden-tracks');
        if (hiddenTracks.length === 0) {
            hiddenTracksElement.innerHTML = '<p>No hidden tracks.</p>';
        } else {
            const hiddenTracksHtml = hiddenTracks.map(trackId => 
                `<li>
                    ${trackId}
                    <button class="unhide-track" data-track-id="${trackId}">Unhide</button>
                </li>`
            ).join('');
            hiddenTracksElement.innerHTML = `<ul>${hiddenTracksHtml}</ul>`;

            hiddenTracksElement.querySelectorAll('.unhide-track').forEach(button => {
                button.addEventListener('click', () => unhideTrack(button.dataset.trackId));
            });
        }
    }

    function unhideTrack(trackId) {
        hiddenTracks = hiddenTracks.filter(id => id !== trackId);
        localStorage.setItem('hiddenTracks', JSON.stringify(hiddenTracks));
        displayHiddenTracks();
        alert('Track unhidden. It will appear in future recommendations.');
    }

    document.getElementById('view-hidden-tracks').addEventListener('click', displayHiddenTracks);
});