-- SQLite: Music Collection Database
-- Sample data for a personal music library

CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT,
    genre TEXT,
    formed_year INTEGER,
    bio TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist_id INTEGER NOT NULL,
    release_year INTEGER,
    genre TEXT,
    label TEXT,
    rating REAL CHECK(rating >= 0 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    album_id INTEGER NOT NULL,
    track_number INTEGER,
    duration_seconds INTEGER,
    is_favorite INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);

-- Seed artists
INSERT INTO artists (name, country, genre, formed_year, bio) VALUES
    ('Radiohead', 'UK', 'Alternative Rock', 1985, 'English rock band from Abingdon, Oxfordshire'),
    ('Daft Punk', 'France', 'Electronic', 1993, 'French electronic music duo'),
    ('Tame Impala', 'Australia', 'Psychedelic Rock', 2007, 'Australian psychedelic music project'),
    ('Khruangbin', 'USA', 'Funk', 2010, 'American funk trio from Houston, Texas'),
    ('Bjork', 'Iceland', 'Art Pop', 1986, 'Icelandic singer, songwriter, and actress');

-- Seed albums
INSERT INTO albums (title, artist_id, release_year, genre, label, rating) VALUES
    ('OK Computer', 1, 1997, 'Alternative Rock', 'Parlophone', 4.8),
    ('Kid A', 1, 2000, 'Electronic', 'Parlophone', 4.6),
    ('Discovery', 2, 2001, 'Electronic', 'Virgin', 4.7),
    ('Random Access Memories', 2, 2013, 'Electronic', 'Columbia', 4.5),
    ('Currents', 3, 2015, 'Psychedelic Pop', 'Modular', 4.4),
    ('Lonerism', 3, 2012, 'Psychedelic Rock', 'Modular', 4.5),
    ('Con Todo El Mundo', 4, 2018, 'Funk', 'Dead Oceans', 4.3),
    ('Mordechai', 4, 2020, 'Funk', 'Dead Oceans', 4.1),
    ('Homogenic', 5, 1997, 'Art Pop', 'One Little Indian', 4.6),
    ('Vespertine', 5, 2001, 'Art Pop', 'One Little Indian', 4.5);

-- Seed tracks
INSERT INTO tracks (title, album_id, track_number, duration_seconds, is_favorite, play_count) VALUES
    ('Airbag', 1, 1, 284, 1, 42),
    ('Paranoid Android', 1, 2, 386, 1, 87),
    ('Let Down', 1, 5, 298, 0, 31),
    ('No Surprises', 1, 10, 229, 1, 63),
    ('Everything In Its Right Place', 2, 1, 250, 1, 55),
    ('Kid A', 2, 2, 266, 0, 28),
    ('One More Time', 3, 1, 320, 1, 91),
    ('Digital Love', 3, 3, 301, 1, 68),
    ('Harder Better Faster Stronger', 3, 4, 228, 1, 75),
    ('Get Lucky', 4, 8, 369, 1, 102),
    ('Instant Crush', 4, 5, 337, 0, 44),
    ('Let It Happen', 5, 1, 467, 1, 58),
    ('The Less I Know the Better', 5, 7, 218, 1, 93),
    ('Feels Like We Only Go Backwards', 6, 4, 192, 1, 47),
    ('Maria Tambien', 7, 3, 244, 0, 22),
    ('Time (You and I)', 8, 2, 283, 1, 35),
    ('Joga', 9, 2, 303, 1, 39),
    ('Pagan Poetry', 10, 5, 327, 0, 26);

-- Seed playlists
INSERT INTO playlists (name, description) VALUES
    ('Late Night Vibes', 'Chill tracks for late night listening'),
    ('All-Time Favorites', 'The best of the best');

-- Seed playlist tracks
INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
    (1, 5, 1),
    (1, 8, 2),
    (1, 17, 3),
    (1, 14, 4),
    (2, 2, 1),
    (2, 7, 2),
    (2, 10, 3),
    (2, 12, 4),
    (2, 13, 5);

-- Create a view
CREATE VIEW IF NOT EXISTS album_summary AS
SELECT
    a.title AS album,
    ar.name AS artist,
    a.release_year,
    a.rating,
    COUNT(t.id) AS track_count,
    SUM(t.duration_seconds) AS total_duration_seconds,
    SUM(t.play_count) AS total_plays
FROM albums a
JOIN artists ar ON a.artist_id = ar.id
LEFT JOIN tracks t ON t.album_id = a.id
GROUP BY a.id;
