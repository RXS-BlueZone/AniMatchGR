const animeListBtn = document.getElementById("anime-list-btn");
const favoritesBtn = document.getElementById("favorites-btn");
const reviewsBtn = document.getElementById("reviews-btn");

const animeListContainer = document.querySelector(".anime-list-container");
const favoritesWrapper = document.querySelector(".favorites-wrapper");
const reviewsContainer = document.querySelector(".reviews-container");

animeListBtn.addEventListener("click", () => {
  animeListBtn.classList.add("active-section");
  favoritesBtn.classList.remove("active-section");
  reviewsBtn.classList.remove("active-section");

  animeListContainer.style.display = "flex";
  favoritesWrapper.style.display = "none";
  reviewsContainer.style.display = "none";
});

favoritesBtn.addEventListener("click", () => {
  animeListBtn.classList.remove("active-section");
  favoritesBtn.classList.add("active-section");
  reviewsBtn.classList.remove("active-section");

  animeListContainer.style.display = "none";
  favoritesWrapper.style.display = "flex";
  reviewsContainer.style.display = "none";
});

reviewsBtn.addEventListener("click", () => {
  animeListBtn.classList.remove("active-section");
  favoritesBtn.classList.remove("active-section");
  reviewsBtn.classList.add("active-section");

  animeListContainer.style.display = "none";
  favoritesWrapper.style.display = "none";
  reviewsContainer.style.display = "flex";
});

const categoryBtns = document.querySelectorAll(".category-btn");
const animeListItems = document.querySelectorAll(".anime-list-item");

categoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryBtns.forEach((btn) => {
      btn.classList.remove("active-category");
    });
    btn.classList.add("active-category");

    animeListItems.forEach((item) => {
      item.style.display = "none";
    });

    const category = btn.textContent.toLowerCase();
    const categoryItem = document.getElementById(`${category}-categ`);
    categoryItem.style.display = "block";
  });
});

const statusBtns = document.querySelectorAll(".status-btn");
const editAnimeStatus = document.querySelectorAll(".edit-anime-status");

statusBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    statusBtns.forEach((btn) => {
      btn.classList.remove("active-status");
      btn.querySelector("span").style.display = "none";
    });
    btn.classList.add("active-status");
    btn.querySelector("span").style.display = "inline";
  });
});

const editAnimeBtns = document.querySelectorAll(".edit-anime-btn");
const removeAnimeBtns = document.querySelectorAll(".remove-anime-btn");

let activeEditBtn = null;
editAnimeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const editAnimeStatus = btn.nextElementSibling;
    if (activeEditBtn && activeEditBtn !== btn) {
      activeEditBtn.nextElementSibling.style.display = "none";
      activeEditBtn.classList.remove("active-edit");
    }
    if (editAnimeStatus.style.display === "flex") {
      editAnimeStatus.style.display = "none";
      activeEditBtn = null;
      btn.classList.remove("active-edit");
    } else {
      editAnimeStatus.style.display = "flex";
      activeEditBtn = btn;
      activeEditBtn.classList.add("active-edit");
    }
  });
});


removeAnimeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const animeItem = btn.parentElement.parentElement.parentElement;
    animeItem.style.display = "none";
  });
});

const removeItemBtns = document.querySelectorAll(".remove-item");

removeItemBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    const favoriteItem = this.closest(".favorite-item");
    favoriteItem.classList.add("removed");

    setTimeout(() => {
      favoriteItem.remove();
    }, 800);
  });
});

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logout-btn');

    try {
        // get session status from the server
        const response = await fetch('/api/session');
        const sessionData = await response.json();

        if (sessionData.loggedIn) {
            // User is logged in
            logoutBtn.textContent = 'Logout';

            logoutBtn.addEventListener('click', async () => {
                // Log out the user
                const logoutResponse = await fetch('/logout', { method: 'GET' });
                if (logoutResponse.ok) {
                    window.location.href = '/login'; // redirect to login page after logout
                } else {
                    alert('Failed to logout. Please try again.');
                }
            });
        } else {
            // User is not logged in
            logoutBtn.textContent = 'Login';

            logoutBtn.addEventListener('click', () => {
                window.location.href = '/login'; // Redirect to login page
            });
        }
    } catch (error) {
        console.error('Error checking session status:', error);
        logoutBtn.textContent = 'Login'; 
        logoutBtn.addEventListener('click', () => {
            window.location.href = '/login'; 
        });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // fetch session data from the backend
        const response = await fetch('/api/session');
        const sessionData = await response.json();

        if (response.ok && sessionData.username) {
            // update the username in the profile section
            const usernameElement = document.querySelector('.profile-wrapper h2');
            document.title = `${sessionData.username}'s profile - AniMatch`;
            usernameElement.textContent = sessionData.username;
        } else {
            console.error('Failed to fetch session data:', sessionData.error);
        }
    } catch (error) {
        console.error('Error fetching session data:', error);
    }
});