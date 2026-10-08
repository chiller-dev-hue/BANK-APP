/* =========================================================
   REEN BANK — DASHBOARD / ACCOUNTS / TRANSACTIONS / PROFILE
   Frontend-only state is stored per registered user in localStorage.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const currentUserRaw = localStorage.getItem("reenBankCurrentUser");
    let currentUser = null;

    try {
        currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    } catch {
        currentUser = null;
    }

    if (!currentUser?.id) {
        window.location.href = "./login.html";
        return;
    }

    const getInitials = (name = "") => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "RB";
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return parts.slice(-2).map(part => part[0].toUpperCase()).join("");
    };

    const formatMoney = amount =>
        `₦ ${Number(amount || 0).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    // Overlay amounts follow the Figma copy style: whole naira values
    // without trailing decimal places.
    const formatOverlayAmount = amount =>
        `₦ ${Number(amount || 0).toLocaleString("en-NG", {
            maximumFractionDigits: 0
        })}`;

    const accountStorageKey = `reenBankAccounts_${currentUser.id}`;
    const transactionStorageKey = `reenBankTransactions_${currentUser.id}`;
    const accountNumberKey = `reenBankAccountNumber_${currentUser.id}`;
    const userStorageKey = `reenBankUser_${currentUser.id}`;
    const notificationStorageKey = `reenBankNotifications_${currentUser.id}`;
    const statisticsPeriodKey = `reenBankStatisticsPeriod_${currentUser.id}`;
    const beneficiaryStorageKey = `reenBankBeneficiaries_${currentUser.id}`;
    const ACCOUNT_MAX_BALANCE = 1_000_000_000;
    const balancePeriodKey = `reenBankBalancePeriod_${currentUser.id}`;

    const defaultAccounts = {
        main: { name: "Main Account", balance: 44500 },
        school: { name: "School Savings", balance: 44500 },
        holiday: { name: "Holiday Plan", balance: 44500 }
    };

    const newUserAccounts = {
        main: { name: "Main Account", balance: 0 },
        school: { name: "School Savings", balance: 0 },
        holiday: { name: "Holiday Plan", balance: 0 }
    };

    const defaultTransactions = [
        { name: "Oluwaben Jamin", type: "Bank Transfer", date: "06.Mar.2023 - 09:39", amount: -10000, status: "Pending" },
        { name: "Oluwaben Jamin", type: "Direct Pay", date: "06.Mar.2023 - 09:39", amount: 10000, status: "Completed" },
        { name: "Oluwaben Jamin", type: "Bank Transfer", date: "06.Mar.2023 - 09:39", amount: -10000, status: "Canceled" },
        { name: "Oluwaben Jamin", type: "Credit Card", date: "06.Mar.2023 - 09:39", amount: 10000, status: "Completed" },
        { name: "Oluwaben Jamin", type: "Bank Transfer", date: "06.Mar.2023 - 09:39", amount: -10000, status: "Pending" },
        { name: "Oluwaben Jamin", type: "Direct Pay", date: "06.Mar.2023 - 09:39", amount: 10000, status: "Completed" },
        { name: "Oluwaben Jamin", type: "Bank Transfer", date: "06.Mar.2023 - 09:39", amount: -10000, status: "Canceled" }
    ];

    const readJSON = (key, fallback) => {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    };

    const transactionAmountTextSafe = item =>
        `${Number(item?.amount || 0) >= 0 ? "+" : "-"} ₦ ${Math.abs(Number(item?.amount || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const parseTransactionDate = value => {
        if (!value) return null;
        const text = String(value);
        const match = text.match(/(\d{1,2})[.\-/ ]([A-Za-z]{3,9})[.\-/ ](\d{4})/);
        if (match) {
            const monthNames = {
                jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
                may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
                oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
            };
            const month = monthNames[match[2].toLowerCase()];
            if (month !== undefined) {
                const date = new Date(Number(match[3]), month, Number(match[1]));
                return Number.isNaN(date.getTime()) ? null : date;
            }
        }
        const fallback = new Date(text);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const hasSavedBankState = Boolean(
        localStorage.getItem(accountStorageKey) || localStorage.getItem(transactionStorageKey)
    );
    let accounts = readJSON(accountStorageKey, hasSavedBankState ? defaultAccounts : newUserAccounts);
    let transactions = readJSON(transactionStorageKey, hasSavedBankState ? defaultTransactions : []);

    // Account selection is intentionally empty on every page load. The purple
    // accent only appears after the user explicitly selects an account.
    let selectedAccountKey = null;

    // Older transactions were created before transactions were associated with
    // an account. Keep them usable by assigning them to Main Account once.
    transactions = Array.isArray(transactions)
        ? transactions.map(item => ({ ...item, accountKey: item.accountKey || "main" }))
        : [];
    localStorage.setItem(transactionStorageKey, JSON.stringify(transactions));
    let beneficiaries = readJSON(beneficiaryStorageKey, []);
    if (!Array.isArray(beneficiaries)) beneficiaries = [];
    localStorage.setItem(beneficiaryStorageKey, JSON.stringify(beneficiaries));
    let notifications = readJSON(notificationStorageKey, null);
    if (!Array.isArray(notifications)) {
        notifications = transactions.length ? [{
            id: `seed-${currentUser.id}`,
            message: `A transaction was made: ${transactionAmountTextSafe(transactions[0])}.`,
            createdAt: Date.now(),
            transaction: transactions[0]
        }] : [];
        localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
        localStorage.setItem(beneficiaryStorageKey, JSON.stringify(beneficiaries));
    }

    // Repair incomplete/old saved state without destroying user data.
    accounts = {
        ...(hasSavedBankState ? defaultAccounts : newUserAccounts),
        ...accounts
    };
    Object.keys(defaultAccounts).forEach(key => {
        if (!accounts[key] || typeof accounts[key].balance !== "number") {
            accounts[key] = { ...defaultAccounts[key] };
        }
        accounts[key].maxBalance = ACCOUNT_MAX_BALANCE;
        if (accounts[key].balance > ACCOUNT_MAX_BALANCE) accounts[key].balance = ACCOUNT_MAX_BALANCE;
    });
    Object.values(accounts).forEach(account => {
        if (account && typeof account === "object") {
            account.maxBalance = ACCOUNT_MAX_BALANCE;
            if (typeof account.balance !== "number" || account.balance < 0) account.balance = 0;
            if (account.balance > ACCOUNT_MAX_BALANCE) account.balance = ACCOUNT_MAX_BALANCE;
        }
    });

    localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
    localStorage.setItem(transactionStorageKey, JSON.stringify(transactions));

    const getAccountNumber = () => {
        let number = localStorage.getItem(accountNumberKey);
        if (!number) {
            number = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
            localStorage.setItem(accountNumberKey, number);
        }
        return number;
    };

    const accountNumber = getAccountNumber();

    // Recover profile identity from the per-user record when an older
    // reenBankCurrentUser entry is missing name/email fields.
    const storedUserRecord = readJSON(userStorageKey, null);
    if (storedUserRecord && typeof storedUserRecord === "object") {
        if (!currentUser.name && storedUserRecord.name) currentUser.name = storedUserRecord.name;
        if (!currentUser.email && storedUserRecord.email) currentUser.email = storedUserRecord.email;
        if (!currentUser.phone && storedUserRecord.phone) currentUser.phone = storedUserRecord.phone;
        if (!currentUser.gender && storedUserRecord.gender) currentUser.gender = storedUserRecord.gender;
        localStorage.setItem("reenBankCurrentUser", JSON.stringify(currentUser));
    }

    const initials = getInitials(currentUser.name);

    // ---------------------------------------------------------
    // Shared user/header information
    // ---------------------------------------------------------

    $$("#dashboard-user-name, #dashboard-user-name-mobile").forEach(el => {
        el.textContent = currentUser.name || "Reen Bank User";
    });

    $$("#dashboard-account-number, #dashboard-account-number-mobile").forEach(el => {
        el.textContent = accountNumber;
    });

    // Profile header uses the same shared identity state as Dashboard/Accounts.
    // Keep an explicit fallback so the name/number never disappear if older
    // saved user data is incomplete.
    $$("#dashboard-user-name, #dashboard-user-name-mobile").forEach(el => {
        el.textContent = currentUser.name || "Reen Bank User";
    });
    $$("#dashboard-account-number, #dashboard-account-number-mobile").forEach(el => {
        el.textContent = accountNumber || "1234567890";
    });

    $$("#dashboard-profile-initials, #dashboard-profile-initials-mobile").forEach(el => {
        el.textContent = initials;
    });

    // Profile photo support. Photos are stored per user as a small compressed
    // data URL so they persist after reload/logout without needing a server.
    const profilePhotoKey = `reenBankProfileImage_${currentUser.id}`;
    const getProfilePhoto = () => {
        try { return localStorage.getItem(profilePhotoKey) || ""; } catch { return ""; }
    };

    const applyProfilePhoto = (photo) => {
        const avatarSelectors = [
            "#dashboard-profile-initials",
            "#dashboard-profile-initials-mobile"
        ];
        avatarSelectors.forEach(selector => {
            $$(selector).forEach(el => {
                if (photo) {
                    el.textContent = "";
                    el.style.backgroundImage = `url("${photo}")`;
                    el.style.backgroundSize = "cover";
                    el.style.backgroundPosition = "center";
                    el.classList.add("profile-photo-active");
                } else {
                    el.textContent = initials;
                    el.style.backgroundImage = "";
                    el.classList.remove("profile-photo-active");
                }
            });
        });

        const profileImage = $("#profile-avatar-image");
        const profileInitials = $("#profile-avatar-initials");
        if (profileImage) {
            if (photo) {
                profileImage.src = photo;
                profileImage.classList.remove("hidden");
            } else {
                profileImage.removeAttribute("src");
                profileImage.classList.add("hidden");
            }
        }
        if (profileInitials) {
            profileInitials.textContent = initials;
            profileInitials.classList.toggle("hidden", Boolean(photo));
        }
    };

    const savedProfilePhoto = getProfilePhoto() || currentUser.profileImage || "";
    if (savedProfilePhoto && !getProfilePhoto()) {
        try { localStorage.setItem(profilePhotoKey, savedProfilePhoto); } catch { /* ignore */ }
    }
    applyProfilePhoto(savedProfilePhoto);

    // ---------------------------------------------------------
    // Mobile navigation
    // ---------------------------------------------------------

    const sidebar = $("#dashboard-sidebar");
    const overlay = $("#dashboard-overlay");
    const menuButton = $("#dashboard-menu-button");

    const closeMenu = () => {
        sidebar?.classList.add("-translate-x-full");
        overlay?.classList.add("hidden");
        menuButton?.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
        sidebar?.classList.remove("-translate-x-full");
        overlay?.classList.remove("hidden");
        menuButton?.setAttribute("aria-expanded", "true");
    };

    menuButton?.addEventListener("click", openMenu);
    overlay?.addEventListener("click", closeMenu);
    sidebar?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
            closeActionModal();
            closeLogoutModal();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) closeMenu();
    });

    // ---------------------------------------------------------
    // Modal helpers
    // ---------------------------------------------------------

    const popularBanks = [
        "Access Bank", "Guaranty Trust Bank (GTBank)", "Zenith Bank", "United Bank for Africa (UBA)",
        "First Bank of Nigeria", "Fidelity Bank", "Stanbic IBTC Bank", "Union Bank", "FCMB",
        "Sterling Bank", "Wema Bank", "Ecobank Nigeria", "Polaris Bank", "Keystone Bank",
        "Providus Bank", "Moniepoint", "Opay", "Kuda Bank", "PalmPay", "Jaiz Bank",
        "Unity Bank", "Titan Trust Bank", "Globus Bank", "PremiumTrust Bank", "LOTUS Bank",
        "Optimus Bank", "Signature Bank", "Parallex Bank"
    ];

    let actionModal = null;

    const closeActionModal = () => {
        actionModal?.remove();
        actionModal = null;
        document.body.classList.remove("overflow-hidden");
    };

    // ---------------------------------------------------------
    // Shared success overlay
    // ---------------------------------------------------------
    // Matches the Figma success state: a wide white card, centered
    // message, and one full-width green action button.
    const showSuccessOverlay = ({ message, amount = null, buttonText = "Go Back", onDone = closeActionModal }) => {
        actionModal.innerHTML = `
            <div class="relative z-[1] flex min-h-[480px] w-full max-w-[700px] flex-col items-center justify-center gap-14 rounded-[30px] bg-white px-8 py-12 text-center text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-16">
                <p class="text-xl font-semibold leading-snug text-[#666] sm:text-2xl">${amount ? `<span class="text-primary">${escapeHTML(amount)}</span> ` : ""}${escapeHTML(message)}</p>
                <button type="button" data-success-done class="h-16 w-full max-w-[540px] rounded-xl bg-primary px-6 text-xl font-semibold text-white transition hover:bg-[#2fae80] sm:text-2xl">${escapeHTML(buttonText)}</button>
            </div>`;
        $("[data-success-done]", actionModal)?.addEventListener("click", onDone);
    };

    const getBeneficiaryOptions = () => beneficiaries.length
        ? beneficiaries.map(item => `
            <button type="button" data-beneficiary-id="${escapeHTML(item.id)}" class="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-[#f2fbf8]">
                <span class="truncate text-xs font-semibold text-[#242424]">${escapeHTML(formatTransactionName(item.name))}</span>
                <span class="truncate text-[10px] text-[#888]">${escapeHTML(item.bank)} · ${escapeHTML(item.accountNumber)}</span>
            </button>`).join("")
        : `<p class="px-3 py-3 text-xs text-[#888]">No saved beneficiaries yet.</p>`;

    const saveBeneficiary = beneficiary => {
        const exists = beneficiaries.some(item => item.accountNumber === beneficiary.accountNumber && item.bank === beneficiary.bank);
        if (!exists) {
            beneficiaries.unshift({ ...beneficiary, id: `beneficiary-${Date.now()}` });
            localStorage.setItem(beneficiaryStorageKey, JSON.stringify(beneficiaries));
        }
    };

    const accountLimitError = () => `This account has a maximum balance limit of ${formatOverlayAmount(ACCOUNT_MAX_BALANCE)}. Upgrade to PRO to increase your account limit.`;

    const createActionModal = ({ title, accountKey, action }) => {
        closeActionModal();
        const account = accounts[accountKey];
        if (!account) return;
        const isFund = action === "fund";

        // The overlay is rendered directly into <body> so it is never clipped
        // by dashboard/page containers that use overflow-hidden.
        actionModal = document.createElement("div");
        actionModal.className = "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(51,183,134,.78)_0%,_rgba(51,183,134,.55)_42%,_rgba(212,243,231,.70)_76%,_rgba(255,255,255,.18)_100%)] px-3 py-4 font-poppins backdrop-blur-[3px] sm:px-7 sm:py-8";
        actionModal.setAttribute("aria-hidden", "false");

        if (isFund) {
            actionModal.innerHTML = `
                <div class="relative z-[1] w-full max-w-[540px] max-h-none overflow-hidden rounded-3xl bg-white px-6 py-5 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-7 sm:py-5" role="dialog" aria-modal="true" aria-labelledby="action-title">
                    <h2 id="action-title" class="text-[26px] font-semibold leading-none text-primary sm:text-[30px]">Fund Wallet</h2>

                    <form id="action-form" class="mt-5 flex flex-col" novalidate>
                        <fieldset>
                            <legend class="mb-2 text-sm font-semibold text-[#242424]">Select Payment Method</legend>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#999] px-3 text-xs font-semibold text-[#242424] transition has-[:checked]:border-[#999]">
                                    <input type="radio" name="payment-method" value="Direct Pay" checked class="h-4 w-4 accent-[#E55353]">
                                    <span>Direct Pay</span>
                                </label>
                                <label class="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#999] px-3 text-xs font-semibold text-[#242424] transition has-[:checked]:border-[#999]">
                                    <input type="radio" name="payment-method" value="Credit Card" class="h-4 w-4 accent-[#E55353]">
                                    <span>Credit Card</span>
                                </label>
                            </div>
                        </fieldset>

                        <div id="direct-pay-fields" class="mt-5">
                            <label class="mb-1 block text-xs font-semibold text-[#242424]" for="action-amount">Amount</label>
                            <input id="action-amount" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000" required>
                        </div>

                        <div id="credit-card-fields" class="mt-5 hidden">
                            <label class="mb-1 block text-xs font-semibold text-[#242424]" for="action-card-number">Card Number</label>
                            <input id="action-card-number" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" inputmode="numeric" autocomplete="cc-number" maxlength="19" placeholder="0000 0000 0000 0000">

                            <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="action-card-holder">Card holder name</label>
                            <input id="action-card-holder" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" autocomplete="cc-name" placeholder="Enter card holder name">

                            <div class="mt-2 grid grid-cols-2 gap-3">
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-[#242424]" for="action-card-expiry">Expiry date</label>
                                    <input id="action-card-expiry" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY">
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-[#242424]" for="action-card-cvc">CVC</label>
                                    <input id="action-card-cvc" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="000">
                                </div>
                            </div>

                            <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="credit-card-amount">Amount</label>
                            <input id="credit-card-amount" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000">
                        </div>

                        <p id="action-error" class="mt-2 hidden text-xs font-medium text-[#E55353]" aria-live="polite"></p>
                        <div class="mt-3 grid grid-cols-2 gap-3">
                            <button type="button" data-close-modal class="h-10 w-full rounded-lg bg-[#D2D2D2] px-4 text-base font-semibold text-[#242424] transition hover:bg-[#c7c7c7]">Cancel</button>
                            <button type="submit" class="h-10 w-full rounded-lg bg-primary px-4 text-base font-semibold text-white transition hover:bg-[#2fae80]">Fund</button>
                        </div>
                    </form>
                </div>`;
        } else {
            actionModal.innerHTML = `
                <div class="relative z-[1] w-full max-w-[540px] max-h-none overflow-hidden rounded-3xl bg-white px-6 py-5 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-7 sm:py-5" role="dialog" aria-modal="true" aria-labelledby="action-title">
                    <h2 id="action-title" class="text-[26px] font-semibold leading-none text-primary sm:text-[30px]">Withdraw</h2>

                    <form id="action-form" class="mt-7 flex flex-col" novalidate>
                        <label class="mb-1 block text-xs font-semibold text-[#242424]" for="action-amount">Amount</label>
                        <input id="action-amount" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000" required>

                        <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="withdraw-account-number">Account Number</label>
                        <input id="withdraw-account-number" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" inputmode="numeric" maxlength="10" autocomplete="off" placeholder="00 00 00 00 00" required>

                        <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="withdraw-account-name">Account Name</label>
                        <input id="withdraw-account-name" class="h-10 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" placeholder="Enter account name" autocomplete="off" required>

                        <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="bank-dropdown-trigger">Bank</label>
                        <div class="relative">
                            <input id="withdraw-bank" type="hidden" value="">
                            <button id="bank-dropdown-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" class="flex h-12 w-full items-center justify-between rounded-lg border border-[#999] bg-white px-5 text-left text-base text-[#b8b8b8] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary">
                                <span id="bank-dropdown-label">Bank Name</span>
                                <span class="ml-3 text-xl leading-none text-[#999]">⌄</span>
                            </button>
                            <div id="bank-dropdown-list" class="mt-1 hidden max-h-32 overflow-y-auto rounded-lg border border-[#dce7e2] bg-white p-1 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="listbox" aria-label="Select bank">
                                ${popularBanks.map(bank => `<button type="button" data-bank-value="${escapeHTML(bank)}" role="option" class="block h-9 w-full rounded-md px-3 text-left text-sm text-[#242424] transition hover:bg-[#e8f8f2]">${escapeHTML(bank)}</button>`).join("")}
                            </div>
                        </div>

                        <label class="mb-1 mt-2 block text-xs font-semibold text-[#242424]" for="beneficiary-trigger">Beneficiary</label>
                        <div class="relative">
                            <button id="beneficiary-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" class="flex h-12 w-full items-center justify-between rounded-lg border border-[#999] bg-white px-5 text-left text-base text-[#b8b8b8] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary">
                                <span id="beneficiary-trigger-label">Select saved beneficiary</span>
                                <span class="ml-3 text-xl leading-none text-[#999]">⌄</span>
                            </button>
                            <div id="beneficiary-list" class="mt-1 hidden max-h-24 overflow-y-auto rounded-lg border border-[#dce7e2] bg-white p-1 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="listbox" aria-label="Saved beneficiaries">
                                ${getBeneficiaryOptions()}
                            </div>
                        </div>

                        <label class="mt-2 flex items-center gap-2 text-xs font-medium text-[#555]" for="add-as-beneficiary">
                            <input id="add-as-beneficiary" type="checkbox" class="h-4 w-4 accent-[#33B786]">
                            <span>Save this beneficiary</span>
                        </label>

                        <p id="action-error" class="mt-2 hidden text-xs font-medium text-[#E55353]" aria-live="polite"></p>
                        <div class="mt-3 grid grid-cols-2 gap-3">
                            <button type="button" data-close-modal class="h-10 w-full rounded-lg bg-[#D2D2D2] px-4 text-base font-semibold text-[#242424] transition hover:bg-[#c7c7c7]">Cancel</button>
                            <button type="submit" class="h-10 w-full rounded-lg bg-primary px-4 text-base font-semibold text-white transition hover:bg-[#2fae80]">Withdraw</button>
                        </div>
                    </form>
                </div>`;
        }

        document.body.appendChild(actionModal);
        document.body.classList.add("overflow-hidden");

        const form = $("#action-form", actionModal);
        const amountInput = $("#action-amount", actionModal);
        const error = $("#action-error", actionModal);
        $$('[data-close-modal]', actionModal).forEach(button => button.addEventListener("click", closeActionModal));

        if (isFund) {
            const paymentRadios = $$('input[name="payment-method"]', actionModal);
            const directPayFields = $("#direct-pay-fields", actionModal);
            const creditCardFields = $("#credit-card-fields", actionModal);
            const directAmountInput = $("#action-amount", actionModal);
            const creditAmountInput = $("#credit-card-amount", actionModal);

            const syncFundMethod = () => {
                const selected = $("input[name='payment-method']:checked", actionModal)?.value || "Direct Pay";
                const credit = selected === "Credit Card";
                $$('input[name="payment-method"]', actionModal).forEach(input => {
                    input.closest("label")?.classList.toggle("border-[#999]", input.checked);
                });
                directPayFields?.classList.toggle("hidden", credit);
                creditCardFields?.classList.toggle("hidden", !credit);
                if (directAmountInput) directAmountInput.required = !credit;
                if (creditAmountInput) creditAmountInput.required = credit;
            };

            paymentRadios.forEach(radio => radio.addEventListener("change", syncFundMethod));
            syncFundMethod();

            const cardNumber = $("#action-card-number", actionModal);
            const expiry = $("#action-card-expiry", actionModal);
            const cvc = $("#action-card-cvc", actionModal);
            cardNumber?.addEventListener("input", () => {
                cardNumber.value = cardNumber.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
            });
            expiry?.addEventListener("input", () => {
                const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
                expiry.value = digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
            });
            cvc?.addEventListener("input", () => {
                cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);
            });
        } else {
            const accountNumberInput = $("#withdraw-account-number", actionModal);
            accountNumberInput?.addEventListener("input", () => {
                accountNumberInput.value = accountNumberInput.value.replace(/\D/g, "").slice(0, 10);
            });

            const beneficiaryTrigger = $("#beneficiary-trigger", actionModal);
            const beneficiaryList = $("#beneficiary-list", actionModal);
            const beneficiaryLabel = $("#beneficiary-trigger-label", actionModal);
            const bankInput = $("#withdraw-bank", actionModal);
            const bankTrigger = $("#bank-dropdown-trigger", actionModal);
            const bankList = $("#bank-dropdown-list", actionModal);
            const bankLabel = $("#bank-dropdown-label", actionModal);

            const closePickers = () => {
                bankList?.classList.add("hidden");
                beneficiaryList?.classList.add("hidden");
                bankTrigger?.setAttribute("aria-expanded", "false");
                beneficiaryTrigger?.setAttribute("aria-expanded", "false");
            };

            bankTrigger?.addEventListener("click", () => {
                const opening = bankList?.classList.contains("hidden");
                beneficiaryList?.classList.add("hidden");
                beneficiaryTrigger?.setAttribute("aria-expanded", "false");
                bankList?.classList.toggle("hidden", !opening);
                bankTrigger.setAttribute("aria-expanded", String(opening));
            });

            $$('[data-bank-value]', actionModal).forEach(button => button.addEventListener("click", () => {
                const value = button.dataset.bankValue || "";
                if (bankInput) bankInput.value = value;
                if (bankLabel) {
                    bankLabel.textContent = value || "Bank Name";
                    bankLabel.classList.toggle("text-[#242424]", Boolean(value));
                    bankLabel.classList.toggle("text-[#b8b8b8]", !value);
                }
                bankList?.classList.add("hidden");
                bankTrigger?.setAttribute("aria-expanded", "false");
            }));

            beneficiaryTrigger?.addEventListener("click", () => {
                const opening = beneficiaryList?.classList.contains("hidden");
                bankList?.classList.add("hidden");
                bankTrigger?.setAttribute("aria-expanded", "false");
                beneficiaryList?.classList.toggle("hidden", !opening);
                beneficiaryTrigger.setAttribute("aria-expanded", String(opening));
            });

            $$('[data-beneficiary-id]', actionModal).forEach(button => button.addEventListener("click", () => {
                const item = beneficiaries.find(beneficiary => beneficiary.id === button.dataset.beneficiaryId);
                if (!item) return;
                $("#withdraw-account-number", actionModal).value = item.accountNumber;
                $("#withdraw-account-name", actionModal).value = item.name;
                if (bankInput) bankInput.value = item.bank;
                if (bankLabel) {
                    bankLabel.textContent = item.bank;
                    bankLabel.classList.remove("text-[#b8b8b8]");
                    bankLabel.classList.add("text-[#242424]");
                }
                if (beneficiaryLabel) {
                    beneficiaryLabel.textContent = item.name;
                    beneficiaryLabel.classList.remove("text-[#b8b8b8]");
                    beneficiaryLabel.classList.add("text-[#242424]");
                }
                beneficiaryList?.classList.add("hidden");
                beneficiaryTrigger?.setAttribute("aria-expanded", "false");
            }));

            actionModal?.addEventListener("click", event => {
                if (!bankTrigger?.contains(event.target) && !bankList?.contains(event.target) && !beneficiaryTrigger?.contains(event.target) && !beneficiaryList?.contains(event.target)) {
                    closePickers();
                }
            });
        }

        form?.addEventListener("submit", event => {
            event.preventDefault();
            error.classList.add("hidden");
            const selectedPaymentMethod = isFund
                ? $("input[name='payment-method']:checked", actionModal)?.value || "Direct Pay"
                : "";
            const amount = Number(
                isFund && selectedPaymentMethod === "Credit Card"
                    ? $("#credit-card-amount", actionModal)?.value
                    : amountInput.value
            );

            if (!Number.isFinite(amount) || amount <= 0) {
                error.textContent = "Enter a valid amount greater than zero.";
                error.classList.remove("hidden"); return;
            }

            if (isFund && selectedPaymentMethod === "Credit Card") {
                const cardDigits = $("#action-card-number", actionModal)?.value.replace(/\s/g, "") || "";
                const holder = $("#action-card-holder", actionModal)?.value.trim() || "";
                const expiryValue = $("#action-card-expiry", actionModal)?.value.trim() || "";
                const cvcValue = $("#action-card-cvc", actionModal)?.value.trim() || "";
                if (!/^\d{16}$/.test(cardDigits)) {
                    error.textContent = "Enter a valid 16-digit card number.";
                    error.classList.remove("hidden"); return;
                }
                if (!holder) {
                    error.textContent = "Enter the card holder name.";
                    error.classList.remove("hidden"); return;
                }
                if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryValue)) {
                    error.textContent = "Enter the expiry date as MM/YY.";
                    error.classList.remove("hidden"); return;
                }
                if (!/^\d{3,4}$/.test(cvcValue)) {
                    error.textContent = "Enter a valid CVC.";
                    error.classList.remove("hidden"); return;
                }
            }

            if (!isFund) {
                const accountNumberValue = $("#withdraw-account-number", actionModal).value.trim();
                const accountNameValue = $("#withdraw-account-name", actionModal).value.trim();
                const bankValue = $("#withdraw-bank", actionModal).value;
                if (!/^\d{10}$/.test(accountNumberValue)) {
                    error.textContent = "Account number must be exactly 10 digits.";
                    error.classList.remove("hidden"); return;
                }
                if (!accountNameValue) {
                    error.textContent = "Please enter the account name.";
                    error.classList.remove("hidden"); return;
                }
                if (!bankValue) {
                    error.textContent = "Please select a bank.";
                    error.classList.remove("hidden"); return;
                }
                if (amount > account.balance) {
                    error.textContent = "Insufficient funds for this withdrawal.";
                    error.classList.remove("hidden"); return;
                }

                if ($("#add-as-beneficiary", actionModal)?.checked) {
                    saveBeneficiary({ name: accountNameValue, accountNumber: accountNumberValue, bank: bankValue });
                }

                account.balance -= amount;
                const now = new Date();
                const createdTransaction = {
                    name: accountNameValue,
                    type: "Bank Transfer",
                    date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, ".") + " - " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                    amount: -amount,
                    status: "Completed",
                    accountKey,
                    recipientAccountNumber: accountNumberValue,
                    recipientBank: bankValue
                };
                transactions.unshift(createdTransaction);
                notifications.unshift({ id: `notification-${Date.now()}`, message: `A transaction was made: Withdrawal of ${transactionAmountTextSafe(createdTransaction)}.`, createdAt: Date.now(), transaction: createdTransaction });
                saveState(); renderEverything();
                showSuccessOverlay({ amount: formatOverlayAmount(amount), message: "has been sent to your Bank Account!" });
                return;
            }

            if (account.balance + amount > ACCOUNT_MAX_BALANCE) {
                error.textContent = accountLimitError();
                error.classList.remove("hidden");
                return;
            }

            account.balance += amount;
            const now = new Date();
            const paymentMethod = $("input[name='payment-method']:checked", actionModal)?.value || "Direct Pay";
            const createdTransaction = {
                name: currentUser.name || "Reen Bank User",
                type: paymentMethod,
                date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, ".") + " - " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                amount,
                status: "Completed",
                accountKey
            };
            transactions.unshift(createdTransaction);
            notifications.unshift({ id: `notification-${Date.now()}`, message: `A transaction was made: Funding of ${transactionAmountTextSafe(createdTransaction)}.`, createdAt: Date.now(), transaction: createdTransaction });
            saveState(); renderEverything();
            showSuccessOverlay({ amount: formatOverlayAmount(amount), message: "has been added to your Wallet!" });
        });

        amountInput?.focus();
    };

    // ---------------------------------------------------------
    // Add-account overlay
    // ---------------------------------------------------------
    const showAddAccountModal = () => {
        closeActionModal();
        actionModal = document.createElement("div");
        actionModal.className = "fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_center,_rgba(51,183,134,.78)_0%,_rgba(51,183,134,.55)_42%,_rgba(212,243,231,.70)_76%,_rgba(255,255,255,.18)_100%)] px-4 py-6 font-poppins backdrop-blur-[3px] sm:px-7 sm:py-8";
        actionModal.setAttribute("aria-hidden", "false");

        actionModal.innerHTML = `
            <div class="relative z-[1] w-full max-w-[480px] rounded-3xl bg-white px-7 py-9 text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:min-h-[500px] sm:px-10 sm:py-11" role="dialog" aria-modal="true" aria-labelledby="add-account-title">
                <h2 id="add-account-title" class="text-[30px] font-semibold leading-none text-primary sm:text-[34px]">Add Account</h2>

                <form id="new-account-form" class="mt-9 flex flex-col" novalidate>
                    <label class="mb-2 text-sm font-semibold text-[#242424]" for="new-account-name">Account Name</label>
                    <input id="new-account-name" class="h-12 w-full rounded-lg border border-[#999] bg-white px-4 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" type="text" maxlength="40" placeholder="Enter name" required>

                    <label class="mb-2 mt-6 text-sm font-semibold text-[#242424]" for="new-account-description">Short Description</label>
                    <textarea id="new-account-description" class="min-h-[120px] w-full resize-none rounded-lg border border-[#999] bg-white px-4 py-3 text-sm text-[#242424] outline-none placeholder:text-[#b8b8b8] focus:border-primary focus:ring-1 focus:ring-primary" maxlength="120" placeholder="Description"></textarea>

                    <p id="new-account-error" class="mt-2 hidden text-xs font-medium text-[#E55353]" aria-live="polite"></p>

                    <div class="mt-8 grid grid-cols-2 gap-8">
                        <button type="button" data-close-modal class="h-12 w-full rounded-lg bg-[#D2D2D2] px-4 text-base font-semibold text-[#242424] transition hover:bg-[#c7c7c7]">Cancel</button>
                        <button type="submit" class="h-12 w-full rounded-lg bg-primary px-4 text-base font-semibold text-white transition hover:bg-[#2fae80]">Add</button>
                    </div>
                </form>
            </div>`;

        document.body.appendChild(actionModal);
        document.body.classList.add("overflow-hidden");
        $$('[data-close-modal]', actionModal).forEach(button => button.addEventListener("click", closeActionModal));

        $("#new-account-form", actionModal)?.addEventListener("submit", event => {
            event.preventDefault();
            const name = $("#new-account-name", actionModal).value.trim();
            const description = $("#new-account-description", actionModal).value.trim();
            const error = $("#new-account-error", actionModal);

            if (!name) {
                error.textContent = "Please enter an account name.";
                error.classList.remove("hidden");
                return;
            }

            const key = `custom_${Date.now()}`;
            accounts[key] = { name, description, balance: 0, maxBalance: ACCOUNT_MAX_BALANCE };
            saveState();
            renderEverything();

            actionModal.innerHTML = `
                <div class="relative z-[1] flex w-full max-w-xl flex-col items-center justify-center rounded-3xl bg-white px-6 py-8 text-center text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-10 sm:py-10" role="dialog" aria-modal="true" aria-labelledby="account-created-title">
                    <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4F3E7]">
                        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
                            <img src="../assets/icons/check.svg" alt="Success" class="h-6 w-6 brightness-0 invert">
                        </div>
                    </div>
                    <p id="account-created-title" class="max-w-xl text-base font-semibold leading-snug text-[#666] sm:text-xl">Your <span class="text-primary">${escapeHTML(name)}</span> has been created Successfully!</p>
                    <div class="mt-7 flex w-full max-w-xl flex-col gap-3">
                        <button type="button" data-account-created-done class="h-12 w-full rounded-lg bg-[#D2D2D2] px-5 text-base font-semibold text-[#242424] transition hover:bg-[#c7c7c7]">Go Back</button>
                        <button type="button" data-account-created-fund class="h-12 w-full rounded-lg bg-primary px-5 text-base font-semibold text-white transition hover:bg-[#2fae80]">Fund Account</button>
                    </div>
                </div>`;

            $("[data-account-created-done]", actionModal)?.addEventListener("click", closeActionModal);
            $("[data-account-created-fund]", actionModal)?.addEventListener("click", () => {
                closeActionModal();
                createActionModal({ title: "Fund Account", accountKey: key, action: "fund" });
            });
        });

        $("#new-account-name", actionModal)?.focus();
    };

    // ---------------------------------------------------------
    // State + rendering
    // ---------------------------------------------------------

    const saveState = () => {
        localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
        localStorage.setItem(transactionStorageKey, JSON.stringify(transactions));
        localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
    };

    let dashboardBalancesHidden = false;
    const latestTransactionDate = transactions
        .map(item => parseTransactionDate(item.date))
        .filter(Boolean)
        .sort((a, b) => b - a)[0];
    const defaultStatisticsMonth = monthKey(new Date());
    let selectedStatisticsMonth = readJSON(statisticsPeriodKey, defaultStatisticsMonth);
    if (!String(selectedStatisticsMonth).startsWith(String(new Date().getFullYear()))) {
        selectedStatisticsMonth = monthKey(new Date());
    }
    let selectedBalanceMonth = readJSON(balancePeriodKey, monthKey(new Date()));
    let dashboardPeriodValues = { balance: 0, income: 0, expense: 0 };

    const updateDashboardBalanceVisibility = () => {
        const periodValues = dashboardPeriodValues;
        const currentBalance = $("#dashboard-current-balance");
        const income = $("#dashboard-income");
        const expense = $("#dashboard-expense");
        if (currentBalance) currentBalance.textContent = dashboardBalancesHidden ? "₦ ••••••••" : formatMoney(periodValues.balance);
        if (income) income.textContent = dashboardBalancesHidden ? "₦ ••••••••" : formatMoney(periodValues.income);
        if (expense) expense.textContent = dashboardBalancesHidden ? "₦ ••••••••" : formatMoney(periodValues.expense);

        $$("#dashboard-accounts-container [data-account-balance]").forEach(el => {
            const key = el.dataset.accountBalance;
            el.textContent = dashboardBalancesHidden ? "₦ ••••••••" : (key && accounts[key] ? formatMoney(accounts[key].balance) : el.textContent);
        });

        const button = $("#dashboard-balance-visibility");
        const icon = button ? $("img", button) : null;
        if (button) button.setAttribute("aria-label", dashboardBalancesHidden ? "Show amounts" : "Hide amounts");
        if (icon) icon.src = dashboardBalancesHidden ? "../assets/icons/eye-closed.svg" : "../assets/icons/eye.svg";
    };

    const getMonthTransactions = month => transactions.filter(item => {
        if (item.status === "Canceled") return false;
        const date = parseTransactionDate(item.date);
        return date && monthKey(date) === month;
    });

    const renderStatistics = () => {
        const now = new Date();
        const selectedTransactions = getMonthTransactions(selectedStatisticsMonth);
        const income = selectedTransactions.filter(item => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
        const expense = Math.abs(selectedTransactions.filter(item => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0));
        const scale = Math.max(income, expense, 0);
        const incomeBar = $("#dashboard-income-bar");
        const expenseBar = $("#dashboard-expense-bar");
        const incomeValue = $("#dashboard-stat-income");
        const expenseValue = $("#dashboard-stat-expense");
        if (incomeValue) incomeValue.textContent = formatMoney(income);
        if (expenseValue) expenseValue.textContent = formatMoney(expense);
        if (incomeBar) incomeBar.style.width = scale ? `${(income / scale) * 100}%` : "0%";
        if (expenseBar) expenseBar.style.width = scale ? `${(expense / scale) * 100}%` : "0%";

        const label = $("#dashboard-statistics-period-label");
        const selected = new Date(Number(selectedStatisticsMonth.slice(0,4)), Number(selectedStatisticsMonth.slice(5,7)) - 1, 1);
        if (label) {
            label.textContent = selectedStatisticsMonth === monthKey(now)
                ? "This Month"
                : selected.toLocaleDateString("en-US", { month: "long" });
        }
        localStorage.setItem(statisticsPeriodKey, selectedStatisticsMonth);
    };

    const getPeriodRange = month => {
        const year = Number(month.slice(0, 4));
        const monthIndex = Number(month.slice(5, 7)) - 1;
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        return { start, end };
    };

    const formatPeriodLabel = month => {
        const { start, end } = getPeriodRange(month);
        const fmt = date => date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
        return `${fmt(start)} - ${fmt(end)}`;
    };

    const getBalancePeriodTransactions = month => transactions.filter(item => {
        if (item.status === "Canceled") return false;
        const date = parseTransactionDate(item.date);
        return date && monthKey(date) === month;
    });

    const getHistoricalMainBalance = month => {
        const { end } = getPeriodRange(month);
        const currentMonth = monthKey(new Date());
        if (month === currentMonth) return accounts.main?.balance ?? 0;
        const laterNet = transactions
            .filter(item => item.status !== "Canceled" && item.accountKey === "main")
            .map(item => ({ item, date: parseTransactionDate(item.date) }))
            .filter(({ date }) => date && date > end)
            .reduce((sum, { item }) => sum + Number(item.amount || 0), 0);
        return Math.max(0, (accounts.main?.balance ?? 0) - laterNet);
    };

    const getBalancePeriodValues = month => {
        const periodTransactions = getBalancePeriodTransactions(month);
        const mainTransactions = periodTransactions.filter(item => (item.accountKey || "main") === "main");
        if (!mainTransactions.length) return { balance: 0, income: 0, expense: 0 };
        const income = mainTransactions.filter(item => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount), 0);
        const expense = Math.abs(mainTransactions.filter(item => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0));
        return { balance: getHistoricalMainBalance(month), income, expense };
    };

    const renderBalancePeriodMenu = () => {
        const menu = $("#dashboard-balance-period-menu");
        if (!menu) return;
        const now = new Date();
        const monthKeys = new Set([monthKey(now), ...transactions.map(item => {
            const date = parseTransactionDate(item.date);
            return date ? monthKey(date) : null;
        }).filter(Boolean)]);
        for (let offset = 1; offset < 18; offset += 1) {
            monthKeys.add(monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1)));
        }
        const months = [...monthKeys].sort((a, b) => b.localeCompare(a));
        menu.classList.add("max-h-52", "overflow-y-auto", "[scrollbar-width:none]", "[&::-webkit-scrollbar]:hidden");
        menu.innerHTML = months.map(month => `
            <button type="button" data-balance-month="${month}" class="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-[#555] hover:bg-[#e2f5ee]">${formatPeriodLabel(month)}</button>
        `).join("");
        $$('[data-balance-month]', menu).forEach(button => button.addEventListener("click", () => {
            selectedBalanceMonth = button.dataset.balanceMonth;
            localStorage.setItem(balancePeriodKey, selectedBalanceMonth);
            renderBalances();
            menu.classList.add("hidden");
            $("#dashboard-balance-period")?.setAttribute("aria-expanded", "false");
        }));
    };

    const renderBalances = () => {
        $$('[data-account-balance]').forEach(el => {
            const key = el.dataset.accountBalance;
            if (accounts[key]) el.textContent = formatMoney(accounts[key].balance);
        });

        dashboardPeriodValues = getBalancePeriodValues(selectedBalanceMonth);

        const currentBalance = $("#dashboard-current-balance");
        const incomeEl = $("#dashboard-income");
        const expenseEl = $("#dashboard-expense");
        if (currentBalance) currentBalance.textContent = formatMoney(dashboardPeriodValues.balance);
        if (incomeEl) incomeEl.textContent = formatMoney(dashboardPeriodValues.income);
        if (expenseEl) expenseEl.textContent = formatMoney(dashboardPeriodValues.expense);

        const periodLabel = $("#dashboard-balance-period-label");
        if (periodLabel) periodLabel.textContent = formatPeriodLabel(selectedBalanceMonth);
        updateDashboardBalanceVisibility();
    };

    const transactionStatusClass = status => {
        if (status === "Completed") return "bg-primary text-white";
        if (status === "Canceled") return "bg-[#e55353] text-white";
        return "bg-[#c4c4c4] text-[#444]";
    };

    const transactionAmountText = item =>
        `${item.amount >= 0 ? "+" : "-"} ${Math.abs(Number(item.amount || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Keep transaction names readable without allowing long names to break
    // the date/amount columns. For three or more names, keep the first two
    // complete and abbreviate the third name to its first two letters.
    const formatTransactionName = name => {
        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length <= 2) return parts.join(" ");
        return `${parts[0]} ${parts[1]} ${parts[2].slice(0, 2)}...`;
    };

    const transactionRowHTML = (item, compact = false) => {
        const positive = Number(item.amount) >= 0;
        const signClass = positive ? "bg-[#33B786]" : "bg-danger";
        const amountClass = positive ? "text-primary" : "text-danger";
        const statusClass = transactionStatusClass(item.status);

        if (compact) {
            // Overview uses the same three-column date/amount alignment as Profile.
            return `
                <div class="transaction-row grid h-[34px] min-w-0 min-h-[34px] grid-cols-[minmax(0,1.15fr)_minmax(125px,1fr)_minmax(145px,1.15fr)] items-center gap-x-3 border-b border-[#D8E1DE] py-1">
                    <p class="min-w-0 truncate whitespace-nowrap text-[11px] font-normal leading-tight text-[#777]">${escapeHTML(formatTransactionName(item.name))}</p>
                    <p class="whitespace-nowrap text-center text-[11px] font-normal leading-tight text-[#777]">${escapeHTML(item.date)}</p>
                    <p class="whitespace-nowrap text-right text-[11px] font-semibold leading-tight ${amountClass}">${transactionAmountText(item)}</p>
                </div>`;
        }

        return `
            <div class="grid min-w-0 grid-cols-[28px_minmax(90px,1.1fr)_minmax(75px,.9fr)_minmax(115px,1fr)_minmax(105px,.9fr)_minmax(90px,.8fr)] items-center gap-x-3 border-b border-[#D8E1DE] py-[4px] min-h-[38px] max-md:min-h-[40px] xl:grid-cols-[32px_minmax(130px,1.15fr)_minmax(105px,.95fr)_minmax(145px,1fr)_minmax(120px,.9fr)_150px] xl:gap-x-4" data-transaction-search="${escapeHTML(`${item.name} ${item.type} ${item.date} ${item.status} ${item.amount}`)}">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${signClass}">
                    <img src="../assets/images/${positive ? "add.png" : "subtract.png"}" alt="${positive ? "Incoming transaction" : "Outgoing transaction"}" class="h-full w-full object-contain">
                </div>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.name)}</p>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.type)}</p>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.date)}</p>
                <p data-cell="true" class="whitespace-nowrap text-[11px] font-bold ${amountClass}">${transactionAmountText(item)}</p>
                <span data-cell="true" class="flex h-[34px] w-full max-w-[178px] items-center justify-center rounded-lg text-[11px] font-medium ${statusClass}">${escapeHTML(item.status)}</span>
            </div>`;
    };

    const getSearchValue = selector => $(selector)?.value.trim().toLowerCase() || "";

    const filterTransactions = (query) => {
        if (!query) return transactions;
        return transactions.filter(item => `${item.name} ${item.type} ${item.date} ${item.status} ${item.amount}`.toLowerCase().includes(query));
    };

    const updateAccountSelectionUI = () => {
        $$('[data-account-card]').forEach(card => {
            const isSelected = card.dataset.accountKey === selectedAccountKey;
            card.classList.toggle("border-l-[#452080]", isSelected);
            card.setAttribute("aria-pressed", String(isSelected));
        });
    };

    const bindAccountSelection = (root = document) => {
        $$('[data-account-card]', root).forEach(card => {
            if (card.dataset.selectionBound) return;
            card.dataset.selectionBound = "true";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-pressed", "false");

            const select = () => {
                const key = card.dataset.accountKey;
                selectedAccountKey = selectedAccountKey === key ? null : key;
                updateAccountSelectionUI();
                renderTransactions();
            };

            card.addEventListener("click", event => {
                if (event.target.closest("button, a, input, select, textarea")) return;
                select();
            });
            card.addEventListener("keydown", event => {
                if (event.target !== card) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select();
                }
            });
        });
        updateAccountSelectionUI();
    };

    const renderTransactionAccounts = () => {
        const container = $("#transaction-accounts-container");
        if (!container) return;

        container.innerHTML = Object.entries(accounts).map(([key, account]) => `
            <article class="h-[120px] min-h-[120px] w-[230px] min-w-[230px] shrink-0 cursor-pointer rounded-xl border-l-[6px] border-transparent bg-[#D4F3E7] px-6 py-5 transition-[border-color,box-shadow] duration-150" data-account-card data-account-key="${escapeHTML(key)}">
                <div class="flex items-center justify-between gap-4">
                    <p class="min-w-0 truncate text-xs font-semibold text-[#452080]">${escapeHTML(account.name)}</p>
                    <button type="button" data-toggle-transaction-balance data-account-key="${escapeHTML(key)}" aria-label="Hide balance" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                        <img src="../assets/icons/eye.svg" alt="" class="h-4 w-4 opacity-70">
                    </button>
                </div>
                <h2 data-transaction-account-balance="${escapeHTML(key)}" class="mt-2 min-w-0 whitespace-nowrap text-lg font-bold leading-none tracking-tight text-[#111] sm:text-xl">${formatMoney(account.balance)}</h2>
            </article>
        `).join("");

        $$('[data-toggle-transaction-balance]', container).forEach(button => {
            const key = button.dataset.accountKey;
            const balanceElement = $(`[data-transaction-account-balance="${key}"]`, container);
            const icon = $("img", button);
            let visible = true;

            button.addEventListener("click", event => {
                event.stopPropagation();
                visible = !visible;
                balanceElement.textContent = visible ? formatMoney(accounts[key]?.balance ?? 0) : "₦ ••••••••";
                button.setAttribute("aria-label", visible ? "Hide balance" : "Show balance");
                icon.src = visible ? "../assets/icons/eye.svg" : "../assets/icons/eye-closed.svg";
            });
        });

        bindAccountSelection(container);
    };

    const renderTransactions = () => {
        const dashboardList = $("#dashboard-transactions-list");
        const dashboardSearch = getSearchValue("#dashboard-transaction-search");
        const accountsSearch = getSearchValue("#accounts-transaction-search");
        const isAccountsPage = Boolean($("#accounts-container"));
        const isTransactionsPage = Boolean($("#transaction-accounts-container"));

        if (dashboardList) {
            // Accounts page transactions are shown only after an account is selected.
            const query = isAccountsPage ? accountsSearch : dashboardSearch;
            const matches = filterTransactions(query);
            const scopedMatches = selectedAccountKey
                ? matches.filter(item => item.accountKey === selectedAccountKey)
                : matches;
            const visibleItems = query ? scopedMatches : scopedMatches.slice(0, 7);
            dashboardList.innerHTML = visibleItems.map(item => transactionRowHTML(item, !isAccountsPage)).join("") ||
                `<p class="py-8 text-center text-sm text-[#777]">No matching transactions found.</p>`;
        }

        if (isTransactionsPage) {
            const fullList = $("#full-transactions-list");
            if (fullList) {
                const searchInput = $$('input[type="search"]').find(input => input !== $("#dashboard-transaction-search"));
                const query = searchInput?.value.trim().toLowerCase() || "";
                const selectedMatches = selectedAccountKey
                    ? filterTransactions(query).filter(item => item.accountKey === selectedAccountKey)
                    : filterTransactions(query);
                // The transaction page is the full transaction history.
                // The first seven rows are engineered to fit the viewport; older rows
                // remain accessible through the transaction-list scroll area.
                const visibleTransactions = selectedMatches;
                fullList.innerHTML = visibleTransactions.map(item => transactionRowHTML(item)).join("") ||
                    `<p class="py-8 text-center text-sm text-[#777]">No transactions found.</p>`;
            }
        }

        const profileList = $("#profile-transactions-list");
        const profileSearch = getSearchValue("#profile-transaction-search");
        if (profileList) {
            const profileMatches = filterTransactions(profileSearch);
            const profileItems = profileSearch ? profileMatches : profileMatches.slice(0, 7);
            profileList.innerHTML = profileItems.map(item => `
                <div class="grid min-w-0 grid-cols-[minmax(0,1.15fr)_minmax(125px,1fr)_minmax(145px,1.15fr)] items-center gap-x-3 border-b border-[#D8E1DE] py-3">
                    <p class="min-w-0 whitespace-nowrap text-[11px] font-normal leading-tight text-[#777]">${escapeHTML(formatTransactionName(item.name))}</p>
                    <p class="whitespace-nowrap text-[11px] font-normal leading-tight text-[#777] text-center">${escapeHTML(item.date)}</p>
                    <p class="whitespace-nowrap text-right text-[11px] font-semibold leading-tight ${Number(item.amount) >= 0 ? "text-primary" : "text-danger"}">${transactionAmountText(item)}</p>
                </div>
            `).join("") || `<p class="py-6 text-sm text-[#777]">No transactions found.</p>`;
        }
    };

const renderCustomAccounts = () => {
  const containers = [
    $("#accounts-container"),
    $("#dashboard-accounts-container")
  ].filter(Boolean);

  if (!containers.length) return;

  const customEntries = Object.entries(accounts).filter(
    ([key]) => !["main", "school", "holiday"].includes(key)
  );

  containers.forEach(accountsContainer => {
    $$(".custom-account-card", accountsContainer).forEach(card => card.remove());

    const addAccountCard = accountsContainer.querySelector("[data-add-account-card]");
    const isDashboard = accountsContainer.id === "dashboard-accounts-container";

    customEntries.forEach(([key, account]) => {
      account.maxBalance = ACCOUNT_MAX_BALANCE;
      const card = document.createElement("article");
      card.dataset.accountCard = "";
      card.dataset.accountKey = key;
      card.className = isDashboard
        ? "custom-account-card flex h-[100px] min-h-[100px] w-[230px] min-w-[230px] shrink-0 cursor-pointer flex-col justify-center gap-3 rounded-xl border-l-[6px] border-transparent bg-[#D4F3E7] px-4 py-3 transition-[border-color,box-shadow] duration-150"
        : "custom-account-card flex reen-account-card-138 w-[220px] min-w-[220px] shrink-0 cursor-pointer flex-col justify-between rounded-xl border-l-[6px] border-transparent bg-[#D4F3E7] p-4 transition-[border-color,box-shadow] duration-150";

      if (isDashboard) {
        card.innerHTML = `
          <div class="flex min-w-0 items-center gap-3">
            <p class="min-w-0 truncate text-xs font-semibold text-[#452080]">${escapeHTML(account.name)}</p>
          </div>
          <h2 data-account-balance="${escapeHTML(key)}" class="w-full truncate text-left text-sm font-bold leading-none text-[#111]">${formatMoney(account.balance)}</h2>
        `;
      } else {
        card.innerHTML = `
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-3">
              <p class="min-w-0 truncate text-sm font-semibold text-[#452080]">${escapeHTML(account.name)}</p>
              <button type="button" data-toggle-account-balance class="flex h-5 w-5 shrink-0 items-center justify-center" aria-label="Toggle ${escapeHTML(account.name)} balance">
                <img src="../assets/icons/eye.svg" alt="" class="h-4 w-4 opacity-70">
              </button>
            </div>
            <h2 data-account-balance="${escapeHTML(key)}" class="mt-4 w-full truncate text-left text-lg font-bold leading-none text-[#111]">${formatMoney(account.balance)}</h2>
          </div>
          <div class="flex gap-2">
            <button type="button" data-account-action="fund" data-account="${escapeHTML(key)}" class="min-w-0 flex-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-white">Fund</button>
            <button type="button" data-account-action="withdraw" data-account="${escapeHTML(key)}" class="min-w-0 flex-1 rounded-md bg-[#D0D0D0] px-2 py-1.5 text-[11px] font-semibold text-[#333]">Withdraw</button>
          </div>
        `;
      }

      if (addAccountCard) accountsContainer.insertBefore(card, addAccountCard);
      else accountsContainer.appendChild(card);
    });

    if (addAccountCard) accountsContainer.appendChild(addAccountCard);
    bindAccountSelection(accountsContainer);
    $$('[data-add-account-button]', accountsContainer).forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", showAddAccountModal);
    });
  });

  bindAccountControls();
  renderBalances();
};
    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        }[char]));

    const bindAccountControls = () => {
        $$("[data-account-action]").forEach(button => {
            if (button.dataset.bound) return;
            button.dataset.bound = "true";
            button.addEventListener("click", () => {
                createActionModal({
                    title: button.dataset.accountAction === "fund" ? "Fund Account" : "Withdraw Money",
                    accountKey: button.dataset.account,
                    action: button.dataset.accountAction
                });
            });
        });

        $$("[data-toggle-account-balance]").forEach(button => {
            if (button.dataset.bound) return;
            button.dataset.bound = "true";

            const balanceElement = button.closest("div")?.nextElementSibling;
            const key = balanceElement?.dataset.accountBalance;
            if (!key) return;

            let visible = !dashboardBalancesHidden;
            const icon = $("img", button);
            if (icon) icon.src = visible ? "../assets/icons/eye.svg" : "../assets/icons/eye-closed.svg";
            button.setAttribute("aria-label", visible ? "Hide balance" : "Show balance");
            button.addEventListener("click", () => {
                visible = !visible;
                balanceElement.textContent = visible ? formatMoney(accounts[key]?.balance ?? 0) : "₦ ••••••••";
                button.setAttribute("aria-label", visible ? "Hide balance" : "Show balance");
                if (icon) icon.src = visible ? "../assets/icons/eye.svg" : "../assets/icons/eye-closed.svg";
            });
        });
    };

    const renderEverything = () => {
        renderBalances();
        renderTransactions();
        renderCustomAccounts();
        renderTransactionAccounts();
    };

    // ---------------------------------------------------------
    // Dashboard controls: balance visibility, statistics, search, notifications
    // ---------------------------------------------------------

    const renderStatisticsMenu = () => {
        const menu = $("#dashboard-statistics-period-menu");
        if (!menu) return;
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, index) => {
            const date = new Date(now.getFullYear(), index, 1);
            return {
                key: monthKey(date),
                label: date.toLocaleDateString("en-US", { month: "long" })
            };
        });

        menu.classList.add("h-28", "max-h-28", "overflow-y-auto", "[scrollbar-width:none]", "[&::-webkit-scrollbar]:hidden");
        menu.innerHTML = months.map(month => `
            <button type="button" data-statistics-month="${month.key}" class="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-[#555] hover:bg-[#e2f5ee]">${month.label}</button>
        `).join("");
        $$('[data-statistics-month]', menu).forEach(button => button.addEventListener("click", () => {
            selectedStatisticsMonth = button.dataset.statisticsMonth;
            renderStatistics();
            menu.classList.add("hidden");
            $("#dashboard-statistics-period")?.setAttribute("aria-expanded", "false");
        }));
    };

    // ---------------------------------------------------------
    // Notification overlay
    // ---------------------------------------------------------
    // Build notification text from the transaction object so the
    // amount can use the same green/red treatment as the Figma.
    const notificationHTML = item => {
        const transaction = item?.transaction;
        if (!transaction) {
            return `<div class="border-b border-[#dedede] px-1.5 py-2 text-[11px] leading-4 text-[#666] last:border-b-0">${escapeHTML(item?.message || "Notification")}</div>`;
        }

        const amount = `₦${Math.abs(Number(transaction.amount || 0)).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
        const amountClass = Number(transaction.amount) >= 0 ? "text-primary" : "text-danger";
        const name = escapeHTML(formatTransactionName(transaction.name || "User"));

        let message;
        if (Number(transaction.amount) < 0) {
            message = `You sent <span class="font-semibold ${amountClass}">${amount}</span> to ${name}`;
        } else if (transaction.type === "Bank Transfer") {
            message = `${name} sent <span class="font-semibold ${amountClass}">${amount}</span> to you`;
        } else {
            message = `You added <span class="font-semibold ${amountClass}">${amount}</span> to your Account`;
        }

        return `<div class="border-b border-[#dedede] px-1.5 py-2 text-[11px] leading-4 text-[#666] last:border-b-0">${message}</div>`;
    };

    const renderNotifications = () => {
        const dot = $("#dashboard-notification-dot");
        const list = $("#dashboard-notification-list");
        if (dot) dot.classList.toggle("hidden", notifications.length === 0);
        if (list) {
            list.classList.add("max-h-40", "overflow-y-auto", "[scrollbar-width:none]", "[&::-webkit-scrollbar]:hidden");
            list.innerHTML = notifications.length
                ? notifications.map(notificationHTML).join("")
                : `<p class="px-1.5 py-3 text-xs text-[#888]">No notifications.</p>`;
        }
    };

    const setupDashboardControls = () => {
        const visibilityButton = $("#dashboard-balance-visibility");
        visibilityButton?.addEventListener("click", () => {
            dashboardBalancesHidden = !dashboardBalancesHidden;
            renderBalances();
        });

        const balancePeriodButton = $("#dashboard-balance-period");
        const balancePeriodMenu = $("#dashboard-balance-period-menu");
        balancePeriodButton?.addEventListener("click", event => {
            event.stopPropagation();
            balancePeriodMenu?.classList.toggle("hidden");
            balancePeriodButton.setAttribute("aria-expanded", String(!balancePeriodMenu?.classList.contains("hidden")));
        });
        renderBalancePeriodMenu();

        const statisticsButton = $("#dashboard-statistics-period");
        const statisticsMenu = $("#dashboard-statistics-period-menu");
        statisticsButton?.addEventListener("click", event => {
            event.stopPropagation();
            statisticsMenu?.classList.toggle("hidden");
            statisticsButton.setAttribute("aria-expanded", String(!statisticsMenu?.classList.contains("hidden")));
        });
        renderStatisticsMenu();

        const notificationButton = $("#dashboard-notification-button");
        const notificationPanel = $("#dashboard-notification-panel");
        notificationButton?.addEventListener("click", event => {
            event.stopPropagation();
            notificationPanel?.classList.toggle("hidden");
            notificationButton.setAttribute("aria-expanded", String(!notificationPanel?.classList.contains("hidden")));
        });
        $("#dashboard-clear-notifications")?.addEventListener("click", () => {
            notifications = [];
            saveState();
            renderNotifications();
        });
        document.addEventListener("click", event => {
            if (!notificationPanel?.contains(event.target) && event.target !== notificationButton) {
                notificationPanel?.classList.add("hidden");
                notificationButton?.setAttribute("aria-expanded", "false");
            }
            if (!statisticsMenu?.contains(event.target) && event.target !== statisticsButton) {
                statisticsMenu?.classList.add("hidden");
                statisticsButton?.setAttribute("aria-expanded", "false");
            }
            if (!balancePeriodMenu?.contains(event.target) && event.target !== balancePeriodButton) {
                balancePeriodMenu?.classList.add("hidden");
                balancePeriodButton?.setAttribute("aria-expanded", "false");
            }
        });

        renderNotifications();
    };

    // ---------------------------------------------------------
    // Account actions
    // ---------------------------------------------------------

    $("#add-account-button")?.addEventListener("click", showAddAccountModal);
    $$('[data-dashboard-add-account]').forEach(button => button.addEventListener("click", showAddAccountModal));
    bindAccountControls();
    bindAccountSelection($("#accounts-container") || document);

    // Transaction page balance toggles
    $$("[data-toggle-transaction-balance]").forEach(button => {
        if (button.dataset.bound) return;
        button.dataset.bound = "true";

        const balanceElement = button.closest("div")?.nextElementSibling;
        const key = balanceElement?.dataset.accountBalance;
        if (!key) return;

        let visible = true;
        const icon = $("img", button);
        if (icon) icon.src = "../assets/icons/eye.svg";
        button.setAttribute("aria-label", "Hide balance");
        button.addEventListener("click", () => {
            visible = !visible;
            balanceElement.textContent = visible
                ? formatMoney(accounts[key]?.balance ?? 0)
                : "₦ ••••••••";

            button.setAttribute("aria-label", visible ? "Hide balance" : "Show balance");
            if (icon) icon.src = visible
                ? "../assets/icons/eye.svg"
                : "../assets/icons/eye-closed.svg";
        });
    });

    // ---------------------------------------------------------
    // Search on transactions page
    // ---------------------------------------------------------

    const searchInputs = $$('input[type="search"]');
    searchInputs.forEach(input => {
        if (input.dataset.transactionSearchBound) return;
        input.dataset.transactionSearchBound = "true";

        // Accounts search -> Accounts transaction table.
        if (input.id === "accounts-transaction-search") {
            input.addEventListener("input", () => {
                renderTransactions();
                const target = $(input.dataset.transactionTarget || "#dashboard-transactions-list");
                if (target) target.classList.remove("opacity-50");
            });
            input.addEventListener("search", renderTransactions);
            return;
        }

        input.addEventListener("input", renderTransactions);
        input.addEventListener("search", renderTransactions);
    });

    // ---------------------------------------------------------
    // Logout
    // ---------------------------------------------------------

    let logoutOverlay = $("#logout-overlay");
    let logoutModal = $("#logout-modal");
    let cancelLogout = $("#cancel-logout");
    let confirmLogout = $("#confirm-logout");

    // Older pages may not contain the confirmation markup. Build it once so
    // the sidebar Logout button always works on every authenticated page.
    if (!logoutOverlay) {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="logout-overlay" class="fixed inset-0 z-[9999] hidden flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_center,_rgba(51,183,134,.78)_0%,_rgba(51,183,134,.55)_42%,_rgba(212,243,231,.70)_76%,_rgba(255,255,255,.18)_100%)] px-4 py-6 font-poppins backdrop-blur-[3px] sm:px-7 sm:py-8" aria-hidden="true">
                <div id="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" class="relative z-[1] flex min-h-[320px] w-full max-w-xl flex-col items-center justify-center gap-12 rounded-[30px] bg-white px-8 py-10 text-center text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] sm:px-12">
                    <h2 id="logout-title" class="text-xl font-semibold leading-snug text-[#666] sm:text-2xl">Are you sure you want to Logout?</h2>
                    <div class="grid w-full max-w-[400px] grid-cols-2 gap-8">
                        <button id="cancel-logout" type="button" class="h-14 w-full rounded-xl bg-[#D2D2D2] px-5 text-lg font-semibold text-[#242424] transition hover:bg-[#c7c7c7]">Cancel</button>
                        <button id="confirm-logout" type="button" class="h-14 w-full rounded-xl bg-primary px-5 text-lg font-semibold text-white transition hover:bg-[#2fae80]">Logout</button>
                    </div>
                </div>
            </div>`);
        logoutOverlay = $("#logout-overlay");
        logoutModal = $("#logout-modal");
        cancelLogout = $("#cancel-logout");
        confirmLogout = $("#confirm-logout");
    }

    const logoutButtons = $$("#logout-button");

    const openLogoutModal = () => {
        if (!logoutOverlay) return;
        logoutOverlay.classList.remove("hidden");
        logoutOverlay.classList.add("flex");
        logoutOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("overflow-hidden");
    };

    const closeLogoutModal = () => {
        if (!logoutOverlay) return;
        logoutOverlay.classList.add("hidden");
        logoutOverlay.classList.remove("flex");
        logoutOverlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("overflow-hidden");
    };

    logoutButtons.forEach(button => button.addEventListener("click", openLogoutModal));
    cancelLogout?.addEventListener("click", closeLogoutModal);
    logoutOverlay?.addEventListener("click", event => {
        if (event.target === logoutOverlay) closeLogoutModal();
    });
    logoutModal?.addEventListener("click", event => event.stopPropagation());

    confirmLogout?.addEventListener("click", () => {
        localStorage.removeItem("reenBankCurrentUser");
        localStorage.removeItem("reenBankLoggedIn");
        window.location.href = "./index.html";
    });

    // ---------------------------------------------------------
    // Profile page
    // ---------------------------------------------------------

    const profileForm = $("#profile-form");
    const profileNameDisplay = $("#profile-name-display");
    const profileAvatarInitials = $("#profile-avatar-initials");
    const profileEmailInput = $("#profile-email");
    const profilePhoneInput = $("#profile-phone");
    const profileGenderInput = $("#profile-gender");
    const profileMessage = $("#profile-message");
    const profileSaveButton = $("#profile-save-changes");
    const profileBalance = $("#profile-main-balance");
    const profileBalanceToggle = $("#profile-balance-toggle");

    if (profileForm) {
        const nameInput = $("#profile-name");
        const accountInput = $("#profile-account");

        if (nameInput) nameInput.value = currentUser.name || "";
        if (accountInput) accountInput.value = accountNumber;
        if (profileEmailInput) profileEmailInput.value = currentUser.email || "";
        if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || "";
        if (profileGenderInput) profileGenderInput.value = currentUser.gender || "";

        const updateProfileUI = () => {
            const nextInitials = getInitials(currentUser.name);
            if (profileNameDisplay) profileNameDisplay.textContent = currentUser.name || "Reen Bank User";
            if (profileAvatarInitials) profileAvatarInitials.textContent = nextInitials;
            applyProfilePhoto(getProfilePhoto());
            if (profileEmailInput) profileEmailInput.value = currentUser.email || "";
            if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || "";
            if (profileGenderInput) profileGenderInput.value = currentUser.gender || "";
            $$("#dashboard-user-name, #dashboard-user-name-mobile").forEach(el => el.textContent = currentUser.name || "Reen Bank User");
            // Re-apply the saved photo last. Older profile updates were forcing
            // the initials back on top of the image after applyProfilePhoto().
            applyProfilePhoto(getProfilePhoto());
        };

        updateProfileUI();

        profileForm.addEventListener("submit", event => {
            event.preventDefault();

            const phone = profilePhoneInput?.value.trim() || "";
            const gender = profileGenderInput?.value || "";

            // Phone is optional, but if provided it must contain a sensible
            // phone number rather than random letters/symbols.
            if (phone && !/^[+0-9][0-9\s().-]{6,14}$/.test(phone)) {
                if (profileMessage) {
                    profileMessage.textContent = "Please enter a valid phone number.";
                    profileMessage.className = "profile-message profile-message-error";
                }
                profilePhoneInput?.focus();
                return;
            }

            currentUser.phone = phone;
            currentUser.gender = gender;
            localStorage.setItem("reenBankCurrentUser", JSON.stringify(currentUser));

            // Update the registered user record as well as the logged-in
            // session, so the changes survive a future logout/login.
            const registeredUserMatch = String(currentUser.id || "").match(/^user(\d+)$/);
            if (registeredUserMatch) {
                const registeredKey = `user${registeredUserMatch[1]}`;
                const registeredUser = readJSON(registeredKey, null);
                if (registeredUser) {
                    registeredUser.phone = phone;
                    registeredUser.gender = gender;
                    localStorage.setItem(registeredKey, JSON.stringify(registeredUser));
                }
            }

            // Keep the separate per-user profile cache in sync for older
            // versions of the project that already created one.
            const storedUser = readJSON(userStorageKey, null);
            if (storedUser) {
                storedUser.phone = phone;
                storedUser.gender = gender;
                localStorage.setItem(userStorageKey, JSON.stringify(storedUser));
            } else {
                localStorage.setItem(userStorageKey, JSON.stringify({
                    id: currentUser.id,
                    name: currentUser.name || "",
                    email: currentUser.email || "",
                    phone,
                    gender
                }));
            }

            updateProfileUI();
            if (profileMessage) {
                profileMessage.textContent = "Your profile details have been saved successfully.";
                profileMessage.className = "profile-message profile-message-success";
            }

            if (profileSaveButton) {
                const original = profileSaveButton.textContent.trim();
                profileSaveButton.textContent = "Saved ✓";
                setTimeout(() => { profileSaveButton.textContent = original || "Save Changes"; }, 1800);
            }
        });

        const profileAvatarButton = $("#profile-avatar-button");
        const profilePhotoInput = $("#profile-photo-input");

        profileAvatarButton?.addEventListener("click", () => profilePhotoInput?.click());

        profilePhotoInput?.addEventListener("change", event => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                if (profileMessage) {
                    profileMessage.textContent = "Please choose a JPG, PNG, or WebP image.";
                    profileMessage.className = "profile-message profile-message-error";
                }
                event.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const source = new Image();
                source.onload = () => {
                    const maxSize = 512;
                    const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(source.width * scale));
                    canvas.height = Math.max(1, Math.round(source.height * scale));
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

                    const compressed = canvas.toDataURL("image/jpeg", 0.84);

                    try {
                        localStorage.setItem(profilePhotoKey, compressed);
                        applyProfilePhoto(compressed);

                        // Keep a copy in the registered user record so the
                        // photo follows the account when the user logs back in.
                        const registeredMatch = String(currentUser.id || "").match(/^user(\d+)$/);
                        if (registeredMatch) {
                            const registeredKey = `user${registeredMatch[1]}`;
                            const registeredUser = readJSON(registeredKey, null);
                            if (registeredUser) {
                                registeredUser.profileImage = compressed;
                                localStorage.setItem(registeredKey, JSON.stringify(registeredUser));
                            }
                        }

                        currentUser.profileImage = compressed;
                        localStorage.setItem("reenBankCurrentUser", JSON.stringify(currentUser));

                        if (profileMessage) {
                            profileMessage.textContent = "Profile photo updated successfully.";
                            profileMessage.className = "profile-message profile-message-success";
                        }
                    } catch (error) {
                        if (profileMessage) {
                            profileMessage.textContent = "This image is too large to save. Please choose a smaller photo.";
                            profileMessage.className = "profile-message profile-message-error";
                        }
                    }
                };
                source.onerror = () => {
                    if (profileMessage) {
                        profileMessage.textContent = "We couldn't read that image. Please try another one.";
                        profileMessage.className = "profile-message profile-message-error";
                    }
                };
                source.src = reader.result;
            };
            reader.readAsDataURL(file);
            event.target.value = "";
        });
    }

    if (profilePhoneInput && !profilePhoneInput.value) profilePhoneInput.value = currentUser.phone || "";
    if (profileGenderInput && !profileGenderInput.value) profileGenderInput.value = currentUser.gender || "";

    if (profileBalance) {
        profileBalance.dataset.hidden = "false";
        profileBalance.textContent = formatMoney(accounts.main.balance);
    }
    if (profileBalanceToggle) {
        profileBalanceToggle.setAttribute("aria-label", "Hide balance");
        const icon = $("img", profileBalanceToggle);
        if (icon) icon.src = "../assets/icons/eye.svg";
    }
    profileBalanceToggle?.addEventListener("click", () => {
        const hidden = profileBalance?.dataset.hidden === "true";
        if (!profileBalance) return;
        const nextHidden = !hidden;
        profileBalance.dataset.hidden = nextHidden ? "true" : "false";
        profileBalance.textContent = nextHidden ? "₦ ••••••••" : formatMoney(accounts.main.balance);
        profileBalanceToggle.setAttribute("aria-label", nextHidden ? "Show balance" : "Hide balance");
        const icon = $("img", profileBalanceToggle);
        // Open eye = amount visible. Closed/slashed eye = amount hidden.
        if (icon) icon.src = nextHidden ? "../assets/icons/eye-closed.svg" : "../assets/icons/eye.svg";
    });

    async function hashPassword(password) {
        if (!window.crypto?.subtle) {
            // Development fallback for environments without Web Crypto.
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                hash = (hash << 5) - hash + password.charCodeAt(i);
                hash |= 0;
            }
            return `fallback-${Math.abs(hash)}`;
        }

        const data = new TextEncoder().encode(password);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(digest))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    if ($("#accounts-container") || $("#transaction-accounts-container")) {
        selectedAccountKey = "main";
    }

    setupDashboardControls();
    renderEverything();
    renderStatistics();
    renderNotifications();

    // Keep current-month balance/statistics tied to real time. Newly created
    // transactions are picked up without requiring a page refresh.
    window.setInterval(() => {
        const currentMonth = monthKey(new Date());
        if (selectedBalanceMonth === currentMonth) renderBalances();
        if (selectedStatisticsMonth === currentMonth) renderStatistics();
    }, 60_000);
});
