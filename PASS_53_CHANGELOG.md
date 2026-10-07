# PASS 53 — Profile Transaction / Layout Refinement

## Profile page
- Reworked the desktop header into a clean 3-column Tailwind layout:
  - page title on the left
  - account name + account number centered
  - search, notification and profile avatar aligned to the far right
- Expanded the profile content container to `max-w-7xl` so the right transaction column has more usable width.
- Changed the desktop profile layout to a 3/5 + 2/5 Tailwind grid with a smaller `gap-12`.
- Made the left profile card `self-start` so it floats naturally instead of stretching to the bottom of the viewport.
- Kept the profile form compact with `max-w-sm`.
- Made **Save Changes** visible above **Reset Password** while preserving the existing save functionality.

## Profile transactions
- Added transaction-name formatting:
  - 1 name → full name
  - 2 names → first + second name
  - 3+ names → first + second + first two letters of third name + `...`
  - Example: `John Peter Michael` → `John Peter Mi...`
- Changed profile transaction rows to a stable Tailwind flex layout with fixed date and amount columns.
- Reduced transaction text size and increased vertical row spacing.
- Date/time remains on one straight line and the amount stays aligned to the right.

## Validation
- `node --check src/js/bank.js` passed.
- No JavaScript functionality was intentionally removed.
- No sidebar redesign was made.
