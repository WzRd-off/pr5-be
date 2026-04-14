const express = require('express')
const router = express.Router()

const db = require('../db/database')

router.get('/', (req, res) => {
    try {
        const { search, genre, sort, page = 1, limit = 30 } = req.query;
        let query = 'SELECT m.id, m.title, m.year, m.description, m.rating, g.name as genre_name FROM movies as m LEFT JOIN genres as g ON m.genre_id = g.id'
        const params = [];
        let whereClause = '';

        if (search) {
            whereClause += ' WHERE m.title LIKE ?';
            params.push(`%${search}%`);
        }
        if (genre) {
            whereClause += params.length ? ' AND m.genre_id = ?' : ' WHERE m.genre_id = ?';
            params.push(parseInt(genre));
        }
        query += whereClause;

        if (sort) {
            query += ` ORDER BY m.${sort}`;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const movies = db.prepare(query).all(...params);

        let countQuery = 'SELECT COUNT(*) as total FROM movies as m';
        if (whereClause) countQuery += whereClause;
        const total = db.prepare(countQuery).get(...params.slice(0, params.length - 2)).total;

        res.status(200).json({
            movies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Помилка при отриманні фільмів:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})

router.get('/genres', (req, res) => {
    try {
        const genres = db.prepare('SELECT * FROM genres').all();
        res.json(genres);
    } catch (error) {
        console.error('Помилка при отриманні жанрів:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})

router.get('/:id', (req, res) => {
    try {
        const movie = db.prepare('SELECT m.id, m.title, m.year, m.description, m.rating, g.name as genre_name FROM movies as m LEFT JOIN genres as g ON m.genre_id = g.id WHERE m.id = ?').get(req.params.id);
        if (!movie) return res.status(404).json({ error: 'Movie not found' });

        const reviews = db.prepare('SELECT * FROM reviews WHERE movie_id = ?').all(req.params.id);
        movie.reviews = reviews;
        res.json(movie);
    } catch (error) {
        console.error('Помилка при отриманні фільма:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})
router.post('/', (req, res) => {
    try {
        const { title, year, genre_id, description, rating } = req.body;
        const stmt = db.prepare('INSERT INTO movies (title, year, genre_id, description, rating) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(title, year, genre_id, description, rating || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (error) {
        console.error('Помилка при додаванні фільма:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})
router.put('/:id', (req, res) => {
    try {
        const { title, year, genre_id, description, rating } = req.body;
        const stmt = db.prepare('UPDATE movies SET title=?, year=?, genre_id=?, description=?, rating=? WHERE id=?');
        const info = stmt.run(title, year, genre_id, description, rating, req.params.id);
        res.json({ changes: info.changes });
    } catch (error) {
        console.error('Помилка при оновленні фільма:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM reviews WHERE movie_id=?').run(req.params.id);
        const info = db.prepare('DELETE FROM movies WHERE id=?').run(req.params.id);
        res.json({ changes: info.changes });
    } catch (error) {
        console.error('Помилка при видаленні фільма:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
})
module.exports = router