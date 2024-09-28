import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_name='spotify_app.db'):
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.create_tables()

    def create_tables(self):
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            spotify_id TEXT UNIQUE,
            display_name TEXT,
            email TEXT,
            last_login DATETIME
        )
        ''')

        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            track_id TEXT,
            track_name TEXT,
            artist_name TEXT,
            recommended_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')

        self.conn.commit()

    def add_or_update_user(self, spotify_id, display_name, email):
        self.cursor.execute('''
        INSERT OR REPLACE INTO users (spotify_id, display_name, email, last_login)
        VALUES (?, ?, ?, ?)
        ''', (spotify_id, display_name, email, datetime.now()))
        self.conn.commit()

    def add_recommendation(self, user_id, track_id, track_name, artist_name):
        self.cursor.execute('''
        INSERT INTO recommendations (user_id, track_id, track_name, artist_name, recommended_at)
        VALUES (?, ?, ?, ?, ?)
        ''', (user_id, track_id, track_name, artist_name, datetime.now()))
        self.conn.commit()

    def get_user_recommendations(self, user_id, limit=10):
        self.cursor.execute('''
        SELECT track_name, artist_name, recommended_at
        FROM recommendations
        WHERE user_id = ?
        ORDER BY recommended_at DESC
        LIMIT ?
        ''', (user_id, limit))
        return self.cursor.fetchall()

    def close(self):
        self.conn.close()

# Example usage
if __name__ == "__main__":
    db = Database()
    # Add a user
    db.add_or_update_user("spotify_123", "John Doe", "john@example.com")
    # Add a recommendation
    db.add_recommendation(1, "track_456", "Bohemian Rhapsody", "Queen")
    # Get recommendations
    recommendations = db.get_user_recommendations(1)
    print(recommendations)
    db.close()