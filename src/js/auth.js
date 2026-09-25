// REGISTER FORM
const registerForm = document.getElementById("register-form");
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {

        // Stop the form from refreshing the page
        event.preventDefault();

        // Get the values entered by the user
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const terms = document.getElementById("terms").checked;

        // BASIC VALIDATION
        if (name === "") {
            alert("Please enter your name.");
            return;
        }
        if (email === "") {
            alert("Please enter your email.");
            return;
        }
        if (password === "") {
            alert("Please enter your password.");
            return;
        }
        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }
        if (!terms) {
            alert("Please agree to the Terms, Privacy Policy and Fees.");
            return;
        }

        // SAVE USER INFORMATION
        const user = {
            name: name,
            email: email,
            password: password
        };

        localStorage.setItem("reenBankUser", JSON.stringify(user));

        // MOVE TO OTP VERIFICATION
        window.location.href = "./otp-verification.html";
    });
}
