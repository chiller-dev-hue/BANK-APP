// REGISTER FORM
const registerForm = document.getElementById("register-form");

if (registerForm) {

    // PREFILL EMAIL FROM FOOTER
    const savedEmail =
        localStorage.getItem("reenBankPrefillEmail");

    if (savedEmail) {
        document.getElementById("email").value = savedEmail;

        // Remove it after using it
        localStorage.removeItem("reenBankPrefillEmail");
    }

    // REGISTER SUBMIT
    registerForm.addEventListener("submit", function (event) {

        // Stop the page from refreshing
        event.preventDefault();

        // Get values
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
            alert(
                "Please agree to the Terms, Privacy Policy and Fees."
            );
            return;
        }

        // GENERATE 6-DIGIT OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Development only
        console.log("Development OTP:", otp);

        // SAVE USER INFORMATION
        const user = { name: name, email: email, password: password};

        localStorage.setItem("reenBankUser", JSON.stringify(user));

        // SAVE OTP
        localStorage.setItem("reenBankOTP", otp.toString());

        // MOVE TO OTP PAGE
        window.location.href = "./otp-verification.html";
    });
}


// OTP VERIFICATION
const otpForm = document.getElementById("otp-form");
if (otpForm) {

    // GET OTP ELEMENTS
    const otpInputs = document.querySelectorAll(".otp-input");
    const otpTimer = document.getElementById("otp-timer");
    const resendButton = document.getElementById("resend-code");
    const verifyButton = document.getElementById("verify-otp");
    const otpMessage = document.getElementById("otp-message");
    const maskedEmail = document.getElementById("masked-email");
    const changeEmail = document.getElementById("change-email");

    // GET SAVED USER
    const savedUser = JSON.parse(localStorage.getItem("reenBankUser"));

    // MASK EMAIL
    function maskEmail(email) {
        if (!email || !email.includes("@")) {
            return "";
        }

        const parts = email.split("@");
        const username = parts[0];
        const domain = parts[1];

        // Very short username
        if (username.length <= 2) {
            return username[0] + "***@" + domain;
        }

        // Keep first and last character
        const firstCharacter = username[0];
        const lastCharacter = username[username.length - 1];
        const stars = "*".repeat(Math.max(3, username.length - 2));

        return (firstCharacter + stars + lastCharacter + "@" + domain);
    }

    // DISPLAY MASKED EMAIL
    if (savedUser && savedUser.email) {
        maskedEmail.textContent = maskEmail(savedUser.email);
    }

    // CHANGE EMAIL
    changeEmail.addEventListener("click", function () {

        // Take the user back to registration
        window.location.href = "./register.html";
    });

    // OTP INPUT FUNCTIONALITY
    otpInputs.forEach(function (input, index) {

        // Only allow numbers
        input.addEventListener("input", function () {
            input.value = input.value.replace(/\D/g, "");

            // Move to next box
            if (
                input.value &&
                index < otpInputs.length - 1
            ) {
                otpInputs[index + 1].focus();
            }
        });

        // Backspace
        input.addEventListener("keydown", function (event) {
            if (
                event.key === "Backspace" &&
                input.value === "" &&
                index > 0
            ) {
                otpInputs[index - 1].focus();
            }
        });

        // Prevent non-number keys
        input.addEventListener("keypress", function (event) {
            if (!/[0-9]/.test(event.key)) {
                event.preventDefault();
            }
        });
    });

    // PASTE OTP
    otpInputs[0].addEventListener("paste",
         function (event) {

            event.preventDefault();

            const pastedOTP = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

            pastedOTP.split("").forEach(
                function (digit, index) {

                    if (otpInputs[index]) {
                        otpInputs[index].value = digit;
                    }
                }
            );

            // Focus last filled box
            const nextIndex = Math.min(pastedOTP.length, otpInputs.length - 1);
            otpInputs[nextIndex].focus();
        }
    );

    // SHOW MESSAGE
    function showMessage(message, type) {

        otpMessage.textContent = message;
        otpMessage.classList.remove("hidden", "text-red-500", "text-primary");

        if (type === "error") {
            otpMessage.classList.add("text-red-500");

        } else {otpMessage.classList.add("text-primary");
        }
    }


    // VERIFY OTP
    otpForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Combine all six inputs
            let enteredOTP = "";
            otpInputs.forEach(function (input) {
                enteredOTP += input.value;
            });

            // Check if all six digits exist
            if (enteredOTP.length !== 6) {

                showMessage(
                    "Please enter the complete 6-digit verification code.",
                    "error"
                );

                return;
            }

            // Get generated OTP
            const savedOTP = localStorage.getItem("reenBankOTP");

            // Compare OTPs
            if (enteredOTP === savedOTP) {

                // Remove OTP after successful verification
                localStorage.removeItem("reenBankOTP");

                // Get the seccess overlay
                const successOverlay = document.getElementById("success-overlay");

                // Show the overlay
                successOverlay.classList.remove("hidden");
                successOverlay.classList.add("flex");

                // Go to Dashboard
                const successContinue = document.getElementById("success-continue");
                successContinue.addEventListener("click", function () {
                    window.location.href = "./dashboard.html";
                });
          
            } else {
                showMessage("Invalid verification code, please try again.", "error");
            }
        }
    );

    // OTP COUNTDOWN
    let timeLeft = 45;
    let timer;

    function startTimer() {
        timeLeft = 45;
        resendButton.disabled = true;
        resendButton.classList.add("cursor-not-allowed", "opacity-50"
        );

        timer = setInterval(function () {
            const seconds = timeLeft.toString().padStart(2, "0");
            otpTimer.textContent = `0:${seconds} remaining`;
            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(timer);
                otpTimer.textContent = "Code expired. You can request a new one.";
                resendButton.disabled = false;

                resendButton.classList.remove("cursor-not-allowed", "opacity-50"
                );
            }

        }, 1000);
    }


    // RESEND OTP
    resendButton.addEventListener("click", function () {

            // Generate new OTP
            const newOTP = Math.floor(100000 + Math.random() * 900000);

            // Save new OTP
            localStorage.setItem("reenBankOTP", newOTP.toString());

            // Development only
            console.log("New Development OTP:", newOTP);

            // Clear previous inputs
            otpInputs.forEach(function (input) {
                input.value = "";
            });

            // Focus first box
            otpInputs[0].focus();

            // Message
            showMessage("A new verification code has been generated.", "success"
            );

            // Restart timer
            clearInterval(timer);
            startTimer();
        }
    );

    // START TIMER
    startTimer();
}

// LOGIN FORM
const loginForm = document.getElementById("login-form");

if (loginForm) {

    // LOGIN ELEMENTS
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const rememberMe = document.getElementById("remember-me");
    const loginMessage = document.getElementById("login-message");
    const togglePassword = document.getElementById("toggle-login-password");
    const passwordIcon = document.getElementById("login-password-icon");

    // PASSWORD VISIBILITY
    togglePassword.addEventListener("click", function () {
        if (loginPassword.type === "password") {

            // Show Password
            loginPassword.type = "text";

            // Change to Open-eye icon
            passwordIcon.src = "../assets/icons/eye.svg";

            togglePassword.setAttribute("aria-label", "Hide password");

        } else {

            // Hide Password
            loginPassword.type = "password";

            // Change back to closed-eye icon
            passwordIcon.src = "../assets/icons/eye-closed.svg"
            
            togglePassword.setAttribute("aria-label", "Show password");
        }
    });

    // LOGIN SUBMIT
    loginForm.addEventListener("submit", function (event) {

        // Prevent page refresh
        event.preventDefault();

        // GET VALUES 
        const email = loginEmail.value.trim();

        const password = loginPassword.value;

        // CLEAR OLD MESSAGE
        loginMessage.textContent = "";
        loginMessage.classList.add("hidden");

        // BASIC VALIDATION
        if (email === "") {
            loginMessage.textContent = "Please enter your email.";

            loginMessage.classList.remove("hidden");
            loginMessage.classList.add("text-red-500");

            return;
        }

        if (password === "") {
            loginMessage.textContent = "Please enter your password.";

            loginMessage.classList.remove("hidden");
            loginMessage.classList.add("text-red-500");

            return;
        }

        // GET REGISTERED USER
        const savedUser = JSON.parse(localStorage.getItem("reenBankUser"));

        // CHECK IF ACCOUNT EXISTS
        if (!savedUser) {
            loginMessage.textContent = "No account found. Please create an account first.";

            loginMessage.classList.remove("hidden");
            loginMessage.classList.add("text-red-500");

            return;
        }

        // CHECK EMAIL
        if (email !== savedUser.email) {
            loginMessage.textContent = "Incorrect email or password.";

            loginMessage.classList.remove("hidden");
            loginMessage.classList.add("text-red-500");

            return;
        }

        // CHECK PASSWORD
        if (password !== savedUser.password) {
            loginMessage.textContent = "Incorrect email or password.";
            loginMessage.classList.remove("hidden");
            loginMessage.classList.add("text-red-500");

            return;
        }

        // REMEMBER ME
        if (rememberMe.checked) {

            localStorage.setItem("reenBankRememberMe","true");

        } else {

            localStorage.removeItem("reenBankRememberMe");
        }

        // LOGIN SUCCESS
        loginMessage.textContent = "Login successful!";
        loginMessage.classList.remove("hidden");
        loginMessage.classList.remove("text-red-500");
        loginMessage.classList.add("text-primary");

        // GO TO DASHBOARD
        setTimeout(function () {
            window.location.href = "./dashboard.html";

        }, 700);
    });
}