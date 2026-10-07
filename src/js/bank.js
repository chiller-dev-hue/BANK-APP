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

    const accountStorageKey = `reenBankAccounts_${currentUser.id}`;
    const transactionStorageKey = `reenBankTransactions_${currentUser.id}`;
    const accountNumberKey = `reenBankAccountNumber_${currentUser.id}`;
    const userStorageKey = `reenBankUser_${currentUser.id}`;
    const notificationStorageKey = `reenBankNotifications_${currentUser.id}`;
    const statisticsPeriodKey = `reenBankStatisticsPeriod_${currentUser.id}`;
    const beneficiaryStorageKey = `reenBankBeneficiaries_${currentUser.id}`;

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
        "Providus Bank", "Moniepoint", "Opay", "Kuda Bank"
    ];

    let actionModal = null;

    const closeActionModal = () => {
        actionModal?.remove();
        actionModal = null;
        document.body.classList.remove("overflow-hidden");
    };

    const showSuccessOverlay = ({ message, amount = null, buttonText = "Go Back", onDone = closeActionModal }) => {
        actionModal.innerHTML = `
            <div class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] reen-overlay-card-success">
                <div class="reen-success-tick" aria-hidden="true"><img src="../assets/icons/check.svg" alt=""></div>
                <p class="reen-success-message">${amount ? `<span>${escapeHTML(amount)}</span> ` : ""}${escapeHTML(message)}</p>
                <button type="button" data-success-done class="reen-overlay-primary reen-success-button">${escapeHTML(buttonText)}</button>
            </div>`;
        $("[data-success-done]", actionModal)?.addEventListener("click", onDone);
    };

    const getBeneficiaryOptions = () => beneficiaries.length
        ? beneficiaries.map(item => `
            <button type="button" class="reen-beneficiary-item" data-beneficiary-id="${escapeHTML(item.id)}">
                <span class="reen-beneficiary-name">${escapeHTML(formatTransactionName(item.name))}</span>
                <span class="reen-beneficiary-meta">${escapeHTML(item.bank)} · ${escapeHTML(item.accountNumber)}</span>
            </button>`).join("")
        : `<p class="reen-beneficiary-empty">No saved beneficiaries yet.</p>`;

    const saveBeneficiary = beneficiary => {
        const exists = beneficiaries.some(item => item.accountNumber === beneficiary.accountNumber && item.bank === beneficiary.bank);
        if (!exists) {
            beneficiaries.unshift({ ...beneficiary, id: `beneficiary-${Date.now()}` });
            localStorage.setItem(beneficiaryStorageKey, JSON.stringify(beneficiaries));
        }
    };

    const createActionModal = ({ title, accountKey, action }) => {
        closeActionModal();
        const account = accounts[accountKey];
        if (!account) return;
        const isFund = action === "fund";

        actionModal = document.createElement("div");
        actionModal.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(51,183,134,.42)_0%,rgba(51,183,134,.25)_38%,rgba(212,243,231,.60)_72%,rgba(255,255,255,.15)_100%)] p-7 font-poppins backdrop-blur-[3px]";
        actionModal.setAttribute("aria-hidden", "false");

        if (isFund) {
            actionModal.innerHTML = `
                <div class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] w-[min(540px,calc(100vw-32px))] p-[44px_56px_40px] reen-overlay-card-fund" role="dialog" aria-modal="true" aria-labelledby="action-title">
                    <h2 id="action-title" class="reen-overlay-title">Fund Wallet</h2>
                    <form id="action-form" class="reen-overlay-form reen-fund-form">
                        <fieldset class="reen-fund-fieldset">
                            <legend class="reen-overlay-label">Select Payment Method</legend>
                            <div class="reen-payment-methods">
                                <label class="reen-payment-option is-selected">
                                    <input type="radio" name="payment-method" value="Direct Pay" checked>
                                    <span class="reen-radio"></span><span>Direct Pay</span>
                                </label>
                                <label class="reen-payment-option">
                                    <input type="radio" name="payment-method" value="Credit Card">
                                    <span class="reen-radio"></span><span>Credit Card</span>
                                </label>
                            </div>
                        </fieldset>

                        <div id="direct-pay-fields" class="reen-fund-method-fields">
                            <label class="reen-overlay-label" for="action-amount">Amount</label>
                            <input id="action-amount" class="reen-overlay-input" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000" required>
                        </div>

                        <div id="credit-card-fields" class="reen-fund-method-fields hidden">
                            <label class="reen-overlay-label" for="action-card-number">Card Number</label>
                            <input id="action-card-number" class="reen-overlay-input" type="text" inputmode="numeric" autocomplete="cc-number" maxlength="19" placeholder="0000 0000 0000 0000">

                            <label class="reen-overlay-label" for="action-card-holder">Card holder name</label>
                            <input id="action-card-holder" class="reen-overlay-input" type="text" autocomplete="cc-name" placeholder="Enter card holder name">

                            <div class="reen-card-small-fields">
                                <div>
                                    <label class="reen-overlay-label" for="action-card-expiry">Expiry date</label>
                                    <input id="action-card-expiry" class="reen-overlay-input" type="text" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY">
                                </div>
                                <div>
                                    <label class="reen-overlay-label" for="action-card-cvc">CVC</label>
                                    <input id="action-card-cvc" class="reen-overlay-input" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="000">
                                </div>
                            </div>

                            <label class="reen-overlay-label" for="credit-card-amount">Amount</label>
                            <input id="credit-card-amount" class="reen-overlay-input" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000">
                        </div>

                        <p id="action-error" class="reen-overlay-error hidden" aria-live="polite"></p>
                        <div class="reen-overlay-actions">
                            <button type="button" data-close-modal class="reen-overlay-cancel">Cancel</button>
                            <button type="submit" class="reen-overlay-primary">Fund</button>
                        </div>
                    </form>
                </div>`;
        } else {
            actionModal.innerHTML = `
                <div class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] w-[min(540px,calc(100vw-32px))] p-[44px_56px_40px] reen-overlay-card-withdraw" role="dialog" aria-modal="true" aria-labelledby="action-title">
                    <h2 id="action-title" class="reen-overlay-title">Withdraw</h2>
                    <form id="action-form" class="reen-overlay-form">
                        <label class="reen-overlay-label" for="action-amount">Amount</label>
                        <input id="action-amount" class="reen-overlay-input" type="number" min="1" step="0.01" inputmode="decimal" placeholder="100,000" required>

                        <label class="reen-overlay-label" for="withdraw-account-number">Account Number</label>
                        <input id="withdraw-account-number" class="reen-overlay-input" type="text" inputmode="numeric" maxlength="11" autocomplete="off" placeholder="01234567890" required>
                        <p class="reen-field-hint">Account number must be exactly 11 digits.</p>

                        <label class="reen-overlay-label" for="withdraw-account-name">Account Name</label>
                        <input id="withdraw-account-name" class="reen-overlay-input" type="text" placeholder="Enter account name" autocomplete="off" required>

                        <div class="reen-beneficiary-field">
                            <label class="reen-overlay-label" for="beneficiary-trigger">Beneficiary</label>
                            <button type="button" id="beneficiary-trigger" class="reen-overlay-input reen-select-button" aria-expanded="false">
                                <span id="beneficiary-trigger-label">Select beneficiary</span><span class="reen-select-chevron">⌄</span>
                            </button>
                            <div id="beneficiary-list" class="reen-beneficiary-list hidden">${getBeneficiaryOptions()}</div>
                        </div>

                        <label class="reen-overlay-label" for="withdraw-bank">Bank</label>
                        <div class="reen-select-wrap">
                            <select id="withdraw-bank" class="reen-overlay-input" required>
                                <option value="">Bank Name</option>
                                ${popularBanks.map(bank => `<option value="${escapeHTML(bank)}">${escapeHTML(bank)}</option>`).join("")}
                            </select>
                        </div>

                        <label class="reen-beneficiary-check"><input id="add-as-beneficiary" type="checkbox"><span class="reen-check-box"></span><span>Add as beneficiary</span></label>
                        <p id="action-error" class="reen-overlay-error hidden" aria-live="polite"></p>
                        <div class="reen-overlay-actions">
                            <button type="button" data-close-modal class="reen-overlay-cancel">Cancel</button>
                            <button type="submit" class="reen-overlay-primary">Withdraw</button>
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
                $$('label.reen-payment-option', actionModal).forEach(label => {
                    label.classList.toggle("is-selected", $("input", label).checked);
                });
                directPayFields?.classList.toggle("hidden", credit);
                creditCardFields?.classList.toggle("hidden", !credit);
                actionModal.querySelector(".reen-overlay-card-fund")?.classList.toggle("is-credit-card", credit);
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
                accountNumberInput.value = accountNumberInput.value.replace(/\D/g, "").slice(0, 11);
            });

            const beneficiaryTrigger = $("#beneficiary-trigger", actionModal);
            const beneficiaryList = $("#beneficiary-list", actionModal);
            const beneficiaryLabel = $("#beneficiary-trigger-label", actionModal);
            beneficiaryTrigger?.addEventListener("click", () => {
                const open = beneficiaryList.classList.toggle("hidden");
                beneficiaryTrigger.setAttribute("aria-expanded", String(!open));
            });

            $$('[data-beneficiary-id]', actionModal).forEach(button => button.addEventListener("click", () => {
                const item = beneficiaries.find(beneficiary => beneficiary.id === button.dataset.beneficiaryId);
                if (!item) return;
                $("#withdraw-account-number", actionModal).value = item.accountNumber;
                $("#withdraw-account-name", actionModal).value = item.name;
                $("#withdraw-bank", actionModal).value = item.bank;
                beneficiaryLabel.textContent = item.name;
                beneficiaryList.classList.add("hidden");
                beneficiaryTrigger.setAttribute("aria-expanded", "false");
            }));
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
                if (!/^\d{11}$/.test(accountNumberValue)) {
                    error.textContent = "Account number must be exactly 11 digits.";
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

                if ($("#add-as-beneficiary", actionModal).checked) {
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
                showSuccessOverlay({ amount: formatMoney(amount), message: "has been sent to your Bank Account!" });
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
            showSuccessOverlay({ amount: formatMoney(amount), message: "has been added to your Wallet!" });
        });

        amountInput?.focus();
    };

    const showAddAccountModal = () => {
        closeActionModal();
        actionModal = document.createElement("div");
        actionModal.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(51,183,134,.42)_0%,rgba(51,183,134,.25)_38%,rgba(212,243,231,.60)_72%,rgba(255,255,255,.15)_100%)] p-7 font-poppins backdrop-blur-[3px]";
        actionModal.setAttribute("aria-hidden", "false");
        actionModal.innerHTML = `
            <div class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] w-[min(540px,calc(100vw-32px))] p-[44px_56px_40px] reen-overlay-card-add" role="dialog" aria-modal="true" aria-labelledby="add-account-title">
                <h2 id="add-account-title" class="reen-overlay-title">Add Account</h2>
                <p class="reen-overlay-subtitle">Create another account for your savings goals.</p>
                <form id="new-account-form" class="reen-overlay-form">
                    <label class="reen-overlay-label" for="new-account-name">Account Name</label>
                    <input id="new-account-name" class="reen-overlay-input" type="text" maxlength="40" placeholder="e.g. Emergency Fund" required>
                    <p id="new-account-error" class="reen-overlay-error hidden" aria-live="polite"></p>
                    <div class="reen-overlay-actions">
                        <button type="button" data-close-modal class="reen-overlay-cancel">Cancel</button>
                        <button type="submit" class="reen-overlay-primary">Create Account</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(actionModal);
        document.body.classList.add("overflow-hidden");
        $$('[data-close-modal]', actionModal).forEach(button => button.addEventListener("click", closeActionModal));
        $("#new-account-form", actionModal)?.addEventListener("submit", event => {
            event.preventDefault();
            const name = $("#new-account-name", actionModal).value.trim();
            const error = $("#new-account-error", actionModal);
            if (!name) {
                error.textContent = "Please enter an account name.";
                error.classList.remove("hidden"); return;
            }
            const key = `custom_${Date.now()}`;
            accounts[key] = { name, balance: 0 };
            saveState(); renderEverything();
            actionModal.innerHTML = `
                <div class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] reen-overlay-card-success reen-overlay-card-account-created">
                    <div class="reen-success-tick" aria-hidden="true"><img src="../assets/icons/check.svg" alt=""></div>
                    <p class="reen-success-message">Your account has been created Successfully!</p>
                    <button type="button" data-account-created-done class="reen-overlay-primary reen-success-button">Go to Dashboard</button>
                </div>`;
            $("[data-account-created-done]", actionModal)?.addEventListener("click", () => {
                closeActionModal();
                window.location.href = "./dashboard.html";
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
    let selectedStatisticsMonth = readJSON(statisticsPeriodKey, monthKey(new Date()));

    const updateDashboardBalanceVisibility = () => {
        const amountElements = $$("#dashboard-current-balance, #dashboard-income, #dashboard-expense");
        amountElements.forEach(el => {
            if (dashboardBalancesHidden) {
                el.textContent = "₦ ••••••••";
            }
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

    const renderBalances = () => {
        $$('[data-account-balance]').forEach(el => {
            const key = el.dataset.accountBalance;
            if (accounts[key]) el.textContent = formatMoney(accounts[key].balance);
        });

        const income = transactions
            .filter(item => Number(item.amount) > 0 && item.status !== "Canceled")
            .reduce((sum, item) => sum + Number(item.amount), 0);
        const expenses = Math.abs(transactions
            .filter(item => Number(item.amount) < 0 && item.status !== "Canceled")
            .reduce((sum, item) => sum + Number(item.amount), 0));

        const currentBalance = $("#dashboard-current-balance");
        const incomeEl = $("#dashboard-income");
        const expenseEl = $("#dashboard-expense");
        if (currentBalance) currentBalance.textContent = formatMoney(accounts.main.balance);
        if (incomeEl) incomeEl.textContent = formatMoney(income);
        if (expenseEl) expenseEl.textContent = formatMoney(expenses);
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
            return `
                <div class="transaction-row grid min-w-0 grid-cols-[minmax(95px,1.15fr)_minmax(125px,1fr)_minmax(145px,1.15fr)] items-center gap-x-3 border-b border-[#D8E1DE] py-1">
                    <p class="transaction-name min-w-0 whitespace-nowrap text-[11px] text-[#777]">${escapeHTML(formatTransactionName(item.name))}</p>
                    <p class="transaction-date whitespace-nowrap text-center text-[11px] text-[#777]">${escapeHTML(item.date)}</p>
                    <p class="transaction-amount whitespace-nowrap text-right text-[11px] font-semibold ${amountClass}">${transactionAmountText(item)}</p>
                </div>`;
        }

        return `
            <div class="transaction-page-row grid min-w-0 grid-cols-[28px_minmax(90px,1.1fr)_minmax(75px,.9fr)_minmax(115px,1fr)_minmax(105px,.9fr)_minmax(90px,.8fr)] items-center gap-x-3 border-b border-[#D8E1DE] py-2 min-h-[48px] xl:grid-cols-[32px_minmax(130px,1.15fr)_minmax(105px,.95fr)_minmax(145px,1fr)_minmax(120px,.9fr)_150px] xl:gap-x-4" data-transaction-search="${escapeHTML(`${item.name} ${item.type} ${item.date} ${item.status} ${item.amount}`)}">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${signClass}">
                    <img src="../assets/images/${positive ? "add.png" : "subtract.png"}" alt="${positive ? "Incoming transaction" : "Outgoing transaction"}" class="h-full w-full object-contain">
                </div>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.name)}</p>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.type)}</p>
                <p data-cell="true" class="min-w-0 whitespace-nowrap text-[11px] font-normal text-[#777]">${escapeHTML(item.date)}</p>
                <p data-cell="true" class="whitespace-nowrap text-[11px] font-semibold ${amountClass}">${transactionAmountText(item)}</p>
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
            <article class="transaction-account-card h-[109px] w-[230px] min-w-[230px] shrink-0 cursor-pointer rounded-xl border-l-[6px] border-transparent bg-[#D4F3E7] px-6 py-5 transition-[border-color,box-shadow] duration-150" data-account-card data-account-key="${escapeHTML(key)}">
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
  const accountsContainer = $("#accounts-container");

  if (!accountsContainer) return;

  // Only accounts created through "Add Account"
  const customEntries = Object.entries(accounts).filter(
    ([key]) => !["main", "school", "holiday"].includes(key)
  );

  // Remove previously generated custom cards
  $$(".custom-account-card", accountsContainer).forEach((card) => {
    card.remove();
  });

  // Find the Add Account card
  const addAccountCard = accountsContainer.querySelector(
    "[data-add-account-card]"
  );

  customEntries.forEach(([key, account]) => {
    const card = document.createElement("article");

    card.dataset.accountCard = "";
    card.dataset.accountKey = key;

    // EXACT same size/layout as the existing account cards.
    // No hover effect.
    card.className =
      "custom-account-card flex h-[140px] min-h-[140px] w-[220px] min-w-[220px] shrink-0 cursor-pointer flex-col justify-between rounded-xl border-l-[6px] border-transparent bg-[#D4F3E7] p-4 transition-[border-color,box-shadow] duration-150";

    card.innerHTML = `
      <div class="min-w-0">

        <div class="flex items-center justify-between gap-3">

          <p
            class="min-w-0 truncate text-sm font-semibold text-[#452080]"
          >
            ${escapeHTML(account.name)}
          </p>

          <button
            type="button"
            data-toggle-account-balance
            class="flex h-5 w-5 shrink-0 items-center justify-center"
            aria-label="Toggle ${escapeHTML(account.name)} balance"
          >
            <img
              src="../assets/icons/eye.svg"
              alt=""
              class="h-4 w-4 opacity-70"
            >
          </button>

        </div>

        <h2
          data-account-balance="${key}"
          class="mt-4 w-full truncate text-left text-lg font-bold leading-none text-[#111]"
        >
          ${formatMoney(account.balance)}
        </h2>

      </div>

      <div class="flex gap-2">

        <button
          type="button"
          data-account-action="fund"
          data-account="${key}"
          class="min-w-0 flex-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-white"
        >
          Fund
        </button>

        <button
          type="button"
          data-account-action="withdraw"
          data-account="${key}"
          class="min-w-0 flex-1 rounded-md bg-[#D0D0D0] px-2 py-1.5 text-[11px] font-semibold text-[#333]"
        >
          Withdraw
        </button>

      </div>
    `;

    // ALWAYS insert the new account before Add Account
    if (addAccountCard) {
      accountsContainer.insertBefore(card, addAccountCard);
    } else {
      accountsContainer.appendChild(card);
    }
  });

  // Safety check:
  // Add Account must ALWAYS remain the final card.
  const finalAddAccountCard = accountsContainer.querySelector(
    "[data-add-account-card]"
  );

  if (finalAddAccountCard) {
    accountsContainer.appendChild(finalAddAccountCard);
  }

  // Rebind account functionality
  bindAccountSelection(accountsContainer);
  bindAccountControls();

  // Refresh balances
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

            let visible = true;
            const icon = $("img", button);
            if (icon) icon.src = "../assets/icons/eye.svg";
            button.setAttribute("aria-label", "Hide balance");
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
            return { key: monthKey(date), label: date.toLocaleDateString("en-US", { month: "long" }) };
        });
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

    const renderNotifications = () => {
        const dot = $("#dashboard-notification-dot");
        const list = $("#dashboard-notification-list");
        if (dot) dot.classList.toggle("hidden", notifications.length === 0);
        if (list) {
            list.innerHTML = notifications.length
                ? notifications.map(item => `
                    <div class="rounded-lg bg-[#f2fbf8] px-3 py-2.5 text-xs leading-5 text-[#555]">${escapeHTML(item.message)}</div>
                  `).join("")
                : `<p class="py-3 text-xs text-[#888]">No notifications.</p>`;
        }
    };

    const setupDashboardControls = () => {
        const visibilityButton = $("#dashboard-balance-visibility");
        visibilityButton?.addEventListener("click", () => {
            dashboardBalancesHidden = !dashboardBalancesHidden;
            renderBalances();
        });

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
        });

        renderNotifications();
    };

    // ---------------------------------------------------------
    // Account actions
    // ---------------------------------------------------------

    $("#add-account-button")?.addEventListener("click", showAddAccountModal);
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
            <div id="logout-overlay" class="fixed inset-0 z-[9999] hidden flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(51,183,134,.42)_0%,rgba(51,183,134,.25)_38%,rgba(212,243,231,.60)_72%,rgba(255,255,255,.15)_100%)] p-7 font-poppins backdrop-blur-[3px]" aria-hidden="true">
                <div id="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" class="relative z-[1] box-border rounded-[30px] bg-white text-[#242424] shadow-[0_24px_70px_rgba(51,183,134,0.18)] reen-overlay-card-logout">
                    <h2 id="logout-title">Are you sure you want to Logout?</h2>
                    <div class="reen-overlay-actions">
                        <button id="cancel-logout" type="button" class="reen-overlay-cancel">Cancel</button>
                        <button id="confirm-logout" type="button" class="reen-overlay-primary">Logout</button>
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
        window.location.href = "./login.html";
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
});
