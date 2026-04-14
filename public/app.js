const API = '/api/movies'

const safeSortOptions = ['title', 'year', 'rating']

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })
    if (!response.ok) {
        const body = await response.text()
        throw new Error(body || response.statusText)
    }
    return response.json()
}

function createOption(value, label) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    return option
}

async function loadGenres(selectElement, includeEmpty = true) {
    const genres = await fetchJson(`${API}/genres`)
    selectElement.innerHTML = ''
    if (includeEmpty) {
        selectElement.appendChild(createOption('', 'Усі жанри'))
    }
    genres.forEach((genre) => {
        selectElement.appendChild(createOption(genre.id, genre.name))
    })
    return genres
}

function showMessage(container, text, type = 'info') {
    container.textContent = text
    container.className = `message ${type}`
}

function renderMovieList(movies, container) {
    container.innerHTML = ''
    if (!movies.length) {
        container.innerHTML = '<p class="empty">Фільми не знайдено.</p>'
        return
    }

    movies.forEach((movie) => {
        const card = document.createElement('article')
        card.className = 'movie-card'
        card.innerHTML = `
            <h3>${movie.title}</h3>
            <p><strong>Рік:</strong> ${movie.year || '—'}</p>
            <p><strong>Жанр:</strong> ${movie.genre_name || '—'}</p>
            <p><strong>Рейтинг:</strong> ${movie.rating?.toFixed(1) || '0.0'}</p>
            <p>${movie.description || ''}</p>
            <div class="movie-actions">
                <button data-action="view" data-id="${movie.id}">Переглянути</button>
                <button data-action="edit" data-id="${movie.id}">Редагувати</button>
                <button data-action="delete" data-id="${movie.id}">Видалити</button>
            </div>
        `
        container.appendChild(card)
    })
}

async function loadMovies() {
    const search = document.getElementById('search').value.trim()
    const genre = document.getElementById('filter-genre').value
    const sort = document.getElementById('sort').value
    const message = document.getElementById('movies-message')
    const list = document.getElementById('movie-list')

    try {
        let query = []
        if (search) query.push(`search=${encodeURIComponent(search)}`)
        if (genre) query.push(`genre=${encodeURIComponent(genre)}`)
        if (sort && safeSortOptions.includes(sort)) query.push(`sort=${encodeURIComponent(sort)}`)
        const url = query.length ? `${API}?${query.join('&')}` : API
        const movies = await fetchJson(url)
        renderMovieList(movies, list)
        showMessage(message, `Знайдено ${movies.length} фільм(ів).`, 'success')
    } catch (error) {
        showMessage(message, 'Не вдалося завантажити фільми.', 'error')
        console.error(error)
    }
}

function fillForm(movie) {
    document.getElementById('movie-id').value = movie.id
    document.getElementById('title').value = movie.title
    document.getElementById('year').value = movie.year || ''
    document.getElementById('genre_id').value = movie.genre_id || ''
    document.getElementById('description').value = movie.description || ''
    document.getElementById('rating').value = movie.rating || ''
    document.getElementById('form-heading').textContent = 'Редагувати фільм'
    document.getElementById('submit-button').textContent = 'Оновити'
    document.getElementById('cancel-edit').classList.remove('hidden')
}

function resetForm() {
    document.getElementById('movie-id').value = ''
    document.getElementById('movie-form').reset()
    document.getElementById('form-heading').textContent = 'Додати фільм'
    document.getElementById('submit-button').textContent = 'Додати'
    document.getElementById('cancel-edit').classList.add('hidden')
}

async function initIndexPage() {
    const genreSelect = document.getElementById('filter-genre')
    const formGenre = document.getElementById('genre_id')
    const form = document.getElementById('movie-form')
    const status = document.getElementById('form-message')
    const list = document.getElementById('movie-list')

    await loadGenres(genreSelect)
    await loadGenres(formGenre, false)

    document.getElementById('search').addEventListener('input', () => loadMovies())
    document.getElementById('filter-genre').addEventListener('change', () => loadMovies())
    document.getElementById('sort').addEventListener('change', () => loadMovies())

    list.addEventListener('click', async (event) => {
        const button = event.target.closest('button')
        if (!button) return
        const id = button.dataset.id
        const action = button.dataset.action
        if (action === 'view') {
            window.location.href = `movie.html?id=${id}`
            return
        }
        if (action === 'edit') {
            try {
                const movie = await fetchJson(`${API}/${id}`)
                fillForm(movie)
            } catch (error) {
                showMessage(status, 'Не вдалося завантажити фільм для редагування.', 'error')
                console.error(error)
            }
            return
        }
        if (action === 'delete') {
            if (!confirm('Ви впевнені, що хочете видалити фільм?')) return
            try {
                await fetchJson(`${API}/${id}`, { method: 'DELETE' })
                showMessage(status, 'Фільм видалено.', 'success')
                loadMovies()
            } catch (error) {
                showMessage(status, 'Не вдалося видалити фільм.', 'error')
                console.error(error)
            }
        }
    })

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const movieId = document.getElementById('movie-id').value
        const payload = {
            title: document.getElementById('title').value.trim(),
            year: parseInt(document.getElementById('year').value, 10) || null,
            genre_id: parseInt(document.getElementById('genre_id').value, 10) || null,
            description: document.getElementById('description').value.trim(),
            rating: parseFloat(document.getElementById('rating').value) || 0,
        }

        try {
            const method = movieId ? 'PUT' : 'POST'
            const url = movieId ? `${API}/${movieId}` : API
            await fetchJson(url, { method, body: JSON.stringify(payload) })
            showMessage(status, movieId ? 'Фільм оновлено.' : 'Фільм додано.', 'success')
            resetForm()
            loadMovies()
        } catch (error) {
            showMessage(status, 'Не вдалося зберегти фільм.', 'error')
            console.error(error)
        }
    })

    document.getElementById('cancel-edit').addEventListener('click', (event) => {
        event.preventDefault()
        resetForm()
    })

    loadMovies()
}

function renderReviews(reviews, container) {
    container.innerHTML = ''
    if (!reviews.length) {
        container.innerHTML = '<p class="empty">Поки що немає відгуків.</p>'
        return
    }
    reviews.forEach((review) => {
        const item = document.createElement('div')
        item.className = 'review-item'
        item.innerHTML = `
            <p><strong>${review.author}</strong> — рейтинг ${review.rating}</p>
            <p>${review.text}</p>
            <small>${new Date(review.created_at).toLocaleString()}</small>
        `
        container.appendChild(item)
    })
}

async function initMoviePage() {
    const id = new URLSearchParams(window.location.search).get('id')
    const movieTitle = document.getElementById('movie-title')
    const movieDetails = document.getElementById('movie-details')
    const reviewList = document.getElementById('review-list')
    const message = document.getElementById('review-message')
    const genreName = document.getElementById('movie-genre')
    const reviewForm = document.getElementById('review-form')

    if (!id) {
        movieTitle.textContent = 'Фільм не знайдено'
        movieDetails.textContent = 'Некоректний запит.'
        return
    }

    async function refresh() {
        try {
            const movie = await fetchJson(`${API}/${id}`)
            movieTitle.textContent = movie.title
            genreName.textContent = movie.genre_name || 'Без жанру'
            movieDetails.innerHTML = `
                <p><strong>Рік:</strong> ${movie.year || '—'}</p>
                <p><strong>Рейтинг:</strong> ${movie.rating?.toFixed(1) || '0.0'}</p>
                <p>${movie.description || 'Опис відсутній.'}</p>
            `
            renderReviews(movie.reviews || [], reviewList)
        } catch (error) {
            movieTitle.textContent = 'Помилка завантаження фільму'
            movieDetails.textContent = 'Спробуйте оновити сторінку.'
            console.error(error)
        }
    }

    reviewForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const payload = {
            author: document.getElementById('review-author').value.trim(),
            text: document.getElementById('review-text').value.trim(),
            rating: parseInt(document.getElementById('review-rating').value, 10),
        }
        try {
            await fetchJson(`${API}/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) })
            showMessage(message, 'Відгук додано.', 'success')
            reviewForm.reset()
            refresh()
        } catch (error) {
            showMessage(message, 'Не вдалося додати відгук.', 'error')
            console.error(error)
        }
    })

    refresh()
}

if (window.location.pathname.endsWith('movie.html')) {
    document.addEventListener('DOMContentLoaded', initMoviePage)
} else {
    document.addEventListener('DOMContentLoaded', initIndexPage)
}


