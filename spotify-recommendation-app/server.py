from flask import Flask, send_from_directory, session, redirect, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # This loads the variables from .env file

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)  # This enables CORS for all routes

app.secret_key = os.urandom(24)  # Set a secret key for sessions

SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

REDIRECT_URI = 'http://localhost:5000/callback'

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login():
    auth_url = f'https://accounts.spotify.com/authorize?client_id={SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope=user-read-private user-read-email user-top-read'
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(token_url, data=payload)
    token_info = response.json()
    session['access_token'] = token_info['access_token']
    return redirect('/app')

@app.route('/app')
def spotify_app():
    if 'access_token' not in session:
        return redirect('/login')
    return send_from_directory('.', 'app.html')

@app.route('/get-token')
def get_token():
    auth_url = 'https://accounts.spotify.com/api/token'
    auth_response = requests.post(auth_url, {
        'grant_type': 'client_credentials',
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET,
    })
    
    if auth_response.status_code == 200:
        auth_data = auth_response.json()
        return jsonify({'access_token': auth_data['access_token']})
    else:
        return jsonify({'error': 'Failed to obtain access token'}), 500

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True)