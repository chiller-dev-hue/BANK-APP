# ReenBank Pass 51 — Static viewport + transaction/profile layout fix

## Scope
- Kept the Overview design/content intact except for the requested Overview transaction cleanup and static-page behavior.
- Reused the Overview sidebar structure across Accounts, Transactions and Profile.
- Desktop pages are viewport-static (`h-screen`, `overflow-hidden`) with horizontal scrolling only inside card/transaction rails where needed.

## Accounts
- Main page reserves space for the fixed sidebar so content is no longer hidden underneath it.
- Account cards stay in a horizontal rail.
- Savings accounts remain view-only; Main Account retains Fund/Withdraw.
- Reduced card typography/action sizing while preserving enough height for the Figma composition.
- Transaction section remains horizontally scrollable rather than causing page scrolling.

## Transactions
- Reserves the sidebar width.
- Account cards remain horizontally scrollable.
- Full transaction table remains horizontally scrollable.
- Transaction typography and row sizing are compact enough to keep the section visible in a static viewport.

## Profile
- Reserves the sidebar width so the profile card is no longer clipped underneath the sidebar.
- Uses a 2-column desktop composition (profile card + right account/transactions panel).
- Reduced profile typography, form spacing and action-button height so identity/details remain visible.
- Reduced right-column account/transaction typography and kept rows evenly spaced.
- Profile transaction rail remains horizontally scrollable if needed.

## Overview
- Page is now viewport-static.
- Current Account Balance uses a three-column Tailwind grid so Current Balance, Income and Expense have dedicated space for large values.
- Overview Transactions now use compact, straight 3-column rows (name/date/amount) with smaller typography.
- Statistics amount columns remain separated from the bars so long numbers do not collide with the bars.

## Validation
- `node --check src/js/bank.js` passed.
- Duplicate-ID checks passed on dashboard, accounts, transaction and profile.
- Root and `src/output.css` remain synchronized.
- Tailwind source markup uses utility classes; no new page-specific stylesheet was introduced.
