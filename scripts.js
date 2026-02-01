/* ========================================
   Constantes y configuración
   ======================================== */
const STORAGE_KEYS = {
    BOOKS: 'library_books',
    THEME: 'library_theme',
    FILTER: 'library_filter',
    SEARCH: 'library_search',
    SEARCH_OPTIONS: 'library_search_options'
};

const GENRE_LABELS = {
    'fiction': 'Ficción',
    'non-fiction': 'No ficción',
    'fantasy': 'Fantasía',
    'science-fiction': 'Ciencia ficción',
    'mystery': 'Misterio',
    'biography': 'Biografía',
    'other': 'Otro'
};

/* ========================================
   Estado de la aplicación
   ======================================== */
const appState = {
    books: [],
    currentFilter: 'all',
    theme: 'light',
    searchQuery: '',
    searchOptions: {
        byTitle: true,
        byAuthor: true,
        byGenre: true
    }
};

/* ========================================
   Elementos del DOM
   ======================================== */
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    bookForm: document.getElementById('bookForm'),
    bookTitle: document.getElementById('bookTitle'),
    bookAuthor: document.getElementById('bookAuthor'),
    bookGenre: document.getElementById('bookGenre'),
    booksList: document.getElementById('booksList'),
    emptyState: document.getElementById('emptyState'),
    totalBooks: document.getElementById('totalBooks'),
    readBooks: document.getElementById('readBooks'),
    pendingBooks: document.getElementById('pendingBooks'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchByTitle: document.getElementById('searchByTitle'),
    searchByAuthor: document.getElementById('searchByAuthor'),
    searchByGenre: document.getElementById('searchByGenre')
};

/* ========================================
   Funciones de LocalStorage
   ======================================== */

/**
 * Guarda datos en localStorage
 * @param {string} key - Clave del item
 * @param {*} data - Datos a guardar
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

/**
 * Obtiene datos de localStorage
 * @param {string} key - Clave del item
 * @returns {*} Datos almacenados o null
 */
function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error al leer de localStorage:', error);
        return null;
    }
}

/* ========================================
   Funciones de gestión de libros
   ======================================== */

/**
 * Genera un ID único para un libro
 * @returns {string} ID único
 */
function generateId() {
    return `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea un nuevo objeto libro
 * @param {string} title - Título del libro
 * @param {string} author - Autor del libro
 * @param {string} genre - Género del libro
 * @returns {Object} Objeto libro
 */
function createBook(title, author, genre) {
    return {
        id: generateId(),
        title: title.trim(),
        author: author.trim(),
        genre: genre,
        isRead: false,
        rating: 0,
        comment: '',
        createdAt: new Date().toISOString()
    };
}

/**
 * Agrega un libro a la colección
 * @param {Object} book - Objeto libro
 */
function addBook(book) {
    appState.books.unshift(book);
    saveToStorage(STORAGE_KEYS.BOOKS, appState.books);
    updateUI();
}

/**
 * Elimina un libro de la colección
 * @param {string} bookId - ID del libro a eliminar
 */
function deleteBook(bookId) {
    appState.books = appState.books.filter(book => book.id !== bookId);
    saveToStorage(STORAGE_KEYS.BOOKS, appState.books);
    updateUI();
}

/**
 * Alterna el estado de lectura de un libro
 * @param {string} bookId - ID del libro
 */
function toggleBookRead(bookId) {
    const book = appState.books.find(b => b.id === bookId);
    if (book) {
        book.isRead = !book.isRead;
        saveToStorage(STORAGE_KEYS.BOOKS, appState.books);
        updateUI();
    }
}

/**
 * Actualiza la calificación y comentario de un libro
 * @param {string} bookId - ID del libro
 * @param {number} rating - Calificación (1-5)
 * @param {string} comment - Comentario
 */
function updateBookReview(bookId, rating, comment) {
    const book = appState.books.find(b => b.id === bookId);
    if (book) {
        book.rating = rating;
        book.comment = comment.trim();
        saveToStorage(STORAGE_KEYS.BOOKS, appState.books);
        updateUI();
    }
}

/**
 * Genera las estrellas para mostrar la calificación
 * @param {number} rating - Calificación (0-5)
 * @returns {string} String con estrellas
 */
function generateStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
}

/**
 * Obtiene los libros filtrados según el filtro activo y búsqueda
 * @returns {Array} Array de libros filtrados
 */
function getFilteredBooks() {
    let filtered = appState.books;
    
    // Aplicar filtro por estado (todos/leídos/pendientes)
    switch (appState.currentFilter) {
        case 'read':
            filtered = filtered.filter(book => book.isRead);
            break;
        case 'pending':
            filtered = filtered.filter(book => !book.isRead);
            break;
    }
    
    // Aplicar búsqueda si hay query
    if (appState.searchQuery.trim().length > 0) {
        const query = appState.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(book => {
            const matchTitle = appState.searchOptions.byTitle && 
                              book.title.toLowerCase().includes(query);
            const matchAuthor = appState.searchOptions.byAuthor && 
                               book.author.toLowerCase().includes(query);
            const matchGenre = appState.searchOptions.byGenre && 
                              GENRE_LABELS[book.genre].toLowerCase().includes(query);
            
            return matchTitle || matchAuthor || matchGenre;
        });
    }
    
    return filtered;
}

/* ========================================
   Funciones de renderizado
   ======================================== */

/**
 * Crea el HTML para una tarjeta de libro
 * @param {Object} book - Objeto libro
 * @returns {string} HTML de la tarjeta
 */
function createBookCardHTML(book) {
    const genreLabel = GENRE_LABELS[book.genre] || book.genre;
    const readClass = book.isRead ? 'book-card--read' : '';
    
    // Generar sección de rating y comentario si el libro está leído
    const reviewSection = book.isRead ? `
        ${book.rating > 0 ? `
            <div class="book-card__rating">
                <span class="book-card__stars">${generateStars(book.rating)}</span>
                <span>(${book.rating}/5)</span>
            </div>
        ` : ''}
        ${book.comment ? `
            <div class="book-card__comment">
                "${escapeHTML(book.comment)}"
            </div>
        ` : ''}
    ` : '';
    
    return `
        <article class="book-card ${readClass}" role="listitem" data-book-id="${book.id}">
            <div class="book-card__header">
                <div class="book-card__info">
                    <h3 class="book-card__title">${escapeHTML(book.title)}</h3>
                    <p class="book-card__author">por ${escapeHTML(book.author)}</p>
                    <span class="book-card__genre">${genreLabel}</span>
                    ${reviewSection}
                </div>
            </div>
            <div class="book-card__actions">
                <label class="checkbox-wrapper">
                    <input 
                        type="checkbox" 
                        class="checkbox-input" 
                        ${book.isRead ? 'checked' : ''}
                        data-action="toggle-read"
                        aria-label="Marcar como ${book.isRead ? 'no leído' : 'leído'}">
                    <span class="checkbox-label">${book.isRead ? 'Leído' : 'Marcar como leído'}</span>
                </label>
                ${book.isRead ? `
                    <button 
                        class="btn btn--primary btn--small" 
                        data-action="review"
                        aria-label="Agregar reseña a ${escapeHTML(book.title)}">
                        Reseña
                    </button>
                ` : ''}
                <button 
                    class="btn btn--danger btn--small" 
                    data-action="delete"
                    aria-label="Eliminar ${escapeHTML(book.title)}">
                    Eliminar
                </button>
            </div>
        </article>
    `;
}

/**
 * Renderiza la lista de libros
 */
function renderBooks() {
    const filteredBooks = getFilteredBooks();
    
    if (filteredBooks.length === 0) {
        elements.booksList.innerHTML = '';
        elements.emptyState.classList.add('empty-state--visible');
    } else {
        elements.emptyState.classList.remove('empty-state--visible');
        elements.booksList.innerHTML = filteredBooks
            .map(book => createBookCardHTML(book))
            .join('');
    }
}

/**
 * Actualiza las estadísticas
 */
function updateStats() {
    const total = appState.books.length;
    const read = appState.books.filter(book => book.isRead).length;
    const pending = total - read;
    
    elements.totalBooks.textContent = total;
    elements.readBooks.textContent = read;
    elements.pendingBooks.textContent = pending;
}

/**
 * Actualiza toda la interfaz
 */
function updateUI() {
    renderBooks();
    updateStats();
}

/* ========================================
   Funciones de utilidad
   ======================================== */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str - String a escapar
 * @returns {string} String escapado
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Valida el formulario
 * @returns {boolean} True si es válido
 */
function validateForm() {
    const title = elements.bookTitle.value.trim();
    const author = elements.bookAuthor.value.trim();
    const genre = elements.bookGenre.value;
    
    return title.length > 0 && author.length > 0 && genre.length > 0;
}

/**
 * Limpia el formulario
 */
function resetForm() {
    elements.bookForm.reset();
}

/* ========================================
   Funciones de tema
   ======================================== */

/**
 * Aplica el tema a la página
 * @param {string} theme - 'light' o 'dark'
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    appState.theme = theme;
    saveToStorage(STORAGE_KEYS.THEME, theme);
}

/**
 * Alterna entre tema claro y oscuro
 */
function toggleTheme() {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

/* ========================================
   Funciones de filtrado
   ======================================== */

/**
 * Cambia el filtro activo
 * @param {string} filter - Tipo de filtro ('all', 'read', 'pending')
 */
function setFilter(filter) {
    appState.currentFilter = filter;
    saveToStorage(STORAGE_KEYS.FILTER, filter);
    
    // Actualizar botones de filtro
    elements.filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('filter-btn--active');
        } else {
            btn.classList.remove('filter-btn--active');
        }
    });
    
    updateUI();
}

/* ========================================
   Funciones de búsqueda
   ======================================== */

/**
 * Actualiza la búsqueda
 * @param {string} query - Término de búsqueda
 */
function setSearch(query) {
    appState.searchQuery = query;
    saveToStorage(STORAGE_KEYS.SEARCH, query);
    updateUI();
}

/**
 * Ejecuta la búsqueda
 */
function performSearch() {
    const query = elements.searchInput.value;
    setSearch(query);
}

/**
 * Limpia la búsqueda
 */
function clearSearch() {
    elements.searchInput.value = '';
    setSearch('');
    elements.searchInput.focus();
}

/**
 * Maneja el input de búsqueda (Enter key)
 * @param {Event} e - Evento de keypress
 */
function handleSearchKeyPress(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
}

/**
 * Actualiza las opciones de búsqueda
 */
function updateSearchOptions() {
    appState.searchOptions = {
        byTitle: elements.searchByTitle.checked,
        byAuthor: elements.searchByAuthor.checked,
        byGenre: elements.searchByGenre.checked
    };
    saveToStorage(STORAGE_KEYS.SEARCH_OPTIONS, appState.searchOptions);
    
    // Si hay búsqueda activa, actualizar resultados
    if (appState.searchQuery.trim().length > 0) {
        updateUI();
    }
}

/**
 * Maneja cambios en los checkboxes de búsqueda
 */
function handleSearchOptionChange() {
    updateSearchOptions();
}

/* ========================================
   Funciones de modal de reseña
   ======================================== */

/**
 * Crea y muestra el modal de reseña
 * @param {string} bookId - ID del libro
 */
function showReviewModal(bookId) {
    const book = appState.books.find(b => b.id === bookId);
    if (!book) return;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal modal--active';
    modal.innerHTML = `
        <div class="modal__content">
            <div class="modal__header">
                <h2 class="modal__title">Reseña: ${escapeHTML(book.title)}</h2>
                <button class="modal__close" aria-label="Cerrar modal">&times;</button>
            </div>
            <div class="modal__body">
                <div class="form-group">
                    <label class="form-label">Calificación</label>
                    <div class="rating-input" id="ratingInput">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <button 
                                type="button" 
                                class="star-btn ${star <= book.rating ? 'star-btn--active' : ''}" 
                                data-rating="${star}"
                                aria-label="${star} estrellas">
                                ${star <= book.rating ? '★' : '☆'}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="reviewComment" class="form-label">Comentario</label>
                    <textarea 
                        id="reviewComment" 
                        class="form-textarea" 
                        placeholder="Escribe tus impresiones sobre este libro...">${escapeHTML(book.comment || '')}</textarea>
                </div>
            </div>
            <div class="modal__footer">
                <button class="btn btn--secondary" id="cancelReview">Cancelar</button>
                <button class="btn btn--primary" id="saveReview">Guardar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Variables para el rating
    let selectedRating = book.rating;
    
    // Event listeners del modal
    const ratingButtons = modal.querySelectorAll('.star-btn');
    const commentTextarea = modal.querySelector('#reviewComment');
    const saveBtn = modal.querySelector('#saveReview');
    const cancelBtn = modal.querySelector('#cancelReview');
    const closeBtn = modal.querySelector('.modal__close');
    
    // Manejar clicks en estrellas
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            ratingButtons.forEach((star, index) => {
                if (index < selectedRating) {
                    star.classList.add('star-btn--active');
                    star.textContent = '★';
                } else {
                    star.classList.remove('star-btn--active');
                    star.textContent = '☆';
                }
            });
        });
    });
    
    // Guardar reseña
    saveBtn.addEventListener('click', () => {
        updateBookReview(bookId, selectedRating, commentTextarea.value);
        closeModal(modal);
    });
    
    // Cancelar
    cancelBtn.addEventListener('click', () => closeModal(modal));
    closeBtn.addEventListener('click', () => closeModal(modal));
    
    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

/**
 * Cierra y elimina un modal
 * @param {HTMLElement} modal - Elemento del modal
 */
function closeModal(modal) {
    modal.classList.remove('modal--active');
    setTimeout(() => modal.remove(), 300);
}

/* ========================================
   Event Handlers
   ======================================== */

/**
 * Maneja el envío del formulario
 * @param {Event} e - Evento de submit
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const newBook = createBook(
        elements.bookTitle.value,
        elements.bookAuthor.value,
        elements.bookGenre.value
    );
    
    addBook(newBook);
    resetForm();
    elements.bookTitle.focus();
}

/**
 * Maneja los clics en la lista de libros
 * @param {Event} e - Evento de click
 */
function handleBooksListClick(e) {
    const bookCard = e.target.closest('.book-card');
    if (!bookCard) return;
    
    const bookId = bookCard.dataset.bookId;
    const action = e.target.dataset.action;
    
    if (action === 'delete') {
        deleteBook(bookId);
    } else if (action === 'toggle-read') {
        toggleBookRead(bookId);
    } else if (action === 'review') {
        showReviewModal(bookId);
    }
}

/**
 * Maneja los clics en los botones de filtro
 * @param {Event} e - Evento de click
 */
function handleFilterClick(e) {
    const filterBtn = e.target.closest('.filter-btn');
    if (!filterBtn) return;
    
    const filter = filterBtn.dataset.filter;
    setFilter(filter);
}

/* ========================================
   Inicialización
   ======================================== */

/**
 * Carga el estado inicial desde localStorage
 */
function loadInitialState() {
    // Cargar libros
    const savedBooks = getFromStorage(STORAGE_KEYS.BOOKS);
    if (savedBooks && Array.isArray(savedBooks)) {
        appState.books = savedBooks;
    }
    
    // Cargar tema
    const savedTheme = getFromStorage(STORAGE_KEYS.THEME);
    if (savedTheme) {
        applyTheme(savedTheme);
    }
    
    // Cargar filtro
    const savedFilter = getFromStorage(STORAGE_KEYS.FILTER);
    if (savedFilter) {
        setFilter(savedFilter);
    }
    
    // Cargar búsqueda
    const savedSearch = getFromStorage(STORAGE_KEYS.SEARCH);
    if (savedSearch) {
        appState.searchQuery = savedSearch;
        elements.searchInput.value = savedSearch;
    }
    
    // Cargar opciones de búsqueda
    const savedSearchOptions = getFromStorage(STORAGE_KEYS.SEARCH_OPTIONS);
    if (savedSearchOptions) {
        appState.searchOptions = savedSearchOptions;
        elements.searchByTitle.checked = savedSearchOptions.byTitle;
        elements.searchByAuthor.checked = savedSearchOptions.byAuthor;
        elements.searchByGenre.checked = savedSearchOptions.byGenre;
    }
}

/**
 * Registra todos los event listeners
 */
function registerEventListeners() {
    // Formulario
    elements.bookForm.addEventListener('submit', handleFormSubmit);
    
    // Toggle de tema
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Lista de libros (delegación de eventos)
    elements.booksList.addEventListener('click', handleBooksListClick);
    
    // Botones de filtro
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Búsqueda
    elements.searchBtn.addEventListener('click', performSearch);
    elements.clearSearchBtn.addEventListener('click', clearSearch);
    elements.searchInput.addEventListener('keypress', handleSearchKeyPress);
    
    // Opciones de búsqueda
    elements.searchByTitle.addEventListener('change', handleSearchOptionChange);
    elements.searchByAuthor.addEventListener('change', handleSearchOptionChange);
    elements.searchByGenre.addEventListener('change', handleSearchOptionChange);
}

/**
 * Inicializa la aplicación
 */
function initApp() {
    loadInitialState();
    registerEventListeners();
    updateUI();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
