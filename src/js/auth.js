/* =========================================================
   REEN BANK AUTHENTICATION
   Used by: register.html, otp-verification.html, login.html

   Flow: Register -> OTP verification -> Login
   Multiple users are stored permanently in localStorage.
   Passwords are stored as SHA-256 hashes, not plain text.

   TABLE OF CONTENTS
   1. Storage keys
   2. Legacy-user migration
   3. Small helpers (DOM, messages, user storage)
   4. Password security (validation + hashing)
   5. Password eye toggle
   6. REGISTER PAGE
   7. OTP VERIFICATION PAGE
   8. LOGIN PAGE
   ========================================================= */

// 1. STORAGE KEYS
// Every registered user is saved as user1, user2, ... in localStorage.
const USERS_PREFIX = "user";
const USER_COUNT_KEY = "reenBankUserCount";
const PENDING_USER_KEY = "reenBankPendingUser";
const OTP_KEY = "reenBankOTP";
const OTP_EXPIRES_KEY = "reenBankOTPExpires";
// Temporary OTP data (lives in sessionStorage only).
const OTP_SESSION_KEY = "reenBankOTPSession";
const OTP_EXPIRES_SESSION_KEY = "reenBankOTPExpiresSession";
const PREFILL_EMAIL_KEY = "reenBankPrefillEmail";
// Who is signed in right now / remember-me choice.
const CURRENT_USER_KEY = "reenBankCurrentUser";
const REMEMBER_ME_KEY = "reenBankRememberMe";

// OTP values are temporary session data, never persistent localStorage data.
localStorage.removeItem(OTP_KEY);
localStorage.removeItem(OTP_EXPIRES_KEY);

/*
   One-time migration for the previous version of this project.
   If an older build stored a single "reenBankUser", move it into
   the new multi-user system instead of losing that account.
*/
function migrateLegacyUser() {
    const legacy = localStorage.getItem("reenBankUser");

    if (!legacy || getUserCount() > 0) return;

    try {
        const oldUser = JSON.parse(legacy);

        if (!oldUser || !oldUser.email || !oldUser.password) return;

        const number = 1;

        /*
           The old version stored the password as plain text.
           It is immediately converted to a SHA-256 hash when
           the migration runs.
        */
        hashPassword(oldUser.password).then(passwordHash => {
            const migratedUser = {
                id: "user1",
                name: oldUser.name || "",
                email: oldUser.email.toLowerCase(),
                passwordHash,
                termsAccepted: true,
                verified: true,
                createdAt: new Date().toISOString(),
                migratedFromLegacy: true
            };

            saveUser(number, migratedUser);
            localStorage.setItem(USER_COUNT_KEY, "1");
            localStorage.removeItem("reenBankUser");
        });
    } catch {
        // Ignore invalid legacy data.
    }
}

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */

// Shortcut for document.getElementById.
function getElement(id) {
    return document.getElementById(id);
}

// Shows a red (error) or green (success) message inside a message element.
function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("hidden", "text-red-500", "text-primary");

    element.classList.add(
        type === "success" ? "text-primary" : "text-red-500"
    );
}

// Clears and hides a message element.
function hideMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.classList.add("hidden");
    element.classList.remove("text-red-500", "text-primary");
}

// How many users have registered so far.
function getUserCount() {
    return Number(localStorage.getItem(USER_COUNT_KEY)) || 0;
}

// Builds the storage key for a user number, e.g. 3 -> "user3".
function getUserKey(number) {
    return `${USERS_PREFIX}${number}`;
}

// Reads one saved user (null when missing or corrupted).
function getUser(number) {
    const saved = localStorage.getItem(getUserKey(number));

    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

// Saves one user record.
function saveUser(number, user) {
    localStorage.setItem(getUserKey(number), JSON.stringify(user));
}

// Returns every saved user, each tagged with its userNumber.
function getAllUsers() {
    const users = [];

    for (let i = 1; i <= getUserCount(); i++) {
        const user = getUser(i);

        if (user) {
            users.push({
                ...user,
                userNumber: i
            });
        }
    }

    return users;
}

/* ---------------------------------------------------------
   Password security
   --------------------------------------------------------- */

/*
   Minimum rule:
   - At least 8 characters
   - At least one letter
   - At least one number
*/
function validatePassword(password) {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }

    if (!/[A-Za-z]/.test(password)) {
        return "Password must contain at least one letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    return "";
}

// Returns the SHA-256 hash (hex) of a password.
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Run the one-time migration as soon as hashPassword() exists.
migrateLegacyUser();

/* ---------------------------------------------------------
   Password eye helpers
   --------------------------------------------------------- */

// Adds show / hide behaviour to a password field.
// The eye button only appears once the user has typed something.
function setupPasswordToggle({
    input,
    button,
    icon,
    wrapper
}) {
    if (!input || !button || !icon) return;

    function updateEye() {
        /*
           Eye is hidden when there is no password.
           Eye appears as soon as the user types.
        */
        if (input.value.length > 0) {
            button.classList.remove("hidden");
            button.classList.add("flex");
        } else {
            button.classList.add("hidden");
            button.classList.remove("flex");

            // Always return to hidden-password mode.
            input.type = "password";
            icon.src = "../assets/icons/eye-closed.svg";
            button.setAttribute("aria-label", "Show password");
        }
    }

    function togglePassword(event) {
        event.preventDefault();

        if (input.value.length === 0) return;

        const isHidden = input.type === "password";

        input.type = isHidden ? "text" : "password";

        icon.src = isHidden
            ? "../assets/icons/eye.svg"
            : "../assets/icons/eye-closed.svg";

        button.setAttribute(
            "aria-label",
            isHidden ? "Hide password" : "Show password"
        );
    }

    input.addEventListener("input", updateEye);

    button.addEventListener("click", togglePassword);

    /*
       Clicking anywhere inside the password wrapper focuses
       the password input, including the empty outer area.
       Clicking the eye itself still toggles visibility.
    */
    if (wrapper) {
        wrapper.addEventListener("click", function(event) {
            if (event.target.closest("button")) return;
            input.focus();
        });
    }

    updateEye();
}

/* =========================================================
   REGISTER PAGE
   ========================================================= */

// Only runs on register.html (the form exists there).
const registerForm = getElement("register-form");

if (registerForm) {
    const nameInput = getElement("name");
    const emailInput = getElement("email");
    const passwordInput = getElement("password");
    const termsInput = getElement("terms");
    const registerMessage = getElement("register-message");

    const toggleButton = getElement("toggle-register-password");
    const passwordIcon = getElement("register-password-icon");

    const passwordWrapper = passwordInput
        ? passwordInput.closest(".relative")
        : null;

    setupPasswordToggle({
        input: passwordInput,
        button: toggleButton,
        icon: passwordIcon,
        wrapper: passwordWrapper
    });

    /* Prefill email from the landing-page CTA */
    const savedEmail = localStorage.getItem(PREFILL_EMAIL_KEY);

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        localStorage.removeItem(PREFILL_EMAIL_KEY);
    }

    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        hideMessage(registerMessage);

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const termsAccepted = termsInput.checked;

        /* ---------------------------------------------
           Registration validation
           --------------------------------------------- */

        if (name === "") {
            showMessage(registerMessage, "Please enter your name.");
            nameInput.focus();
            return;
        }

        if (email === "") {
            showMessage(registerMessage, "Please enter your email.");
            emailInput.focus();
            return;
        }

        if (!emailInput.checkValidity()) {
            showMessage(registerMessage, "Please enter a valid email address.");
            emailInput.focus();
            return;
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            showMessage(registerMessage, passwordError);
            passwordInput.focus();
            return;
        }

        if (!termsAccepted) {
            showMessage(
                registerMessage,
                "Please agree to the Terms, Privacy Policy and Fees."
            );
            termsInput.focus();
            return;
        }

        /* ---------------------------------------------
           Prevent duplicate email accounts
           --------------------------------------------- */

        const existingUser = getAllUsers().find(
            user => user.email.toLowerCase() === email
        );

        if (existingUser) {
            showMessage(
                registerMessage,
                "An account with this email already exists. Please log in instead."
            );
            emailInput.focus();
            return;
        }

        /* ---------------------------------------------
           Create a permanent user number
           --------------------------------------------- */

        const userNumber = getUserCount() + 1;
        const userKey = getUserKey(userNumber);
        const passwordHash = await hashPassword(password);

        const user = {
            id: userKey,
            name,
            email,
            passwordHash,
            termsAccepted: true,
            verified: false,
            createdAt: new Date().toISOString()
        };

        saveUser(userNumber, user);

        localStorage.setItem(USER_COUNT_KEY, String(userNumber));

        /* ---------------------------------------------
           Generate OTP
           --------------------------------------------- */

        const otp = String(
            Math.floor(100000 + Math.random() * 900000)
        );

        const otpExpiresAt = Date.now() + 5 * 60 * 1000;

        sessionStorage.setItem(OTP_SESSION_KEY, otp);
        sessionStorage.setItem(OTP_EXPIRES_SESSION_KEY, String(otpExpiresAt));
        localStorage.removeItem(OTP_KEY);
        localStorage.removeItem(OTP_EXPIRES_KEY);
        localStorage.setItem(PENDING_USER_KEY, userKey);

        /*
           Demo mode: the temporary OTP is kept only in sessionStorage
           for the current registration session and is displayed on the
           verification page instead of being persisted in localStorage.
        */

        window.location.href = "./otp-verification.html";
    });
}

/* =========================================================
   OTP VERIFICATION PAGE
   ========================================================= */

// Only runs on otp-verification.html.
const otpForm = getElement("otp-form");

if (otpForm) {
    const otpInputs = document.querySelectorAll(".otp-input");
    const otpTimer = getElement("otp-timer");
    const resendButton = getElement("resend-code");
    const otpMessage = getElement("otp-message");
    const generatedOtp = getElement("generated-otp");
    const maskedEmail = getElement("masked-email");
    const changeEmail = getElement("change-email");

    const pendingUserKey = localStorage.getItem(PENDING_USER_KEY);

    // The user who just registered and still needs to verify their email.
    function getPendingUser() {
        if (!pendingUserKey) return null;

        const match = pendingUserKey.match(/^user(\d+)$/);

        if (!match) return null;

        return getUser(Number(match[1]));
    }

    // Hides the middle of an email, e.g. "johndoe@mail.com" -> "j*****e@mail.com".
    function maskEmail(email) {
        if (!email || !email.includes("@")) return "";

        const [username, domain] = email.split("@");

        if (username.length <= 2) {
            return `${username[0] || ""}***@${domain}`;
        }

        return (
            username[0] +
            "*".repeat(Math.max(username.length - 2, 1)) +
            username[username.length - 1] +
            "@" +
            domain
        );
    }

    function showOTPMessage(message, type = "error") {
        showMessage(otpMessage, message, type);
    }

    const pendingUser = getPendingUser();
    if (generatedOtp) generatedOtp.textContent = sessionStorage.getItem(OTP_SESSION_KEY) || "------";

    if (pendingUser && maskedEmail) {
        maskedEmail.textContent = maskEmail(pendingUser.email);
    }

    if (changeEmail) {
        changeEmail.addEventListener("click", function() {
            window.location.href = "./register.html";
        });
    }

    /* OTP input behavior */
    otpInputs.forEach((input, index) => {
        input.addEventListener("input", function() {
            input.value = input.value.replace(/\D/g, "").slice(0, 1);

            if (input.value && otpInputs[index + 1]) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", function(event) {
            if (
                event.key === "Backspace" &&
                !input.value &&
                otpInputs[index - 1]
            ) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener("paste", function(event) {
            event.preventDefault();

            const pasted = event.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, otpInputs.length);

            pasted.split("").forEach((digit, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = digit;
                }
            });

            const nextEmpty = Array.from(otpInputs).find(
                field => field.value === ""
            );

            (nextEmpty || otpInputs[otpInputs.length - 1]).focus();
        });
    });

    // Counts down the OTP validity time (mm:ss) and turns red at zero.
    function startOTPTimer() {
        if (!otpTimer) return;

        function updateTimer() {
            const expiresAt = Number(
                sessionStorage.getItem(OTP_EXPIRES_SESSION_KEY)
            );

            const remaining = Math.max(
                0,
                Math.ceil((expiresAt - Date.now()) / 1000)
            );

            const minutes = Math.floor(remaining / 60);
            const seconds = String(remaining % 60).padStart(2, "0");

            otpTimer.textContent =
                `${minutes}:${seconds} remaining`;

            if (remaining <= 0) {
                otpTimer.classList.add("text-red-500");
                otpTimer.classList.remove("text-primary");
            } else {
                otpTimer.classList.remove("text-red-500");
                otpTimer.classList.add("text-primary");
                setTimeout(updateTimer, 1000);
            }
        }

        updateTimer();
    }

    startOTPTimer();

    otpForm.addEventListener("submit", function(event) {
        event.preventDefault();
        hideMessage(otpMessage);

        let enteredOTP = "";

        otpInputs.forEach(input => {
            enteredOTP += input.value;
        });

        if (enteredOTP.length !== 6) {
            showOTPMessage(
                "Please enter the complete 6-digit verification code."
            );
            return;
        }

        const savedOTP = sessionStorage.getItem(OTP_SESSION_KEY);
        const expiresAt = Number(
            sessionStorage.getItem(OTP_EXPIRES_SESSION_KEY)
        );

        if (!pendingUser) {
            showOTPMessage(
                "Your registration session could not be found. Please register again."
            );
            return;
        }

        if (!savedOTP || Date.now() > expiresAt) {
            showOTPMessage(
                "This verification code has expired. Please request a new code."
            );
            return;
        }

        if (enteredOTP !== savedOTP) {
            showOTPMessage(
                "Invalid verification code, please try again."
            );
            return;
        }

        /* Mark the correct user as verified */
        const userNumber = Number(
            pendingUserKey.replace("user", "")
        );

        const verifiedUser = {
            ...pendingUser,
            verified: true,
            verifiedAt: new Date().toISOString()
        };

        saveUser(userNumber, verifiedUser);

        sessionStorage.removeItem(OTP_SESSION_KEY);
        sessionStorage.removeItem(OTP_EXPIRES_SESSION_KEY);
        localStorage.removeItem(OTP_KEY);
        localStorage.removeItem(OTP_EXPIRES_KEY);
        localStorage.removeItem(PENDING_USER_KEY);

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({
                id: verifiedUser.id,
                name: verifiedUser.name,
                email: verifiedUser.email
            })
        );

        const successOverlay = getElement("success-overlay");

        if (successOverlay) {
            successOverlay.classList.remove("hidden");
            successOverlay.classList.add("flex");
        }

        const successContinue = getElement("success-continue");

        if (successContinue) {
            successContinue.onclick = function() {
                window.location.href = "./dashboard.html";
            };
        }
    });

    /* Resend OTP */
    if (resendButton) {
        resendButton.addEventListener("click", function() {
            if (!pendingUser) {
                showOTPMessage(
                    "Registration session not found. Please register again."
                );
                return;
            }

            const newOTP = String(
                Math.floor(100000 + Math.random() * 900000)
            );

            sessionStorage.setItem(OTP_SESSION_KEY, newOTP);
            sessionStorage.setItem(
                OTP_EXPIRES_SESSION_KEY,
                String(Date.now() + 5 * 60 * 1000)
            );
            if (generatedOtp) generatedOtp.textContent = newOTP;

            showOTPMessage(
                "A new verification code has been generated.",
                "success"
            );

            startOTPTimer();
        });
    }
}

/* =========================================================
   LOGIN PAGE
   ========================================================= */

// Only runs on login.html.
const loginForm = getElement("login-form");

if (loginForm) {
    const loginEmail = getElement("login-email");
    const loginPassword = getElement("login-password");
    const rememberMe = getElement("remember-me");
    const loginMessage = getElement("login-message");

    const toggleButton = getElement("toggle-login-password");
    const passwordIcon = getElement("login-password-icon");

    const passwordWrapper = loginPassword
        ? loginPassword.closest(".relative")
        : null;

    setupPasswordToggle({
        input: loginPassword,
        button: toggleButton,
        icon: passwordIcon,
        wrapper: passwordWrapper
    });

    // Case-insensitive lookup of a registered user by email.
    function findUserByEmail(email) {
        return getAllUsers().find(
            user => user.email.toLowerCase() === email.toLowerCase()
        );
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        hideMessage(loginMessage);

        const email = loginEmail.value.trim().toLowerCase();
        const password = loginPassword.value;

        if (email === "") {
            showMessage(loginMessage, "Please enter your email.");
            loginEmail.focus();
            return;
        }

        if (!loginEmail.checkValidity()) {
            showMessage(loginMessage, "Please enter a valid email address.");
            loginEmail.focus();
            return;
        }

        if (password === "") {
            showMessage(loginMessage, "Please enter your password.");
            loginPassword.focus();
            return;
        }

        /*
           Login password validation:
           An invalid/too-short password is rejected before
           checking the stored account.
        */
        const passwordError = validatePassword(password);

        if (passwordError) {
            showMessage(
                loginMessage,
                "Invalid password. Password must be at least 8 characters and contain a letter and a number."
            );
            loginPassword.focus();
            return;
        }

        const user = findUserByEmail(email);

        if (!user) {
            showMessage(
                loginMessage,
                "Invalid email or password."
            );
            return;
        }

        if (!user.verified) {
            showMessage(
                loginMessage,
                "Please verify your email before logging in."
            );
            return;
        }

        const passwordHash = await hashPassword(password);

        if (passwordHash !== user.passwordHash) {
            showMessage(
                loginMessage,
                "Invalid email or password."
            );
            return;
        }

        /*
           Remember only the logged-in user's ID.
           Account records themselves remain stored permanently.
        */
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem(
                REMEMBER_ME_KEY,
                user.id
            );
        } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
        }

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            })
        );

        showMessage(
            loginMessage,
            "Login successful!",
            "success"
        );

        setTimeout(function() {
            window.location.href = "./dashboard.html";
        }, 700);
    });
}