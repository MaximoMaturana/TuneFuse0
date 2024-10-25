# TuneFuse


TuneFuse is a music recommendation website that provides users with personalized song recommendations based on their input. The application integrates with the Spotify API and features a sleek design with a starfield background.

## Table of contents

- [Features](https://github.com/MaximoMaturana/TuneFuse0?tab=readme-ov-file#features)
  
- [Technologies Used](https://github.com/MaximoMaturana/TuneFuse0?tab=readme-ov-file#technologies-used)
  
- [Setup and Installation](https://github.com/MaximoMaturana/TuneFuse0?tab=readme-ov-file#setup-and-installation)
  
- [Usage](https://github.com/MaximoMaturana/TuneFuse0?tab=readme-ov-file#usage)


## Features

- **Personalized music recommendations:** Users can input a song of their liking and TuneFuse will give them a personalized recommendation. 

- **Spotify Integration:** The website integrates the Spotify API to fetxh real time recommendations and previes of songs directly from Spotify.

- **Song Previews:** Users can listen to short previews of songs to decide wether they like it or not.

- **Favorite Saving:** Users can save songs they like allowing them to revist them whenever they please.

- **User Authentication:** The website will support Spotify login, allowing users to access personalized data directly from their Spotify account for even more tailored recommendations.

- **Starfield Animation:** A starfield as a background for the website to look visually more appeling for users.

## Technologies Used 

**HTML5:** For the structure and layout of the website.

**CSS3:** For styling and visual desigbn of the web pages.

**JavaScript:** For adding interactivity, handling user input, and making API calls.

**Spotify Web API:** Used for fetching music data such as tracks, artists, and song previews.

**Canvas API:** Used in the starfield animation feature for visual effects on the webpage.

## Setup and Installation

1. Clone the repository: 
```bash
git clone https://github.com/MaximoMaturana/TuneFuse0.git
```
2. Install the required dependecies: 
```bash 
pip install -r requirements.txt
```

3. Set up the Spotify API by following their respective documentation.

4. Create a `.env` file for your Spotify API credentials:
```bash 
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/callback
```
5. Add the `REDIRECT_URI` to your Spotify Developers account. 

6. Run the application:
```bash
cd TuneFuse0\spotify-recommendation-app\
$ python server.py
```
  Or simply run server.py and click on the given link that will show up in the console.

## Usage

- Enter a song or artist name in the search box.
  
- Click the "Search" button to receive song recommendations.
  
- Click on any song to view details and listen to a preview.
  
- Use the user authentication feature to save your favorite songs (once implemented).



