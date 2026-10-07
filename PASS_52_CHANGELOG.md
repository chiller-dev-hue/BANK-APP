# ReenBank Pass 52 — Profile Figma alignment

## Profile header
- Rebuilt the Profile header with a three-column Tailwind grid so the account name and account number sit in the center header position, matching the supplied Figma composition.
- Kept Search, notification bell and profile avatar grouped on the right.
- The profile avatar wrapper now fills the whole circular frame so a saved profile photo covers the circle instead of appearing as a small image inside it.

## Profile content
- Reduced the profile card width using a 5-column Tailwind grid: profile content spans 3 columns and the account/transactions panel spans 2 columns.
- Reduced the form width to `max-w-xs` so the email, phone and gender fields do not stretch across the whole card.
- Increased the main profile image to a compact Figma-like circular size while keeping `object-cover` for saved photos.
- Preserved the static viewport and existing horizontal-only scrolling behavior for transaction content.

## Validation
- `node --check src/js/bank.js` passed.
- No JavaScript functionality was changed.
- No new custom stylesheet rules were added; the layout changes use Tailwind utility classes.
