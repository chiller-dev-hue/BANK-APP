# Reen Bank Pass 54 — Profile Layout + Transaction Alignment

## Profile page fixes
- Fixed the broken desktop profile grid. The previous `lg:grid-cols-5` utility was missing from the packaged CSS, causing the left profile card and right column to collapse into the wrong proportions.
- Rebuilt the desktop content grid as a responsive Tailwind arbitrary grid: `lg:grid-cols-[minmax(0,3fr)_minmax(420px,2fr)]`.
- Kept the left profile card floating with `h-fit`/`self-start` instead of stretching to the bottom.
- Reduced vertical spacing and avatar size so Email, Phone Number, Gender, Save Changes, and Reset Password can all fit in the static desktop viewport.
- Kept the profile image as `object-cover` inside the full circular frame.

## Navbar fixes
- Kept the account name and account number in the centered header column.
- Changed the right header controls to a Tailwind grid so Search starts at the right-column edge while notification and profile remain aligned to the far right.

## Profile transactions
- Rebuilt profile transaction rows as a three-column Tailwind grid: flexible name column, fixed date/time column, fixed amount column.
- Date/time values now begin on the same vertical line and amounts end on the same vertical line.
- Reduced row text size slightly and preserved vertical spacing.
- Existing transaction-name rule remains: first two names stay visible; a third name becomes its first two letters followed by `...`.

## Validation
- `node --check src/js/bank.js` passed.
- Checked the profile HTML for duplicate IDs.
- Preserved existing banking functionality and locked sidebar.
- Packaged as Pass 54.
