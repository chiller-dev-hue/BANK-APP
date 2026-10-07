# ReenBank Pass 50 — Static pages with internal horizontal rails

## Scope
Overview content was intentionally left untouched. This pass rebuilds only Accounts, Transactions, and Profile page layout behavior.

## Changes
- Reused the Overview page's exact sidebar markup/spacing/width on Accounts, Transactions, and Profile, with only the active navigation item changed.
- Kept the entire desktop page fixed to the viewport with `h-screen` + `overflow-hidden`; no body/page vertical scrolling.
- Accounts: account cards are a horizontal rail; transaction area can horizontally scroll when its Figma-style row needs more width.
- Transactions: account cards are a horizontal rail; transaction table can horizontally scroll when required.
- Profile: two-column Figma composition remains inside the fixed viewport; transaction list can horizontally scroll if required.
- Reduced header/section spacing and profile content spacing so the main content fits inside the viewport without cutting off the major sections.
- Savings cards (School Savings and Holiday Plan) remain view-only; Fund/Withdraw are kept only on Main Account.
- Tailwind utility classes are used for the layout changes; no new page-specific custom CSS was added.
- `bank.js` keeps existing functionality and was syntax-checked with `node --check`.

## Validation
- `node --check src/js/bank.js` passed.
- Verified sidebar IDs and active links on all three pages.
- Verified Accounts/Transactions/Profile remain vertically static while internal horizontal rails provide overflow only where needed.
