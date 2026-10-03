// DASHBOARD

// RUN WHEN PAGE LOADS
document.addEventListener("DOMContentLoaded", function () {

    console.log("Reen Bank Dashboard Loaded");


    // ==========================================
    // GET DASHBOARD ELEMENTS
    // ==========================================

    const dashboardSidebar =
        document.getElementById("dashboard-sidebar");

    const dashboardOverlay =
        document.getElementById("dashboard-overlay");

    const dashboardMenuButton =
        document.getElementById("dashboard-menu-button");

    const dashboardUserName =
        document.getElementById("dashboard-user-name");

    const dashboardProfileInitials =
        document.getElementById("dashboard-profile-initials");

    const dashboardProfileInitialsMobile =
        document.getElementById("dashboard-profile-initials-mobile");

    const dashboardAccountNumber =
        document.getElementById("dashboard-account-number");

    const logoutButton =
        document.getElementById("logout-button");

    const toggleBalance =
        document.getElementById("toggle-balance");

    const currentBalance =
        document.getElementById("current-balance");


    // ==========================================
    // ACCOUNT BALANCE ELEMENTS
    // ==========================================

    const mainAccountBalance =
        document.getElementById("main-account-balance");

    const schoolSavingsBalance =
        document.getElementById("school-savings-balance");

    const holidayPlanBalance =
        document.getElementById("holiday-plan-balance");


    // ==========================================
    // ACCOUNTS
    // ==========================================

    const accounts = [

        {
            name: "Main Account",
            balance: 44500
        },

        {
            name: "School Savings",
            balance: 44500
        },

        {
            name: "Holiday Plan",
            balance: 44500
        }

    ];


    // ==========================================
    // FORMAT MONEY
    // ==========================================

    function formatMoney(amount) {

        return "₦" + amount.toLocaleString("en-NG", {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        });

    }


    // ==========================================
    // DISPLAY ACCOUNT BALANCES
    // ==========================================

    if (mainAccountBalance) {

        mainAccountBalance.textContent =
            formatMoney(accounts[0].balance);

    }


    if (schoolSavingsBalance) {

        schoolSavingsBalance.textContent =
            formatMoney(accounts[1].balance);

    }


    if (holidayPlanBalance) {

        holidayPlanBalance.textContent =
            formatMoney(accounts[2].balance);

    }


    // ==========================================
    // CALCULATE TOTAL BALANCE
    // ==========================================

    // The Overview card shows the selected/current account balance,
    // which is the Main Account balance in the Figma design.
    const totalBalance = accounts[0].balance;

    if (currentBalance) {

        currentBalance.textContent =
            formatMoney(totalBalance);

    }


    // ==========================================
    // GET USER INITIALS
    // ==========================================

    function getUserInitials(fullname) {

        const nameParts =
            fullname.trim().split(/\s+/);


        // If the user only entered one name
        if (nameParts.length === 1) {

            return nameParts[0]
                .charAt(0)
                .toUpperCase();

        }


        // Get first letter of first name
        // and first letter of second name
        return (
            nameParts[0].charAt(0) +
            nameParts[1].charAt(0)
        ).toUpperCase();

    }


    // ==========================================
    // LOAD USER INFORMATION
    // ==========================================

    /*
       Load the account belonging to the currently logged-in user.
       This replaces the old single-user "reenBankUser" system.
    */
    const currentUserData =
        localStorage.getItem("reenBankCurrentUser");


    if (currentUserData) {

        let user = null;

        try {
            user = JSON.parse(currentUserData);
        } catch {
            user = null;
        }

        if (!user) {
            return;
        }


        // --------------------------------------
        // DISPLAY USER'S NAME
        // --------------------------------------

        if (dashboardUserName && user.name) {

            dashboardUserName.textContent =
                user.name;

        }


        // --------------------------------------
        // DISPLAY PROFILE INITIALS
        // --------------------------------------

        if (dashboardProfileInitials && user.name) {

            dashboardProfileInitials.textContent =
                getUserInitials(user.name);

        }

        if (dashboardProfileInitialsMobile && user.name) {

            dashboardProfileInitialsMobile.textContent =
                getUserInitials(user.name);

        }


        // --------------------------------------
        // CREATE ACCOUNT NUMBER
        // --------------------------------------

        /*
           Every user gets a separate account number.
           Example: reenBankAccountNumber_user1
        */
        const accountNumberKey =
            `reenBankAccountNumber_${user.id}`;

        let accountNumber =
            localStorage.getItem(accountNumberKey);


        // If this user doesn't have an account number,
        // create one.
        if (!accountNumber) {

            accountNumber =
                generateAccountNumber();

            localStorage.setItem(
                accountNumberKey,
                accountNumber
            );

        }


        // Display account number
        if (dashboardAccountNumber) {

            dashboardAccountNumber.textContent =
                accountNumber;

        }

    }


    // ==========================================
    // GENERATE ACCOUNT NUMBER
    // ==========================================

    function generateAccountNumber() {

        let accountNumber = "";


        for (let i = 0; i < 10; i++) {

            accountNumber +=
                Math.floor(Math.random() * 10);

        }


        return accountNumber;

    }


    // ==========================================
    // MOBILE SIDEBAR
    // ==========================================

    if (
        dashboardMenuButton &&
        dashboardSidebar &&
        dashboardOverlay
    ) {

        dashboardMenuButton.addEventListener(
            "click",
            function () {

                dashboardSidebar.classList.remove(
                    "-translate-x-full"
                );

                dashboardOverlay.classList.remove(
                    "hidden"
                );

                dashboardMenuButton.setAttribute(
                    "aria-expanded",
                    "true"
                );

                dashboardOverlay.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }
        );


        // Close sidebar when overlay is clicked
        dashboardOverlay.addEventListener(
            "click",
            function () {

                closeDashboardMenu();

            }
        );

    }

    // ==========================================
    // CLOSE MOBILE SIDEBAR
    // ==========================================

    function closeDashboardMenu() {

        if (dashboardSidebar) {

            dashboardSidebar.classList.add(
                "-translate-x-full"
            );

        }


        if (dashboardOverlay) {

            dashboardOverlay.classList.add(
                "hidden"
            );

            dashboardOverlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }

        if (dashboardMenuButton) {

            dashboardMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }


    // ==========================================
    // CLOSE SIDEBAR WHEN LINK IS CLICKED
    // ==========================================

    if (dashboardSidebar) {

        const sidebarLinks =
            dashboardSidebar.querySelectorAll("a");


        sidebarLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    closeDashboardMenu();

                }
            );

        });

    }


    // ==========================================
    // MOBILE SIDEBAR ACCESSIBILITY / RESIZE
    // ==========================================

    if (dashboardOverlay) {
        dashboardOverlay.setAttribute("aria-hidden", "true");
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDashboardMenu();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth >= 1024) {
            closeDashboardMenu();
        }
    });


    // ==========================================
    // BALANCE VISIBILITY
    // ==========================================

    if (toggleBalance && currentBalance) {

        let balanceVisible = true;


        toggleBalance.addEventListener(
            "click",
            function () {


                if (balanceVisible) {

                    // Hide balance
                    currentBalance.textContent =
                        "₦••••••••";

                    balanceVisible = false;


                    toggleBalance.setAttribute(
                        "aria-label",
                        "Show balance"
                    );


                } else {

                    // Show calculated balance
                    currentBalance.textContent =
                        formatMoney(totalBalance);

                    balanceVisible = true;


                    toggleBalance.setAttribute(
                        "aria-label",
                        "Hide balance"
                    );

                }

            }
        );

    }


    // ==========================================
    // LOGOUT OVERLAY
    // ==========================================

    const logoutOverlay =
        document.getElementById("logout-overlay");

    const logoutModal =
        document.getElementById("logout-modal");

    const cancelLogout =
        document.getElementById("cancel-logout");

    const confirmLogout =
        document.getElementById("confirm-logout");


    function openLogoutOverlay() {

        if (!logoutOverlay) return;

        logoutOverlay.classList.remove("hidden");
        logoutOverlay.classList.add("flex");
        logoutOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("overflow-hidden");

    }


    function closeLogoutOverlay() {

        if (!logoutOverlay) return;

        logoutOverlay.classList.add("hidden");
        logoutOverlay.classList.remove("flex");
        logoutOverlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("overflow-hidden");

    }


    if (logoutButton) {

        logoutButton.addEventListener("click", openLogoutOverlay);

    }


    if (cancelLogout) {

        cancelLogout.addEventListener("click", closeLogoutOverlay);

    }


    if (logoutOverlay) {

        logoutOverlay.addEventListener("click", function (event) {

            if (event.target === logoutOverlay) {

                closeLogoutOverlay();

            }

        });

    }


    if (logoutModal) {

        logoutModal.addEventListener("click", function (event) {

            event.stopPropagation();

        });

    }


    if (confirmLogout) {

        confirmLogout.addEventListener("click", function () {

            localStorage.removeItem("reenBankLoggedIn");
            localStorage.removeItem("reenBankCurrentUser");

            window.location.href = "./login.html";

        });

    }


    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeLogoutOverlay();

        }

    });

});