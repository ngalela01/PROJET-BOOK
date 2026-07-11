const API_BASE_URL = "http://127.0.0.1:3001";

let data = null;
let dataSource = "json";

const state = {
  filter: "all",
  query: "",
  sort: "title",
  selectedBookId: null
};

const colors = ["#2f8fcb", "#bd6a32", "#4b557f", "#7b3f61", "#28735f", "#a9453f", "#6f5b3e"];

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function bookColor(book) {
  const index = Number(book.id.replace(/\D/g, "")) % colors.length;
  return colors[index];
}

function normalizeText(value) {
  return String(value || "");
}

function statusLabel(status) {
  return {
    available: "Disponible",
    borrowed: "Emprunte",
    reserved: "Reserve"
  }[status] || status;
}

function openAddModal() {
  const modal = qs("#add-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  qs("#add-book-form input[name='title']").focus();
}

function closeAddModal() {
  const modal = qs("#add-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function nextBookId() {
  const maxId = data.books.reduce((max, book) => {
    const idNumber = Number(book.id.replace(/\D/g, ""));
    return Number.isFinite(idNumber) ? Math.max(max, idNumber) : max;
  }, 0);

  return `book_${String(maxId + 1).padStart(3, "0")}`;
}

function userName(userId) {
  const user = data.users.find((item) => item.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : "Utilisateur inconnu";
}

function statusCount(status) {
  return data.books.filter((book) => book.status === status).length;
}

function bookViews(bookId) {
  return data.redis?.bookViews?.find((item) => item.bookId === bookId)?.views || 0;
}

function redisPopularity(bookId) {
  const scores = data.redis?.popularScores || [];
  const index = scores.findIndex((item) => item.bookId === bookId);
  if (index === -1) {
    return "Non classe";
  }

  return `#${index + 1} (${scores[index].score})`;
}

function bookRating(bookId) {
  const reviews = (data.reviews || []).filter((review) => review.bookId === bookId);
  if (reviews.length === 0) return "Aucune note";
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return `${average.toFixed(1)}/5`;
}

function filteredBooks() {
  const books = data.books.filter((book) => {
    const matchesFilter = state.filter === "all" || book.status === state.filter;
    const text = `${normalizeText(book.title)} ${normalizeText(book.author)} ${normalizeText(book.category)}`.toLowerCase();
    const matchesQuery = text.includes(state.query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return books.sort((first, second) => {
    if (state.sort === "date") {
      return Number(second.publishedYear || 0) - Number(first.publishedYear || 0);
    }

    return normalizeText(first.title).localeCompare(normalizeText(second.title), "fr");
  });
}

function bookButton(book, isSelected) {
  return `
    <button
      class="book ${isSelected ? "selected" : ""}"
      type="button"
      data-book-id="${book.id}"
      style="background: linear-gradient(135deg, ${bookColor(book)}, #1e2533);"
      aria-label="Afficher ${book.title}"
    >
      <strong>${book.title}</strong>
      <span>${book.author}</span>
    </button>
  `;
}

function renderBookcase() {
  const books = filteredBooks();
  const shelfSize = 5;
  const shelfCount = Math.max(5, Math.ceil(books.length / shelfSize));

  qs("#book-count").textContent = books.length;
  qs("#available-count").textContent = statusCount("available");
  qs("#borrowed-count").textContent = statusCount("borrowed");
  qs("#reserved-count").textContent = statusCount("reserved");
  qs("#data-source").textContent = dataSource === "api"
    ? "Donnees chargees depuis le backend connecte aux bases."
    : "Donnees chargees depuis seeds/common/data.json.";

  if (!books.some((book) => book.id === state.selectedBookId)) {
    state.selectedBookId = books[0]?.id;
  }

  qs("#bookcase").innerHTML = Array.from({ length: shelfCount }, (_, shelfIndex) => {
    const shelfBooks = books.slice(shelfIndex * shelfSize, shelfIndex * shelfSize + shelfSize);
    const emptySlots = Array.from({ length: Math.max(0, shelfSize - shelfBooks.length) }, () => {
      return `<span class="book empty"></span>`;
    }).join("");

    return `
      <div class="shelf">
        ${shelfBooks.map((book) => bookButton(book, book.id === state.selectedBookId)).join("")}
        ${emptySlots}
      </div>
    `;
  }).join("");

    renderDetails();
}

function renderDetails() {
  const book = data.books.find((item) => item.id === state.selectedBookId);
  const content = qs("#details-content");

  if (!book) {
    content.innerHTML = `
      <h2>Aucun livre</h2>
      <p>Aucun resultat ne correspond a la recherche actuelle.</p>
    `;
    return;
  }

  const activeLoan = (data.loans || []).find((loan) => loan.bookId === book.id && loan.status !== "returned");
  const reservation = (data.reservations || []).find((item) => item.bookId === book.id && item.status === "waiting");
  const reviews = (data.reviews || []).filter((review) => review.bookId === book.id);
  const similar = (data.similarBooks || [])
    .filter((item) => item.fromBookId === book.id)
    .map((item) => data.books.find((candidate) => candidate.id === item.toBookId)?.title)
    .filter(Boolean);

  content.innerHTML = `
    <div class="book detail-cover" style="background: linear-gradient(135deg, ${bookColor(book)}, #1e2533);">
      <strong>${book.title}</strong>
      <span>${book.author}</span>
    </div>
    <span class="badge ${book.status}">${statusLabel(book.status)}</span>
    <h2>${book.title}</h2>
    <p>${book.author} - ${book.publishedYear}</p>

    <div class="meta-list">
      <div class="meta-row"><span>Categorie</span><strong>${book.category}</strong></div>
      <div class="meta-row"><span>Vues Redis</span><strong>${bookViews(book.id)}</strong></div>
      <div class="meta-row"><span>Popularite Redis</span><strong>${redisPopularity(book.id)}</strong></div>
      <div class="meta-row"><span>Note Mongo</span><strong>${bookRating(book.id)}</strong></div>
      <div class="meta-row"><span>Emprunt</span><strong>${activeLoan ? userName(activeLoan.userId) : "Aucun"}</strong></div>
      <div class="meta-row"><span>Reservation</span><strong>${reservation ? userName(reservation.userId) : "Aucune"}</strong></div>
      <div class="meta-row"><span>Suggestion Neo4j</span><strong>${similar.join(", ") || "Aucune"}</strong></div>
    </div>

    <div class="reviews">
      <h3>Avis MongoDB</h3>
      ${
        reviews.length > 0
          ? reviews
              .map(
                (review) => `
                  <article class="review">
                    <strong>${review.rating}/5 - ${userName(review.userId)}</strong>
                    <p>${review.comment}</p>
                  </article>
                `
              )
              .join("")
          : `<p>Aucun avis pour ce livre.</p>`
      }
    </div>
  `;
}

function renderInsights() {
  const activeLoans = (data.loans || []).filter((loan) => loan.status !== "returned").length;
  const waitingReservations = (data.reservations || []).filter((reservation) => reservation.status === "waiting").length;
  const reviewedBooks = new Set((data.reviews || []).map((review) => review.bookId)).size;
  const totalViews = (data.redis?.bookViews || []).reduce((sum, item) => sum + Number(item.views || 0), 0);
  const relations = (data.similarBooks || []).length;

  qs("#sql-stat").textContent = activeLoans + waitingReservations;
  qs("#mongo-stat").textContent = reviewedBooks;
  qs("#redis-stat").textContent = totalViews;
  qs("#neo4j-stat").textContent = relations;
}

function bindEvents() {
  qs("#search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderBookcase();
  });

  qs("#filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.filter = button.dataset.filter;
    qsa(".filter").forEach((item) => item.classList.toggle("active", item === button));
    renderBookcase();
  });

  qs("#sort-controls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-sort]");
    if (!button) return;

    state.sort = button.dataset.sort;
    qsa("[data-sort]").forEach((item) => item.classList.toggle("active", item === button));
    renderBookcase();
  });

  qs("#bookcase").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-id]");
    if (!button) return;

    state.selectedBookId = button.dataset.bookId;
    renderBookcase();
  });

  qs("#open-add-modal").addEventListener("click", () => openAddModal());
  qs("#close-add-modal").addEventListener("click", () => closeAddModal());
  qs("#cancel-add-modal").addEventListener("click", () => closeAddModal());

  qs("#add-modal").addEventListener("click", (event) => {
    if (event.target.id === "add-modal") {
      closeAddModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && qs("#add-modal").classList.contains("open")) {
      closeAddModal();
    }
  });

  qs("#add-book-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const book = {
      id: nextBookId(),
      title: normalizeText(formData.get("title")).trim(),
      author: normalizeText(formData.get("author")).trim(),
      publishedYear: Number(formData.get("publishedYear")) || new Date().getFullYear(),
      category: normalizeText(formData.get("category")).trim(),
      status: normalizeText(formData.get("status")) || "available"
    };

    data.books.push(book);
    state.selectedBookId = book.id;
    state.filter = "all";
    qsa(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all"));
    event.currentTarget.reset();
    closeAddModal();
    renderBookcase();
    renderInsights();
  });
}

function renderLoadError(error) {
  qs("#bookcase").innerHTML = "";
  qs("#details-content").innerHTML = `
    <h2>Donnees introuvables</h2>
    <p>
      Impossible de charger <strong>seeds/common/data.json</strong>.
      Lance la page avec Live Server depuis la racine du projet, ou avec un petit serveur local.
    </p>
    <p>${error.message}</p>
  `;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} sur ${url}`);
  }

  return response.json();
}

function normalizeApiBook(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publishedYear: book.publishedYear,
    category: book.category,
    status: book.status
  };
}

function normalizeApiLoan(loan) {
  return {
    id: loan.id || loan.loanId,
    userId: loan.userId,
    bookId: loan.bookId,
    borrowedAt: loan.borrowedAt,
    dueAt: loan.dueAt,
    returnedAt: null,
    status: loan.status
  };
}

function normalizeApiReservation(reservation) {
  return {
    id: reservation.id || reservation.reservationId,
    userId: reservation.userId,
    bookId: reservation.bookId,
    reservedAt: reservation.reservedAt,
    status: reservation.status
  };
}

async function loadLocalData() {
  const response = await fetch("../seeds/common/data.json");
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  return response.json();
}

function normalizeApiData(apiData) {
  const popularBooks = apiData.redis?.popularScores || [];

  return {
    users: apiData.users || [],
    books: (apiData.books || []).map(normalizeApiBook),
    loans: (apiData.loans || []).map(normalizeApiLoan),
    reservations: (apiData.reservations || []).map(normalizeApiReservation),
    reviews: apiData.reviews || [],
    bookDetails: apiData.bookDetails || [],
    similarBooks: apiData.similarBooks || [],
    redis: {
      popularScores: popularBooks,
      bookViews: apiData.redis?.bookViews || popularBooks.map((item) => ({
        bookId: item.bookId,
        views: item.score
      }))
    }
  };
}

async function loadApiData() {
  const apiData = await fetchJson(`${API_BASE_URL}/api/frontend-data`);
  return normalizeApiData(apiData);
}

async function loadData() {
  try {
    data = await loadApiData();
    dataSource = "api";
  } catch (apiError) {
    data = await loadLocalData();
    dataSource = "json";
  }

  state.selectedBookId = data.books[0]?.id || null;
}

async function init() {
  bindEvents();

  try {
    await loadData();
    renderBookcase();
    renderInsights();
  } catch (error) {
    renderLoadError(error);
  }
}

init();
