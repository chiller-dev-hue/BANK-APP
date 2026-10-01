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

    let totalBalance = 0;

    accounts.forEach(function (account) {

        totalBalance += account.balance;

    });


    // Display total balance
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

    const savedUser =
        localStorage.getItem("reenBankUser");


    if (savedUser) {

        const user =
            JSON.parse(savedUser);


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


        // --------------------------------------
        // CREATE ACCOUNT NUMBER
        // --------------------------------------

        let accountNumber =
            localStorage.getItem("reenBankAccountNumber");


        // If user doesn't have an account number,
        // create one.
        if (!accountNumber) {

            accountNumber =
                generateAccountNumber();

            localStorage.setItem(
                "reenBankAccountNumber",
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
    // LOGOUT
    // ==========================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {

                    return;

                }


                // Remove login/session information
                localStorage.removeItem(
                    "reenBankLoggedIn"
                );


                // Return to login page
                window.location.href =
                    "./login.html";

            }
        );

    }

});