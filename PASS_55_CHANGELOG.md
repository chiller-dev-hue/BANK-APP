# Reen Bank Pass 55 — Profile Final Alignment + Transaction Cleanup

## Profile page
- Moved the account identity into the right edge of the left header grid, matching the Figma composition instead of centering it across the whole page.
- Kept the right header column independent so Search starts at the edge of that column and notification/profile stay aligned.
- Reduced profile-card vertical spacing and avatar size so Email, Phone Number, Gender, Save Changes, and Reset Password are all visible in the static desktop viewport.
- Kept the profile photo fully circular with `object-cover` so the image fills the circle.
- Kept the profile form constrained to `max-w-[420px]` so it no longer stretches across the whole left card.
- On smaller screens, only the profile content area can scroll vertically when the viewport cannot physically fit every field; desktop remains static.

## Transaction rows
- Profile transaction rows now use a fixed three-column Tailwind grid:
  - flexible name column
  - fixed centered date/time column
  - fixed right-aligned amount column
- Transaction names use the existing rule: first and second names remain complete; when a third name exists, only its first two letters are shown followed by `...`.
- Dashboard compact transaction rows now use the same alignment idea so names, dates, and large amounts stay straight.
- Added enough width for large transaction amounts without allowing the date/time column to drift.

## Tailwind
- All layout changes are written as Tailwind utility classes in the HTML/JS source.
- The compiled CSS files include small generated-equivalent fallbacks for the arbitrary Tailwind utilities so the packaged build remains visually functional even before the user reruns Tailwind CLI.

## Validation
- `node --check src/js/bank.js` passed.
- Checked dashboard, accounts, transaction, and profile HTML for duplicate IDs: none found.
