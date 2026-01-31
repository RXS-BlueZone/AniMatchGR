document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------------- ONBOARDING -----------------------------------------------------------------

    const genreList = []; // list for selected genres

    // Onboarding completion check
    function checkOnboardingCompletion() {
        const currentPath = window.location.pathname;

        // skip redirection if the user is already on the onboarding page
        if (currentPath === "/onboarding") {
            fetchGenres(); // get genres to display for user
            updateButtonState(); 

            // Add Cancel button if the user came from recommendations
            if (document.referrer.includes("/recommendations")) {
                addCancelButton();
            }
            return;
        }

        fetch("/api/session") // endpoint to check session and onboarding status
            .then((response) => response.json())
            .then((data) => {
                if (data.loggedIn && data.genresCompleted) {
                    // goto the homepage if onboarding is already complete
                    window.location.href = "/index";
                } else {
                    // if not, allow user to continue with onboarding
                    fetchGenres();
                    updateButtonState();
                }
            })
            .catch((err) => {
                console.error("Error checking onboarding status:", err);
                alert("An error occurred while checking your session. Please try again.");
            });
    }

    // cancel button for users coming from recommendations
    function addCancelButton() {
        const cancelButton = document.createElement("button");
        cancelButton.id = "cancel";
        cancelButton.innerText = "Cancel";
        cancelButton.onclick = function () {
            window.location.href = "/recommendations";
        };

        // join button to the onboarding page
        const buttonContainer = document.getElementById("button-container"); 
        buttonContainer.appendChild(cancelButton);
    }

    // update the button state based on the number of selected genres
    function updateButtonState() {
        const doneButton = document.getElementById("done");
        if (genreList.length < 3) {
            doneButton.classList.add("disabled");
            doneButton.disabled = true;
        } else {
            doneButton.classList.remove("disabled");
            doneButton.disabled = false;
        }
    }

    // getgenres from AniList
    function fetchGenres() {
        $.ajax({
            url: "https://graphql.anilist.co",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                query: `
                    query {
                        GenreCollection
                    }
                `,
            }),
            success: function (result) {
                const genres = result.data.GenreCollection;
                const container = document.getElementById("genre-list");
                container.innerHTML = ""; // clear the genre list container
                genres.forEach((genre) => {
                    const genreCard = document.createElement("div");
                    genreCard.className = "genre-card";
                    genreCard.innerText = genre;

                    // toggle selection on click
                    genreCard.onclick = function () {
                        genreCard.classList.toggle("selected");
                        if (genreList.includes(genre)) {
                            genreList.splice(genreList.indexOf(genre), 1);
                        } else {
                            genreList.push(genre);
                        }
                        updateButtonState();
                    };

                    container.appendChild(genreCard);
                });
            },
            error: function (error) {
                console.error("Error fetching genres:", error);
            },
        });
    }

    // "Done" button click
    document.getElementById("done").onclick = function () {
        if (genreList.length >= 3) {
            // save the selected genres in the backend
            $.ajax({
                url: "/api/save-genres", 
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ genres: genreList }),
                success: function () {
                    // backto recommendations page after successful change
                    const referrer = document.referrer;
                    if (referrer.includes("/recommendations")) {
                        window.location.href = "/recommendations";
                    } else {
                        window.location.href = "/index";
                    }
                },
                error: function (error) {
                    console.error("Error saving genres:", error);
                    alert("Failed to save genres. Please try again.");
                },
            });
        } else {
            alert("Please select at least three genres.");
        }
    };

    checkOnboardingCompletion();
});
