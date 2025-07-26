# Movie Recommendation / Movies Browser

A modern, responsive web app to browse, search, and get recommendations for movies using [The Movie Database (TMDb) API](https://www.themoviedb.org/documentation/api). Features include advanced filtering, favorites, watchlist, dark/light mode, and a simple authentication demo.

## Features

- Browse popular movies with details and posters
- Search movies with instant suggestions
- Filter by genre, rating, year, language, and sort order
- Mark favorites and add movies to your watchlist (per user)
- View detailed info with trailers, cast, reviews, and recommendations
- Actor details and their known movies
- Responsive design and dark/light theme toggle
- Demo login/register (user data stored in browser for simplicity)

## File Structure

| File           | Description                                                                                 |
|----------------|--------------------------------------------------------------------------------------------|
| `index.html`   | Main app page. Shows header, search/filter bar, movie grid, modals for movie/actor details.|
| `login.html`   | Login form for demo authentication. Stores user data in browser localStorage.              |
| `register.html`| Registration form. Adds new users to localStorage; validates inputs and uniqueness.        |
| `script.js`    | Main app logic: API calls, UI interactions, modals, filtering, auth, favorites/watchlist.  |
| `style.css`    | Styles for layout, responsiveness, themes, components, and animations.                     |

---

## File Explanations

### `index.html`
- The entry point of the app.
- Contains header with search, filter bar, movie cards grid (`main`), pagination, and modals for details.
- Buttons for favorites, watchlist, theme toggle, and authentication actions.

### `login.html`
- Standalone login page.
- Accepts username/email and password.
- Validates against users in `localStorage`.
- On success, stores logged-in status and redirects to the app.

### `register.html`
- Standalone registration page.
- Accepts username, email, password (with confirmation).
- Checks for duplicates and password strength.
- On success, adds user and logs them in.

### `script.js`
- Handles all interactivity:
    - Fetches movies and genres from TMDb API.
    - Search suggestion dropdown, movie grid rendering, filters.
    - Modals for movie and actor details, with API calls for each.
    - Favorites and watchlist logic per user.
    - Dark/light theme toggle and persistence.
    - Demo authentication logic (with localStorage).
    - Pagination, scroll-to-top, responsive/mobile behaviors.

### `style.css`
- Overall layout and visual design.
- Styles for header, search/filter bar, movie cards, modals, and buttons.
- Animations (card entrance, button bounce, spinner, gradient title).
- Responsive adjustments for mobile.
- Theme support (dark & light modes).

---

## Setup & Usage

1. Clone or download this repository.
2. Open `index.html` in your browser.
3. Register a user and log in to access favorites and watchlist features.
4. Use filters and search to find movies; click cards for details.
5. All data is demo-stored in your browser (localStorage).

**Note:** You need a valid TMDb API key (the one in the code may have usage limits).

DataBase
[The Movie Database (TMDb)](https://www.themoviedb.org/)
