let isValidReview = false;
let isValidSummary = false;

document.addEventListener("DOMContentLoaded", () => {
  const review = document.getElementById("review");
  const summary = document.getElementById("summary");
  const reviewMirror = document.getElementById("review-mirror");
  const scoreElement = document.getElementById("score");
  const submitButton = document.getElementById("submit-review");
  const reviewNotif = document.getElementById("review-notif");
  const summaryNotif = document.getElementById("summary-notif");

  // Initial validation checks (important!)
  checkReviewLength();
  checkSummaryLength();
  showSaveButton();

  review.addEventListener("input", () => {
    checkReviewLength();
    showSaveButton();
    try {
      const sanitizedReview = DOMPurify.sanitize(review.value);
      reviewMirror.textContent = sanitizedReview;
      reviewMirror.style.height = reviewMirror.scrollHeight + "px";
      autoGrow(review);
      restoreHeight(review);
    } catch (error) {
      console.error("Error sanitizing review:", error);
      alert(
        "An error occurred sanitizing your review. Please check your input and try again."
      );
    }
  });

  summary.addEventListener("input", () => {
    autoGrow(summary);
    checkSummaryLength();
    showSaveButton();
  });

  scoreElement.addEventListener("blur", () => {
    const score = parseInt(scoreElement.value);
    scoreElement.value = Math.max(0, Math.min(100, isNaN(score) ? 50 : score));
  });

  submitButton.addEventListener("click", validateAndSubmit);

  review.addEventListener("cut", () => {
    try {
      const sanitizedReview = DOMPurify.sanitize(review.value);
      reviewMirror.textContent = sanitizedReview;
      reviewMirror.style.height = reviewMirror.scrollHeight + "px";
      autoGrow(review);
      restoreHeight(review);
    } catch (error) {
      console.error("Error sanitizing review:", error);
      alert(
        "An error occurred sanitizing your review. Please check your input and try again."
      );
    }

    checkSummaryLength();
    showSaveButton();
  });

  review.addEventListener("change", () => {
    try {
      const sanitizedReview = DOMPurify.sanitize(review.value);
      reviewMirror.textContent = sanitizedReview;
      reviewMirror.style.height = reviewMirror.scrollHeight + "px";
      autoGrow(review);
    } catch (error) {
      console.error("Error sanitizing review:", error);
      alert(
        "An error occurred sanitizing your review. Please check your input and try again."
      );
    }

    checkSummaryLength();
    showSaveButton();
  });

  summary.addEventListener("cut", () => {
    autoGrow(summary);
    checkSummaryLength();
    showSaveButton();
  });

  summary.addEventListener("change", () => {
    autoGrow(summary);
    checkSummaryLength();
    showSaveButton();
  });
});

function autoGrow(element) {
  element.style.height = element.scrollHeight + "px";
}

function restoreHeight(element) {
  if (element.value === "") {
    element.style.height = "auto";
    restoreHeightMirror();
  }
}

function restoreHeightMirror() {
  const reviewMirror = document.getElementById("review-mirror");
  reviewMirror.style.height = "auto";
}

function checkReviewLength() {
  isValidReview = review.value.length >= 2200;
}

function checkSummaryLength() {
  const summaryLength = summary.value.length;
  isValidSummary = summaryLength >= 20 && summaryLength <= 120;
}

function validateAndSubmit() {
  if (!isValidReview) {
    alert("Review must be greater than 2200 characters.");
    review.focus();
    return;
  }
  if (!isValidSummary) {
    alert("Summary must be between 20 and 120 characters.");
    summary.focus();
    return;
  }
  const score = parseInt(document.getElementById("score").value);
  if (isNaN(score) || score < 0 || score > 100) {
    alert("Please enter a valid score between 0 and 100.");
    document.getElementById("score").focus();
    return;
  }
}

function showSaveButton() {
  const saveButton = document.getElementById("submit-review");
  const reviewNotif = document.getElementById("review-notif");
  const summaryNotif = document.getElementById("summary-notif");

  saveButton.style.display = isValidReview && isValidSummary ? "block" : "none";
  reviewNotif.style.display = !isValidReview ? "flex" : "none";
  summaryNotif.style.display = !isValidSummary ? "flex" : "none";
}

function addScore(value) {
  const score = document.getElementById("score");
  score.value = Math.max(0, Math.min(100, parseInt(score.value) + value));
}

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logout-btn');

    try {
        // Fetch session status from the server
        const response = await fetch('/api/session');
        const sessionData = await response.json();

        if (sessionData.loggedIn) {
            // User is logged in
            logoutBtn.textContent = 'Logout';

            logoutBtn.addEventListener('click', async () => {
                // Log out the user
                const logoutResponse = await fetch('/logout', { method: 'GET' });
                if (logoutResponse.ok) {
                    window.location.href = '/login'; // Redirect to login page after logout
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
        logoutBtn.textContent = 'Login'; // Default to "Login" on error
        logoutBtn.addEventListener('click', () => {
            window.location.href = '/login'; // Redirect to login page
        });
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    const authBtn = document.getElementById('auth-btn');
    const submitButton = document.getElementById('submit-review');

    // Check session status
    try {
        const response = await fetch('/api/session');
        const sessionData = await response.json();

        if (sessionData.loggedIn) {
            // authBtn.textContent = 'Logout from AniList';
            authBtn.addEventListener('click', async () => {
                await fetch('/logout', { method: 'GET' });
                window.location.href = '/auth/anilist';
            });
        } else {
            // authBtn.textContent = 'Login with AniList';
            authBtn.addEventListener('click', () => {
                window.location.href = '/auth/anilist';
            });
        }
    } catch (error) {
        console.error('Error checking session status:', error);
        authBtn.textContent = 'Login with AniList';
        authBtn.addEventListener('click', () => {
            window.location.href = '/auth/anilist';
        });
    }

    // Submit review
    submitButton.addEventListener('click', async () => {
        const review = document.getElementById('review').value.trim();
        const summary = document.getElementById('summary').value.trim();
        const score = parseInt(document.getElementById('score').value);

        // Validation
        if (review.length < 2200) {
            alert('Review must be at least 2200 characters.');
            return;
        }
        if (summary.length < 20 || summary.length > 120) {
            alert('Summary must be between 20 and 120 characters.');
            return;
        }
        if (isNaN(score) || score < 0 || score > 100) {
            alert('Score must be between 0 and 100.');
            return;
        }

        // Submit to server
        try {
            const response = await fetch('/api/add-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review, summary, score }),
            });

            if (response.ok) {
                const result = await response.json();
                alert('Review submitted successfully!');
                console.log('Review details:', result);
            } else {
                const error = await response.json();
                alert(`Failed to submit review: ${error.error}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('An error occurred while submitting the review.');
        }
    });
});
