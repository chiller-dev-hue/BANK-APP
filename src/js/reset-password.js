/* =========================================================
   REEN BANK — SHARED RESET PASSWORD OVERLAY
   Login + Profile use the same Figma multi-stage flow.
   Stage 1: Email -> Stage 2: OTP -> Stage 3: New Password
   -> Stage 4: Success
========================================================= */
(function () {
    const RESET_USER_KEY = "reenBankResetUser";
    const RESET_OTP_KEY = "reenBankResetOTP";
    const RESET_OTP_EXPIRES_KEY = "reenBankResetOTPExpires";
    const USERS_PREFIX = "user";
    const USER_COUNT_KEY = "reenBankUserCount";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const getUserCount = () => Number(localStorage.getItem(USER_COUNT_KEY)) || 0;
    const getUser = number => {
        try { return JSON.parse(localStorage.getItem(`${USERS_PREFIX}${number}`)); }
        catch { return null; }
    };
    const getAllUsers = () => {
        const users = [];
        for (let i = 1; i <= getUserCount(); i++) {
            const user = getUser(i);
            if (user) users.push({ ...user, userNumber: i });
        }
        return users;
    };

    const hashPassword = async password => {
        const data = new TextEncoder().encode(password);
        if (window.crypto?.subtle) {
            const digest = await window.crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
        }
        let hash = 0;
        for (let i = 0; i < password.length; i++) hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
        return `fallback-${Math.abs(hash)}`;
    };

    const passwordError = password => {
        if (password.length < 8) return "Password must be at least 8 characters long.";
        if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter.";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
        return "";
    };

    const maskEmail = email => {
        const [name, domain] = String(email).split("@");
        if (!name || !domain) return email;
        const visible = name.length <= 2 ? name.charAt(0) : name.slice(0, 2);
        return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
    };

    const getModal = () => {
        let modal = document.getElementById("reset-password-modal");
        if (modal) return modal;

        modal = document.createElement("section");
        modal.id = "reset-password-modal";
        modal.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(51,183,134,.42)_0%,rgba(51,183,134,.25)_38%,rgba(212,243,231,.60)_72%,rgba(255,255,255,.15)_100%)] p-7 font-poppins backdrop-blur-[3px] hidden";
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <div class="reset-password-backdrop" data-reset-close></div>
            <div class="reset-password-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-stage-title">
                <div id="reset-stage-email" class="reset-stage reset-stage-email">
                    <h2 id="reset-stage-title" class="reset-stage-title">Reset Password</h2>
                    <form id="reset-email-form" class="reset-form">
                        <div class="reset-field">
                            <label for="reset-email">Email</label>
                            <div class="reset-input-wrap">
                                <input id="reset-email" type="email" placeholder="Enter your Email" autocomplete="email" required>
                                <img src="../assets/icons/mail.svg" alt="" aria-hidden="true">
                            </div>
                        </div>
                        <p id="reset-email-message" class="reset-message hidden" aria-live="polite"></p>
                        <button type="submit" class="reset-primary-button">Reset Password</button>
                    </form>
                </div>

                <div id="reset-stage-otp" class="reset-stage reset-stage-otp hidden">
                    <h2 class="reset-stage-title">Enter Otp</h2>
                    <p class="reset-stage-description">A 6-digit code has been sent to your email as <span id="reset-otp-email">us***me@gmail.com</span> <button type="button" id="reset-change-email" class="reset-inline-link">Change</button></p>
                    <form id="reset-otp-form" class="reset-form">
                        <div class="reset-otp-inputs" aria-label="6 digit verification code">
                            ${Array.from({length:6}, (_,i)=>`<input class="reset-otp-input" maxlength="1" inputmode="numeric" aria-label="Digit ${i+1}">`).join("")}
                        </div>
                        <p id="reset-otp-timer" class="reset-timer">0:45 remaining</p>
                        <p id="reset-otp-message" class="reset-message hidden" aria-live="polite"></p>
                        <button type="submit" class="reset-primary-button">Confirm</button>
                        <p class="reset-resend-text">Didn't receive the code? <button type="button" id="reset-resend-otp" class="reset-inline-link">Resend</button></p>
                    </form>
                </div>

                <div id="reset-stage-password" class="reset-stage reset-stage-password hidden">
                    <h2 class="reset-stage-title">Enter new Password</h2>
                    <form id="reset-password-form" class="reset-form">
                        <div class="reset-field">
                            <label for="reset-new-password">New Password</label>
                            <div class="reset-input-wrap">
                                <input id="reset-new-password" type="password" placeholder="Enter your Password" autocomplete="new-password" required>
                                <img src="../assets/icons/lock-keyhole.svg" alt="" aria-hidden="true">
                            </div>
                        </div>
                        <div class="reset-field">
                            <label for="reset-confirm-password">Retype Password</label>
                            <div class="reset-input-wrap">
                                <input id="reset-confirm-password" type="password" placeholder="Retype your Password" autocomplete="new-password" required>
                                <img src="../assets/icons/lock-keyhole.svg" alt="" aria-hidden="true">
                            </div>
                        </div>
                        <p id="reset-password-message" class="reset-message hidden" aria-live="polite"></p>
                        <button type="submit" class="reset-primary-button">Change Password</button>
                    </form>
                </div>

                <div id="reset-stage-success" class="reset-stage reset-stage-success hidden">
                    <div class="reen-success-tick" aria-hidden="true"><img src="../assets/icons/check.svg" alt=""></div>
                    <p class="reset-success-text">Your password has been changed!</p>
                    <button type="button" id="reset-go-back" class="reset-primary-button">Go Back</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        return modal;
    };

    const init = () => {
        const modal = getModal();
        if (!modal || modal.dataset.resetBound === "true") return;
        modal.dataset.resetBound = "true";

        const emailForm = $("#reset-email-form", modal);
        const otpForm = $("#reset-otp-form", modal);
        const passwordForm = $("#reset-password-form", modal);
        const emailInput = $("#reset-email", modal);
        const emailMessage = $("#reset-email-message", modal);
        const otpEmail = $("#reset-otp-email", modal);
        const otpInputs = $$(".reset-otp-input", modal);
        const otpTimer = $("#reset-otp-timer", modal);
        const otpMessage = $("#reset-otp-message", modal);
        const passwordMessage = $("#reset-password-message", modal);
        const newPassword = $("#reset-new-password", modal);
        const confirmPassword = $("#reset-confirm-password", modal);
        const stages = {
            email: $("#reset-stage-email", modal),
            otp: $("#reset-stage-otp", modal),
            password: $("#reset-stage-password", modal),
            success: $("#reset-stage-success", modal)
        };
        let timer = null;

        const clearMessage = element => {
            if (!element) return;
            element.textContent = "";
            element.classList.add("hidden");
            element.classList.remove("reset-message-error", "reset-message-success");
        };
        const showMessage = (element, message, success = false) => {
            if (!element) return;
            element.textContent = message;
            element.classList.remove("hidden");
            element.classList.toggle("reset-message-error", !success);
            element.classList.toggle("reset-message-success", success);
        };
        const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
        const startTimer = () => {
            stopTimer();
            const tick = () => {
                const left = Math.max(0, Number(localStorage.getItem(RESET_OTP_EXPIRES_KEY)) - Date.now());
                const seconds = Math.ceil(left / 1000);
                if (otpTimer) {
                    otpTimer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,"0")} remaining`;
                    otpTimer.classList.toggle("reset-timer-expired", seconds === 0);
                }
                if (seconds === 0) stopTimer();
            };
            tick(); timer = setInterval(tick, 1000);
        };
        const clearInputs = () => otpInputs.forEach(input => input.value = "");
        const showStage = stage => {
            Object.values(stages).forEach(section => section?.classList.add("hidden"));
            stages[stage]?.classList.remove("hidden");
            const focus = { email: emailInput, otp: otpInputs[0], password: newPassword, success: $("#reset-go-back", modal) }[stage];
            setTimeout(() => focus?.focus(), 30);
        };
        const close = () => {
            modal.classList.add("hidden");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("overflow-hidden");
            stopTimer(); clearInputs();
            [emailMessage, otpMessage, passwordMessage].forEach(clearMessage);
            if (newPassword) newPassword.value = "";
            if (confirmPassword) confirmPassword.value = "";
        };
        const open = prefill => {
            modal.classList.remove("hidden");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("overflow-hidden");
            emailInput.value = prefill || "";
            emailInput.removeAttribute("aria-invalid");
            showStage("email");
        };
        const findUser = email => getAllUsers().find(user => String(user.email || "").toLowerCase() === email.toLowerCase());
        const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));
        const createOTP = user => {
            const otp = generateOTP();
            localStorage.setItem(RESET_USER_KEY, user.id);
            localStorage.setItem(RESET_OTP_KEY, otp);
            localStorage.setItem(RESET_OTP_EXPIRES_KEY, String(Date.now() + 45000));
            console.log(`Development reset OTP for ${user.id}:`, otp);
            clearInputs(); startTimer();
        };

        $$("[data-reset-close]", modal).forEach(el => el.addEventListener("click", close));
        $("#reset-go-back", modal)?.addEventListener("click", close);
        $("#reset-change-email", modal)?.addEventListener("click", () => { clearInputs(); stopTimer(); showStage("email"); });
        $("#reset-resend-otp", modal)?.addEventListener("click", () => {
            const id = localStorage.getItem(RESET_USER_KEY);
            const user = getAllUsers().find(item => item.id === id);
            if (!user) return showStage("email");
            createOTP(user); clearMessage(otpMessage); showMessage(otpMessage, "A new verification code has been generated.", true);
        });

        emailForm?.addEventListener("submit", event => {
            event.preventDefault(); clearMessage(emailMessage);
            const email = emailInput.value.trim().toLowerCase();
            if (!email) return showMessage(emailMessage, "Please enter your email.");
            if (!emailInput.checkValidity()) return showMessage(emailMessage, "Please enter a valid email address.");
            const user = findUser(email);
            if (!user) return showMessage(emailMessage, "No account was found with this email.");
            otpEmail.textContent = maskEmail(user.email);
            createOTP(user); showStage("otp");
        });

        otpInputs.forEach((input, index) => {
            input.addEventListener("input", event => {
                event.target.value = event.target.value.replace(/\D/g, "").slice(-1);
                if (event.target.value && otpInputs[index + 1]) otpInputs[index + 1].focus();
            });
            input.addEventListener("keydown", event => {
                if (event.key === "Backspace" && !input.value && otpInputs[index - 1]) otpInputs[index - 1].focus();
            });
            input.addEventListener("paste", event => {
                event.preventDefault();
                const value = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0,6);
                value.split("").forEach((digit, i) => { if (otpInputs[i]) otpInputs[i].value = digit; });
                (otpInputs.find(input => !input.value) || otpInputs[5])?.focus();
            });
        });

        otpForm?.addEventListener("submit", event => {
            event.preventDefault(); clearMessage(otpMessage);
            const entered = otpInputs.map(input => input.value).join("");
            const saved = localStorage.getItem(RESET_OTP_KEY);
            const expires = Number(localStorage.getItem(RESET_OTP_EXPIRES_KEY));
            if (entered.length !== 6) return showMessage(otpMessage, "Please enter the complete 6-digit verification code.");
            if (!saved || Date.now() > expires) return showMessage(otpMessage, "This verification code has expired. Please request a new code.");
            if (entered !== saved) return showMessage(otpMessage, "Invalid verification code, please try again.");
            stopTimer(); showStage("password");
        });

        passwordForm?.addEventListener("submit", async event => {
            event.preventDefault(); clearMessage(passwordMessage);
            const userId = localStorage.getItem(RESET_USER_KEY);
            const user = getAllUsers().find(item => item.id === userId);
            if (!user) { showStage("email"); return showMessage(emailMessage, "Your reset session has expired. Please start again."); }
            const error = passwordError(newPassword.value);
            if (error) return showMessage(passwordMessage, error);
            if (newPassword.value !== confirmPassword.value) return showMessage(passwordMessage, "Passwords do not match.");
            user.passwordHash = await hashPassword(newPassword.value);
            localStorage.setItem(`${USERS_PREFIX}${user.userNumber}`, JSON.stringify(user));
            const profileUser = JSON.parse(localStorage.getItem("reenBankCurrentUser") || "null");
            if (profileUser?.id === user.id) localStorage.setItem("reenBankCurrentUser", JSON.stringify({ ...profileUser, email: user.email, name: user.name }));
            localStorage.removeItem(RESET_USER_KEY); localStorage.removeItem(RESET_OTP_KEY); localStorage.removeItem(RESET_OTP_EXPIRES_KEY);
            newPassword.value = ""; confirmPassword.value = ""; stopTimer(); showStage("success");
        });

        window.addEventListener("keydown", event => {
            if (event.key === "Escape" && !modal.classList.contains("hidden")) close();
        });

        const loginForgot = document.getElementById("forgot-password");
        loginForgot?.addEventListener("click", () => open($("#login-email")?.value.trim() || ""));
        document.getElementById("reset-password-button")?.addEventListener("click", () => {
            const current = JSON.parse(localStorage.getItem("reenBankCurrentUser") || "null");
            open(current?.email || "");
        });

        window.ReenBankReset = { open, close };
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
