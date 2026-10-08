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
    const RESET_OTP_SESSION_KEY = "reenBankResetOTPSession";
    const RESET_OTP_EXPIRES_SESSION_KEY = "reenBankResetOTPExpiresSession";
    const USERS_PREFIX = "user";
    const USER_COUNT_KEY = "reenBankUserCount";

    // OTP values are temporary session data, never persistent localStorage data.
    localStorage.removeItem(RESET_OTP_KEY);
    localStorage.removeItem(RESET_OTP_EXPIRES_KEY);

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
        modal.className = "fixed inset-0 z-[9999] hidden overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(51,183,134,.78)_0%,_rgba(51,183,134,.55)_42%,_rgba(212,243,231,.70)_76%,_rgba(255,255,255,.18)_100%)] px-3 py-3 font-poppins backdrop-blur-[3px] sm:px-5 sm:py-4";
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <div class="absolute inset-0" data-reset-close></div>
            <div class="relative z-10 flex min-h-full w-full items-center justify-center py-1 sm:py-2">
                <div class="flex max-h-[calc(100dvh-24px)] w-full max-w-[790px] items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reset-stage-title">

                    <!-- Stage 1: email -->
                    <div id="reset-stage-email" class="w-full max-h-[calc(100dvh-24px)] overflow-hidden rounded-[30px] bg-white px-6 py-7 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-12 sm:py-10">
                        <h2 id="reset-stage-title" class="text-[30px] font-semibold leading-none text-primary sm:text-[38px]">Reset Password</h2>
                        <form id="reset-email-form" class="mt-8">
                            <label for="reset-email" class="mb-2 block text-sm font-semibold">Email</label>
                            <div class="relative">
                                <input id="reset-email" type="email" placeholder="Enter your Email" autocomplete="email" required class="h-12 w-full rounded-xl border border-[#999] bg-white px-5 pr-14 text-base text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary">
                                <img src="../assets/icons/mail.svg" alt="" aria-hidden="true" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-60">
                            </div>
                            <p id="reset-email-message" class="mt-2 hidden text-xs font-medium" aria-live="polite"></p>
                            <button type="submit" class="mt-8 h-12 w-full rounded-xl bg-primary px-6 text-xl font-semibold text-white transition hover:bg-[#2fae80] sm:text-2xl">Reset Password</button>
                        </form>
                    </div>

                    <!-- Stage 2: OTP -->
                    <div id="reset-stage-otp" class="hidden w-full max-h-[calc(100dvh-24px)] overflow-hidden rounded-[30px] bg-white px-6 py-7 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-12 sm:py-10">
                        <h2 class="text-[30px] font-semibold leading-none text-primary sm:text-[38px]">Enter Otp</h2>
                        <p class="mt-7 text-sm leading-5 text-[#b8b8b8] sm:text-base">A 6-digit code has been sent to your email as <span id="reset-otp-email">us***me@gmail.com</span> <button type="button" id="reset-change-email" class="font-semibold text-primary hover:underline">Change</button></p>
                        <form id="reset-otp-form" class="mt-5">
                            <p class="mb-3 text-sm font-semibold text-primary">Your verification code: <span id="reset-generated-otp" class="font-bold tracking-[0.25em]">------</span></p>
                            <div class="grid grid-cols-6 gap-2 sm:gap-4" aria-label="6 digit verification code">
                                ${Array.from({length:6}, (_,i)=>`<input data-reset-otp maxlength="1" inputmode="numeric" aria-label="Digit ${i+1}" class="h-12 w-full min-w-0 rounded-xl border border-[#999] bg-white text-center text-lg font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary">`).join("")}
                            </div>
                            <p id="reset-otp-timer" class="mt-4 text-sm font-medium text-primary">0:45 remaining</p>
                            <p id="reset-otp-message" class="mt-2 hidden text-xs font-medium" aria-live="polite"></p>
                            <button type="submit" class="mt-6 h-12 w-full rounded-xl bg-primary px-6 text-xl font-semibold text-white transition hover:bg-[#2fae80] sm:text-2xl">Confirm</button>
                            <p class="mt-4 text-sm text-[#b8b8b8] sm:text-base">Didn't receive the code? <button type="button" id="reset-resend-otp" class="font-semibold text-primary hover:underline">Resend</button></p>
                        </form>
                    </div>

                    <!-- Stage 3: new password -->
                    <div id="reset-stage-password" class="hidden w-full max-h-[calc(100dvh-24px)] overflow-hidden rounded-[30px] bg-white px-6 py-7 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-12 sm:py-10">
                        <h2 class="text-[30px] font-semibold leading-none text-primary sm:text-[38px]">Enter new Password</h2>
                        <form id="reset-password-form" class="mt-8">
                            <label for="reset-new-password" class="mb-2 block text-sm font-semibold">New Password</label>
                            <div class="relative">
                                <input id="reset-new-password" type="password" placeholder="Enter your Password" autocomplete="new-password" required class="h-12 w-full rounded-xl border border-[#999] bg-white px-5 pr-20 text-base text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary">
                                <img src="../assets/icons/lock-keyhole.svg" alt="" aria-hidden="true" class="pointer-events-none absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 opacity-60">
                                <button type="button" data-password-toggle="reset-new-password" aria-label="Show password" class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md">
                                    <img src="../assets/icons/eye-closed.svg" alt="" class="h-5 w-5 opacity-60">
                                </button>
                            </div>
                            <label for="reset-confirm-password" class="mb-2 mt-4 block text-sm font-semibold">Retype Password</label>
                            <div class="relative">
                                <input id="reset-confirm-password" type="password" placeholder="Retype your Password" autocomplete="new-password" required class="h-12 w-full rounded-xl border border-[#999] bg-white px-5 pr-20 text-base text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary">
                                <img src="../assets/icons/lock-keyhole.svg" alt="" aria-hidden="true" class="pointer-events-none absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 opacity-60">
                                <button type="button" data-password-toggle="reset-confirm-password" aria-label="Show password" class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md">
                                    <img src="../assets/icons/eye-closed.svg" alt="" class="h-5 w-5 opacity-60">
                                </button>
                            </div>
                            <p id="reset-password-message" class="mt-2 hidden text-xs font-medium" aria-live="polite"></p>
                            <button type="submit" class="mt-8 h-12 w-full rounded-xl bg-primary px-6 text-xl font-semibold text-white transition hover:bg-[#2fae80] sm:text-2xl">Change Password</button>
                        </form>
                    </div>

                    <!-- Stage 4: success -->
                    <div id="reset-stage-success" class="hidden mx-auto flex w-full max-w-xl max-h-[calc(100dvh-24px)] flex-col items-center justify-center overflow-hidden rounded-3xl bg-white px-6 py-7 text-center text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-10 sm:py-8">
                        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4F3E7]">
                            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                                <img src="../assets/icons/check.svg" alt="Success" class="h-6 w-6 brightness-0 invert">
                            </div>
                        </div>
                        <p class="text-base font-semibold leading-snug text-[#666] sm:text-xl">Your password has been changed!</p>
                        <button type="button" id="reset-go-back" class="mt-5 h-11 w-full max-w-xl rounded-lg bg-primary px-5 text-base font-semibold text-white transition hover:bg-[#2fae80] sm:h-14 sm:text-lg">Go Back</button>
                    </div>

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
        const otpInputs = $$(`[data-reset-otp]`, modal);
        const otpTimer = $("#reset-otp-timer", modal);
        const otpMessage = $("#reset-otp-message", modal);
        const generatedOtp = $("#reset-generated-otp", modal);
        const passwordMessage = $("#reset-password-message", modal);
        const newPassword = $("#reset-new-password", modal);
        const confirmPassword = $("#reset-confirm-password", modal);
        $$('[data-password-toggle]', modal).forEach(button => {
            if (button.dataset.bound) return;
            button.dataset.bound = "true";
            const input = document.getElementById(button.dataset.passwordToggle);
            const icon = $("img", button);
            button.addEventListener("click", () => {
                if (!input) return;
                const show = input.type === "password";
                input.type = show ? "text" : "password";
                button.setAttribute("aria-label", show ? "Hide password" : "Show password");
                if (icon) icon.src = show ? "../assets/icons/eye.svg" : "../assets/icons/eye-closed.svg";
            });
        });
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
            element.classList.remove("text-red-500", "text-primary");
        };
        const showMessage = (element, message, success = false) => {
            if (!element) return;
            element.textContent = message;
            element.classList.remove("hidden");
            element.classList.toggle("text-red-500", !success);
            element.classList.toggle("text-primary", success);
        };
        const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
        const startTimer = () => {
            stopTimer();
            const tick = () => {
                const left = Math.max(0, Number(sessionStorage.getItem(RESET_OTP_EXPIRES_SESSION_KEY)) - Date.now());
                const seconds = Math.ceil(left / 1000);
                if (otpTimer) {
                    otpTimer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,"0")} remaining`;
                    otpTimer.classList.toggle("text-red-500", seconds === 0);
                    otpTimer.classList.toggle("text-primary", seconds !== 0);
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
            if (generatedOtp) generatedOtp.textContent = "------";
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
            const expiresAt = Date.now() + 45000;
            sessionStorage.setItem(RESET_OTP_SESSION_KEY, otp);
            sessionStorage.setItem(RESET_OTP_EXPIRES_SESSION_KEY, String(expiresAt));
            localStorage.removeItem(RESET_OTP_KEY);
            localStorage.removeItem(RESET_OTP_EXPIRES_KEY);
            if (generatedOtp) generatedOtp.textContent = otp;
            clearInputs(); startTimer();
        };

        $$("[data-reset-close]", modal).forEach(el => el.addEventListener("click", close));
        $("#reset-go-back", modal)?.addEventListener("click", close);
        $("#reset-change-email", modal)?.addEventListener("click", () => { clearInputs(); stopTimer(); if (generatedOtp) generatedOtp.textContent = "------"; showStage("email"); });
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
            const saved = sessionStorage.getItem(RESET_OTP_SESSION_KEY);
            const expires = Number(sessionStorage.getItem(RESET_OTP_EXPIRES_SESSION_KEY));
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
            localStorage.removeItem(RESET_USER_KEY);
            localStorage.removeItem(RESET_OTP_KEY);
            localStorage.removeItem(RESET_OTP_EXPIRES_KEY);
            sessionStorage.removeItem(RESET_OTP_SESSION_KEY);
            sessionStorage.removeItem(RESET_OTP_EXPIRES_SESSION_KEY);
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
