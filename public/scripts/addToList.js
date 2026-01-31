// function to get anime ID from URL
function getAnimeIDFromURL() {
    // to get anime ID from URL
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

document.addEventListener("DOMContentLoaded", async () => {
    const animeID = getAnimeIDFromURL(); // get the anime ID from the URL
    if (!animeID) {
        console.error("Anime ID is missing!");
        return;
    }

    const listBtn = document.getElementById("list-btn");
    const statusDropdown = document.querySelector(".edit-anime-status");

    try {
        // get the current status of the anime from the backend
        const response = await fetch(`/api/anime-status?id=${animeID}`);
        const result = await response.json();

        if (response.ok) {
            const status = result.status;

            // update button text display basedon status fetched from the database
            if (status) {
                listBtn.textContent = status; // set to current
            } else {
                listBtn.textContent = "Add To List"; // default
            }
        } else {
            console.error("Failed to fetch anime status:", result.error);
            listBtn.textContent = "Add To List"; // default on error
        }
    } catch (error) {
        console.error("Error fetching anime status:", error);
        listBtn.textContent = "Add To List"; 
    }

    //event listener for updating status
    const statusBtns = document.querySelectorAll(".status-btn");
    statusBtns.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const selectedStatus = btn.textContent.trim();

            try {
                // update the anime's status in the database
                const response = await fetch("/api/update-list", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ animeId: animeID, status: selectedStatus }),
                });

                const result = await response.json();
                if (response.ok) {
                    listBtn.textContent = selectedStatus; // update button text after selection
                    alert("Anime status updated successfully!");
                } else {
                    console.error("Failed to update anime status:", result.error);
                    alert(result.error || "Failed to update anime status.");
                }
            } catch (err) {
                console.error("Error updating anime status:", err);
                alert("An error occurred. Please try again later.");
            }
        });
    });
});


