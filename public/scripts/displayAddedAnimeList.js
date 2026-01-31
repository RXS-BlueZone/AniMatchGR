document.addEventListener("DOMContentLoaded", async () => {
    const animeListContainer = document.querySelector(".anime-list-container");

    try {
        // get anime list from the backend (database connection)
        const response = await fetch("/api/anime-list");
        const { animeList } = await response.json();

        if (!response.ok || !animeList) {
            console.error("Failed to fetch anime list:", response.statusText);
            animeListContainer.innerHTML = `<p>Error fetching your anime list.</p>`;
            return;
        }

        // group anime by status
        const groupedAnime = groupByStatus(animeList);

        // show anime sections
        for (const status in groupedAnime) {
            const section = document.getElementById(`${status.toLowerCase()}-categ`);
            section.innerHTML = `<h2>${capitalize(status)}</h2>`;

            for (const anime of groupedAnime[status]) {
                // get anime details from AniList API
                const animeDetails = await fetchAnimeDetails(anime.anime_id);

                if (animeDetails) {
                    const animeItem = `
                        <div class="anime-list-table">
                            <div class="anime-list-row" data-anime-id="${anime.anime_id}">
                            <div class="anime-item-left">
                                <div class="anime-img">
                                    <img src="${animeDetails.coverImage.extraLarge}" alt="${animeDetails.title.romaji}">
                                </div>
                                <div class="anime-title">${animeDetails.title.romaji}</div>
                            </div>
                            <div class="anime-item-right">
                                <div>
                                    <button type="button" class="edit-anime-btn">
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <div class="edit-anime-status" style="display: none;">
                                        ${['Watching', 'Rewatching', 'Completed', 'Paused', 'Dropped', 'Planning']
                                            .map(
                                                (s) => `
                                                <button type="button" class="status-btn" data-status="${s}">
                                                    ${s} <span><i class="fa-solid fa-check"></i></span>
                                                </button>
                                            `
                                            )
                                            .join('')}
                                    </div>
                                </div>
                                <div>
                                    <button type="button" class="remove-anime-btn">
                                        <i class="fa-solid fa-trash-xmark"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    `;

                    section.innerHTML += animeItem;
                } else {
                    console.warn(`Failed to fetch details for Anime ID: ${anime.anime_id}`);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching and displaying anime list:", error);
        animeListContainer.innerHTML = `<p>Error loading your anime list. Please try again later.</p>`;
    }
});

// group anime by status
function groupByStatus(animeList) {
    return animeList.reduce((acc, anime) => {
        if (!acc[anime.status]) acc[anime.status] = [];
        acc[anime.status].push(anime);
        return acc;
    }, {});
}

// get details from AniList API
async function fetchAnimeDetails(animeID) {
    const query = `
        query ($id: Int) {
            Media(id: $id) {
                id
                title {
                    romaji
                }
                coverImage {
                    extraLarge
                }
            }
        }
    `;

    try {
        const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables: { id: animeID },
            }),
        });

        const result = await response.json();

        if (response.ok && result.data.Media) {
            return result.data.Media;
        } else {
            console.error("Error fetching anime details:", result.errors || response.statusText);
            return null;
        }
    } catch (error) {
        console.error("Error fetching anime details from AniList:", error);
        return null;
    }
}

// Capitalize the first letter of a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}







document.addEventListener('click', async (event) => {
    if (event.target.closest('.status-btn')) {
        const statusBtn = event.target.closest('.status-btn');
        const animeRow = statusBtn.closest('.anime-list-row');
        const animeId = animeRow.dataset.animeId;
        const newStatus = statusBtn.dataset.status;

        try {
            const response = await fetch('/api/update-anime-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ animeId, status: newStatus }),
            });

            const result = await response.json();

            if (response.ok) {
                // Move the anime to the appropriate section
                const currentSection = animeRow.closest('.anime-list-item');
                const newSection = document.getElementById(`${newStatus.toLowerCase()}-categ`);

                currentSection.removeChild(animeRow);
                newSection.appendChild(animeRow);

                // Hide the dropdown
                animeRow.querySelector('.edit-anime-status').style.display = 'none';
            } else {
                console.error('Failed to update anime status:', result.error);
                alert('Failed to update anime status.');
            }
        } catch (error) {
            console.error('Error updating anime status:', error);
        }
    }
});











document.addEventListener('click', (event) => {
    if (event.target.closest('.edit-anime-btn')) {
        const editBtn = event.target.closest('.edit-anime-btn');
        const dropdown = editBtn.nextElementSibling;

        const isVisible = dropdown.style.display === 'flex';
        document.querySelectorAll('.edit-anime-status').forEach((el) => (el.style.display = 'none')); // Close all dropdowns

        if (!isVisible) {
            dropdown.style.display = 'flex'; // Open the clicked dropdown
        }
    }
});