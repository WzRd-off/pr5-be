const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const moviesRouter = require('./routes/movies')
const reviewsRouter = require('./routes/reviews')

app.use('/api/movies', moviesRouter)
app.use('/api/movies', reviewsRouter)

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server start on http://localhost:${PORT}`)
})