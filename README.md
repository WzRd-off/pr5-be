#Запуск

Ініціалізуйте ноду
```npm init -y```
Встановіть пакети
```npm install i```
Запустіть сервер
```npm start```

#Виконано 4 рівні

#БД
```
-- Таблиця жанрів
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Таблиця фільмів
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER,
    genre_id INTEGER,
    description TEXT,
    rating REAL DEFAULT 0,
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);

-- Таблиця відгуків
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER,
    author TEXT NOT NULL,
    text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- Заполвнення жанрів
INSERT OR IGNORE INTO genres (name) VALUES
('Драма'),
('Комедія'),
('Фантастика'),
('Трилер'),
('Анімація'),
('Документальний');

```
