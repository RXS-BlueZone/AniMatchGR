const API_URL = "https://graphql.anilist.co";
let currentPage = 1;
let isFetching = false;
let sortType = null;
let filters = {
  genre: null,
  year: null,
  season: null,
  format: null,
  status: null,
};

// cahcing
const cache = {};

async function fetchWithCache(query, variables) {
  const cacheKey = JSON.stringify({ query, variables });

  if (cache[cacheKey]) {
    console.log("Returning cached data for:", cacheKey);
    return cache[cacheKey];
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Network response was not ok (${response.status}): ${errorText}`
      );
    }
    const data = await response.json();
    cache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// ** DOM Elements **
const sortDropdown = document.getElementById("sort-dropdown");
const sortedResultsSection = document.getElementById("sorted-results");
const searchBar = document.getElementById("search-bar");
const sortedGrid = document.getElementById("sorted-grid");
const trendingGrid = document.getElementById("trending-grid");
const popularSeasonGrid = document.getElementById("popular-season-grid");
const upcomingSeasonGrid = document.getElementById("upcoming-season-grid");
const allTimePopularGrid = document.getElementById("all-time-popular-grid");
const top10Grid = document.getElementById("top-10-grid");

// ** hide sort dropdown (default) **
const hideSortDropdown = () => (sortDropdown.hidden = true);
// ** show sort dropdown (when triggered) **
const showSortDropdown = () => (sortDropdown.hidden = false);

// ** get genres and populate dropdown **
const fetchGenres = async () => {
  const query = `query {GenreCollection}`;
  try {
    const data = await fetchWithCache(query, {});
    populateDropdown("genre-filter", data.data.GenreCollection, "Genres");
  } catch (error) {
    console.error("Error fetching genres:", error);
    // Handle error appropriately (e.g., display a message to the user)
  }
};

// ** for populating years **
const fetchYears = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 1960;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => currentYear - i
  );
  populateDropdown("year-filter", years, "Year");
};

// ** function to populaye dropdowns **
function populateDropdown(dropdownId, items, defaultOption) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = `<option value="">${defaultOption}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    dropdown.appendChild(option);
  });
}

// ** fetch default sections **
const fetchTrendingAnime = async () =>
  await fetchAnime("trending-grid", { sort: ["TRENDING_DESC"] }, 5);
const fetchPopularThisSeason = async () =>
  await fetchAnime(
    "popular-season-grid",
    { sort: ["POPULARITY_DESC"], season: "FALL", seasonYear: 2024 },
    5
  );
const fetchUpcomingNextSeason = async () =>
  await fetchAnime(
    "upcoming-season-grid",
    { sort: ["POPULARITY_DESC"], season: "WINTER", seasonYear: 2025 },
    5
  );
const fetchAllTimePopular = async () =>
  await fetchAnime("all-time-popular-grid", { sort: ["POPULARITY_DESC"] }, 5);
const fetchTop10 = async () =>
  await fetchAnime("top-10-grid", { sort: ["SCORE_DESC"] }, 10, true);

// ** fetch anime (overall) **
async function fetchAnime(gridId, params, perPage, isTop10 = false) {
  const { sort, season, seasonYear, genre, format, status } = params;
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $genre: String, $format: MediaFormat, $status: MediaStatus) {
      Page(page: $page, perPage: $perPage) {
        media(sort: $sort, season: $season, seasonYear: $seasonYear, genre: $genre, type: ANIME, format: $format, status: $status) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          genres
          averageScore
          popularity
          format
          episodes
          season
          seasonYear
          status
        }
      }
    }
  `;

  const variables = {
    page: currentPage,
    perPage,
    sort,
    season: season || undefined,
    seasonYear: seasonYear || undefined,
    genre: genre || undefined,
    format: format || undefined,
    status: status || undefined,
  };

  try {
    const data = await fetchWithCache(query, variables);
    const animeList = data.data.Page.media;
    if (isTop10) {
      renderTop10(animeList, top10Grid);
    } else {
      renderAnime(animeList, gridId);
    }
  } catch (error) {
    console.error("Error fetching anime:", error);
    // display an error message to the user
  }
}

// ** Rendering Functions **
const renderAnime = (animeList, gridId) => {
  const grid = document.getElementById(gridId);
  grid.innerHTML = ""; // clear existing content
  animeList.forEach((anime) => {
    const animeCard = createAnimeCard(anime);
    grid.appendChild(animeCard);
  });
};

const createAnimeCard = (anime) => {
  const animeCard = document.createElement("div");
  animeCard.className = "anime-card";
  const coverImage =
    anime.coverImage?.large || "https://via.placeholder.com/150";
  const title = anime.title?.english || anime.title?.romaji || anime.title?.native || "No Title Available";
  animeCard.innerHTML = `
      <a href="/anime-details?id=${anime.id}" class="anime-link" style="text-decoration: none; color: #161616;">
        <img src="${coverImage}" alt="${title}">
        <h3>${title}</h3>
      </a>
    `;
  return animeCard;
};

const renderTop10 = (animeList, grid) => {
  grid.innerHTML = "";
  animeList.forEach((anime, index) => {
    const card = document.createElement("div");
    card.className = "top-10-card";
    const genresHTML = anime.genres
      .map((genre) => `<span>${genre.toLowerCase()}</span>`)
      .join("");
    card.innerHTML = `
      <img src="${anime.coverImage.large}" alt="${anime.title.english || anime.title.romaji || anime.title.native || 'image'}">
      <div class="top-10-content">
        <h3>#${index + 1} ${anime.title.english || anime.title.romaji || anime.title.native || 'No Title Available'}</h3>
        <div class="tags">${genresHTML}</div>
      </div>
      <div class="top-10-stats">
        <div class="score">⭐ ${anime.averageScore}%</div>
        <div class="info">
          ${anime.format} • ${anime.episodes || "?"} episodes<br>
          ${anime.season || ""} ${anime.seasonYear || ""} • ${
      anime.status || "Unknown"
    }
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
};

// ** event listeners for filters and sorts **
document.getElementById("genre-filter").addEventListener("change", (event) => {
  filters.genre = event.target.value || null;
  updateFiltersAndFetch();
});
document.getElementById("year-filter").addEventListener("change", (event) => {
  filters.year = parseInt(event.target.value) || null;
  updateFiltersAndFetch();
});
document.getElementById("season-filter").addEventListener("change", (event) => {
  filters.season = event.target.value || null;
  updateFiltersAndFetch();
});
document.getElementById("format-filter").addEventListener("change", (event) => {
  filters.format = event.target.value || null;
  updateFiltersAndFetch();
});

document.getElementById("status-filter").addEventListener("change", (event) => {
  filters.status = event.target.value || null;
  updateFiltersAndFetch();
});

// event listener for sort options
document.querySelectorAll(".sort-menu a").forEach((option) => {
  option.addEventListener("click", async (event) => {
    event.preventDefault();
    const sortType = event.target.dataset.sort;
    if (sortType === "DEFAULT") {
      resetToDefault();
      hideClearFiltersButton();
    } else {
      await updateViewAllResults(sortType, filters.season, filters.year);
      showClearFiltersButton();
    }
  });
});

// ** search event listener **
searchBar.addEventListener("input", async (event) => {
  const searchQuery = event.target.value.trim();
  if (searchQuery) {
    showSortDropdown();
    showClearFiltersButton();
    await fetchSearchResults(searchQuery);
  } else {
    clearFilters();
  }
});

// ** fetch search results using filters and sort **
const fetchSearchResults = async (searchQuery) => {
  const query = `
    query ($search: String, $page: Int, $sort: [MediaSort], $genre: String, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus) {
      Page(page: $page) {
        media(search: $search, type: ANIME, sort: $sort, genre: $genre, season: $season, seasonYear: $seasonYear, format: $format, status: $status) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          genres
          averageScore
          popularity
          format
          episodes
          season
          seasonYear
          status
        }
      }
    }
  `;

  const variables = {
    search: searchQuery,
    page: 1,
    sort: sortType ? [sortType] : ["TRENDING_DESC"],
    genre: filters.genre || undefined,
    season: filters.season || undefined,
    seasonYear: filters.year || undefined,
    format: filters.format || undefined,
    status: filters.status || undefined,
  };

  showClearFiltersButton();

  try {
    const data = await fetchWithCache(query, variables);
    if (data.errors) {
      console.error("API Errors:", data.errors);
      sortedGrid.innerHTML = `<p>Error fetching search results. Please try again.</p>`;
      return;
    }
    const animeList = data.data.Page.media;
    if (!animeList || animeList.length === 0) {
      sortedGrid.innerHTML = `<p>No results found for the current search and filters.</p>`;
      return;
    }
    renderSearchResults(animeList);
  } catch (error) {
    console.error("Fetch Error:", error);
    sortedGrid.innerHTML = `<p>Error fetching search results. Please try again.</p>`;
  }
};

// ** display search results with updated filters and sort **
const renderSearchResults = (animeList) => {
  sortedGrid.innerHTML = "";
  sortedResultsSection.style.display = "block";
  hideAllDefaultSections();
  animeList.forEach((anime) => {
    const animeCard = createAnimeCard(anime);
    sortedGrid.appendChild(animeCard);
  });
};

// ** to hide all default sections **
const hideAllDefaultSections = () => {
  document.getElementById("trending-section").style.display = "none";
  document.getElementById("popular-season-section").style.display = "none";
  document.getElementById("upcoming-season-section").style.display = "none";
  document.getElementById("all-time-popular-section").style.display = "none";
  document.getElementById("top-10-section").style.display = "none";
};

// ** reset to default sections **
const resetToDefault = () => {
  filters = {
    genre: null,
    year: null,
    season: null,
    format: null,
    status: null,
  };
  sortType = null;
  sortedResultsSection.style.display = "none";
  hideSortDropdown();
  showDefaultSections();
};

// ** show sections as default page**
const showDefaultSections = async () => {
  document.getElementById("trending-section").style.display = "block";
  document.getElementById("popular-season-section").style.display = "block";
  document.getElementById("upcoming-season-section").style.display = "block";
  document.getElementById("all-time-popular-section").style.display = "block";
  document.getElementById("top-10-section").style.display = "block";
  await fetchTrendingAnime();
  await fetchPopularThisSeason();
  await fetchUpcomingNextSeason();
  await fetchAllTimePopular();
  await fetchTop10();
};

// ** update filters and fetch anime **
const updateFiltersAndFetch = async () => {
  const searchQuery = searchBar.value.trim();
  if (searchQuery) {
    await fetchSearchResults(searchQuery);
  } else {
    await fetchAnime("sorted-grid", { ...filters, sort: [sortType] }, 10);
  }
};

// ** Initializate page content **
document.addEventListener("DOMContentLoaded", async () => {
  hideSortDropdown();
  await fetchGenres();
  fetchYears();
  await showDefaultSections();
});

// event listeners to view all
document.querySelectorAll(".view-all").forEach((viewAllLink) => {
  viewAllLink.addEventListener("click", async (event) => {
    event.preventDefault();
    const sortType = viewAllLink.getAttribute("data-sort");
    const season = viewAllLink.getAttribute("data-season") || null;
    const seasonYear = parseInt(viewAllLink.getAttribute("data-year")) || null;
    await updateViewAllResults(sortType, season, seasonYear);
    showSortDropdown();
  });
});

const updateViewAllResults = async (
  sortType,
  season = null,
  seasonYear = null
) => {
  filters = {
    genre: null,
    year: null,
    season: null,
    format: null,
    status: null,
  };
  if (season) filters.season = season;
  if (seasonYear) filters.year = seasonYear;
  sortedResultsSection.style.display = "block";
  hideAllDefaultSections();
  await fetchAnime("sorted-grid", { ...filters, sort: [sortType] }, 20);
  showSortDropdown();
  showClearFiltersButton();
};

// show the clear filter
const showClearFiltersButton = () =>
  (document.getElementById("clear-filters-btn").hidden = false);
// hide the clear filter
const hideClearFiltersButton = () =>
  (document.getElementById("clear-filters-btn").hidden = true);

// clear filters function
const clearFilters = () => {
  filters = {
    genre: null,
    year: null,
    season: null,
    format: null,
    status: null,
  };
  sortType = null;
  searchBar.value = "";
  hideSortDropdown();
  resetToDefault();
  hideClearFiltersButton();
};

document
  .getElementById("clear-filters-btn")
  .addEventListener("click", clearFilters);

// event listener for sorting 
document.querySelectorAll(".sort-menu a").forEach((option) => {
  option.addEventListener("click", async (event) => {
    event.preventDefault();
    const sortType = event.target.dataset.sort;
    if (sortType === "DEFAULT") {
      resetToDefault();
      hideClearFiltersButton();
    } else {
      await updateViewAllResults(sortType, filters.season, filters.year);
      showClearFiltersButton();
    }
  });
});