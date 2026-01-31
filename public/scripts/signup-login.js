// signup-login.js
document.addEventListener("DOMContentLoaded", () => {


// ---------------------------------------------------------------- SIGNUP -----------------------------------------------------------------


const animeImage = document.getElementById('anime-img');

const imageSources = ['styles/assets/k1.png', 'styles/assets/k2.png']; 

let currentImageIndex = 0;

animeImage.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % imageSources.length;

    animeImage.src = imageSources[currentImageIndex];
});

// Sign uP Error Message
    let result; // Declare result in the global scope
  
    // Reusable form submission function
    async function handleFormSubmit(event, form) {
      event.preventDefault(); // Prevent the default form submission
  
      // Get form data
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
  
      console.log("Form data:", payload); // Debugging: Log form data
  
      // Send the data via AJAX (fetch API)
      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        result = await response.json(); // Assign result to the global variable
        console.log("Server response:", result); // Debugging: Log server response
  
        if (response.ok) {
          if (result.redirect) {
            window.location.href = result.redirect; // Redirect on success
          }
        } else {
          // Display specific error messages under the corresponding fields
          displayErrors(result.errors);
        }
      } catch (err) {
        console.error("Error during form submission:", err);
        alert("An unexpected error occurred. Please try again later.");
      }
    }
  
    // Attach event listener to the signup form
    const signupForm = document.getElementById("signupForm");
    signupForm.addEventListener("submit", (event) => handleFormSubmit(event, signupForm));
  
    // Function to display errors
    function displayErrors(errors) {
      // Clear previous error messages
      document.querySelectorAll(".error-message").forEach((el) => {
        el.textContent = "";
        el.style.display = "none";
      });
  
      errors.forEach((error) => {
        const errorElement = document.getElementById(`${error.field}Error`);
        if (errorElement) {
          errorElement.textContent = error.error;
          errorElement.style.display = "inline";
        }
      });
    }






// ---------------------------------------------------------------- LOGIN -----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent the default form submission

        // Get form data
        const user_email = document.getElementById("user_email").value;
        const user_password = document.getElementById("user_password").value;

        const formData = { user_email, user_password };

        // Send login data via AJAX (fetch API)
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // If login is successful, redirect to /index
                window.location.href = "/index";
            } else {
                // Handle login errors
                const errorText = await response.text();
                alert(errorText); // Display the error message
            }
        } catch (error) {
            console.error("Error:", error);
            alert("There was an error logging in.");
        }
    });
});


    document.addEventListener("DOMContentLoaded", () => {
        fetch("/api/session")
            .then((response) => response.json())
            .then((data) => {
                if (data.loggedIn) {
                    // Redirect to the homepage if already logged in
                    window.location.href = "/index";
                }
            })
            .catch((err) => console.error("Session check failed:", err));
    });




});


//------------------------------------------------------ERRORS----------------------------------------------------

// Login Error Message
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(loginForm.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            if (result.redirect) {
                window.location.href = result.redirect; // Redirect if needed
            }
        } else {
            errorMessage.textContent = result.error;
            errorMessage.style.display = 'block';
        }
    } catch (err) {
        errorMessage.textContent = 'An unexpected error occurred.';
        errorMessage.style.display = 'block';
    }
});




