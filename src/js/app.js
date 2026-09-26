// LANDING PAGE

document.addEventListener("DOMContentLoaded", () => {

    // MOBILE NAVIGATION
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener("click", () => {

            const isOpen =
                mobileMenuButton.getAttribute("aria-expanded") === "true";

            mobileMenu.classList.toggle("hidden");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

            mobileMenuButton.setAttribute(
                "aria-label",
                isOpen ? "Open menu" : "Close menu"
            );
        });

        // Close menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll("a");
        mobileLinks.forEach((link) => {
            link.addEventListener("click", () => {

                mobileMenu.classList.add("hidden");
                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                mobileMenuButton.setAttribute(
                    "aria-label",
                    "Open menu"
                );
            });
        });
    }

    // FAQ CAROUSEL
    const faqQuestion = document.getElementById("faq-question");
    const faqAnswer = document.getElementById("faq-answer");
    const faqPrev = document.getElementById("faq-prev");
    const faqNext = document.getElementById("faq-next");
    const faqButtons = document.querySelectorAll(".faq-question");


    const faqData = [

        {
            question: "What types of accounts does Reen Bank offer?",
            answer:
                "Reen Bank offers a variety of accounts to suit your financial needs, including savings accounts, checking accounts, and credit cards. We also offer loans, investment services, and other financial products."
        },
        {
            question: "How do I sign up for an account with Reen Bank?",
            answer:
                "You can sign up for an account with Reen Bank online by visiting our website and filling out the online application form. Once your application is approved, you will receive instructions for setting up your account and accessing our online banking platform."
        },
        {
            question: "Is Reen Bank NDIC insured?",
            answer:
                "Reen Bank is presented as an NDIC-insured bank and is licensed by the Central Bank of Nigeria (CBN)."
        },
        {
            question: "How can I access my Reen Bank account online?",
            answer:
                "You can access your Reen Bank account online by logging into our secure online banking platform using your username and password. From there, you can view your account balances, transfer funds, pay bills, and more."
        },
        {
            question:
                "What security measures does Reen Bank have in place to protect my financial information?",
            answer:
                "Reen Bank uses security measures such as encryption, secure authentication, multi-factor authentication, input validation and sanitization to help reduce risks such as cross-site scripting (XSS), fraud detection, regular security updates, and continuous monitoring."
        }
    ];

    let currentFaqIndex = 0;

    // Display FAQ
    function displayFaq(index) {
        if (!faqQuestion || !faqAnswer) {
            return;
        }

        const faq = faqData[index];

        faqQuestion.textContent = faq.question;
        faqAnswer.textContent = faq.answer;

        // Update active question
        faqButtons.forEach((button) => {

            const buttonIndex =
                Number(button.dataset.faqIndex);

            if (buttonIndex === index) {
                button.classList.add("text-primary");
                button.classList.remove("text-[#432080]");
            } else {
                button.classList.remove("text-primary");
                button.classList.add("text-[#432080]");
            }
        });
    }

    // FAQ Question Click
    faqButtons.forEach((button) => {
        button.addEventListener("click", () => {

            currentFaqIndex =
                Number(button.dataset.faqIndex);

            displayFaq(currentFaqIndex);
        });
    });

    // Previous FAQ
    if (faqPrev) {
        faqPrev.addEventListener("click", () => {

            currentFaqIndex--;

            if (currentFaqIndex < 0) {
                currentFaqIndex = faqData.length - 1;
            }

            displayFaq(currentFaqIndex);
        });
    }

    // Next FAQ
    if (faqNext) {
        faqNext.addEventListener("click", () => {

            currentFaqIndex++;

            if (currentFaqIndex >= faqData.length) {
                currentFaqIndex = 0;
            }

            displayFaq(currentFaqIndex);
        });
    }

    // FAQ MOBILE SWIPE

    let touchStartX = 0;
    let touchEndX = 0;

    const faqArea = document.querySelector(
        "#faq-question"
    );

    if (faqArea) {
        faqArea.addEventListener("touchstart", (event) => {

            touchStartX = event.changedTouches[0].screenX;
        });

        faqArea.addEventListener("touchend", (event) => {

            touchEndX = event.changedTouches[0].screenX;

            handleFaqSwipe();
        });
    }

    function handleFaqSwipe() {

        const swipeDistance = touchEndX - touchStartX;

        // Swipe left → next FAQ
        if (swipeDistance < -50) {

            currentFaqIndex++;

            if (currentFaqIndex >= faqData.length) {
                currentFaqIndex = 0;
            }

            displayFaq(currentFaqIndex);
        }

        // Swipe right → previous FAQ
        if (swipeDistance > 50) {

            currentFaqIndex--;

            if (currentFaqIndex < 0) {
                currentFaqIndex = faqData.length - 1;
            }

            displayFaq(currentFaqIndex);
        }
    }

    // Display first FAQ when page loads
    displayFaq(currentFaqIndex);

    // FOOTER EMAIL CTA
    
    const footerEmailInput = document.querySelector(
        "#contact input[type='email']"
    );

    const footerGetStartedButton = document.querySelector(
        "#contact a[href='./register.html']"
    );

    if (footerEmailInput && footerGetStartedButton) {
        footerGetStartedButton.addEventListener("click", (event) => {

            const email = footerEmailInput.value.trim();

            // Check if email is empty
            if (email === "") {
                event.preventDefault();

                footerEmailInput.focus();
                footerEmailInput.classList.add("border-red-500");

                return;
            }

            // Basic email validation
            if (!email.includes("@")) {
                event.preventDefault();

                footerEmailInput.focus();
                footerEmailInput.classList.add("border-red-500");

                return;
            }

            // Remove error styling
            footerEmailInput.classList.remove("border-red-500");

            // Save email temporarily
            localStorage.setItem("reenBankPrefillEmail", email);
        });
    }
});