const express = require('express')
const router = express.Router()

const db = require('../db/database')

router.post('/:id/reviews', (req, res) => {
    try{
        const movieId = req.params.id
        const review = req.body

        if (!review.author || !review.text || !review.rating || review.rating < 1 || review.rating > 5) {
            return res.status(400).json({ success: false, message: 'Неправильні дані відгуку' })
        }

        const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(movieId);
        if (!movie) return res.status(404).json({ success: false, message: 'Фільм не знайдено' })

        const stmt = db.prepare(`
        INSERT INTO reviews (movie_id, author, text, rating, created_at)
        VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(movieId, review.author, review.text, review.rating, new Date().toISOString());

        const avg = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE movie_id=?').get(movieId).avg;
        db.prepare('UPDATE movies SET rating=? WHERE id=?').run(avg, movieId);

        res.status(201).json({success: true, message: "Коментар додано" })
    }
    catch (error){
        console.error('Помилка при додаванні коментаря:', error)
        res.status(500).json({ success: false, message: 'Помилка сервера' })
    }
})

module.exports = router