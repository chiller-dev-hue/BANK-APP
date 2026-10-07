# Reen Bank — Pass 57

## Transaction page
- Limited the full transaction page to exactly 7 visible transaction records.
- Kept the transaction section itself non-scrollable.
- Rebuilt the desktop header grid so the account name/number sit at the right edge of the left header column, matching the Figma composition.
- Kept search, notification bell, and profile icon grouped on the right.
- Made transaction account-card balances content-safe without changing the card dimensions.
- Reduced balance typography and adjusted card inner padding so large balances fit cleanly.

## Shared profile/header
- Fixed the shared profile-avatar update so a saved profile photo is not overwritten by initials after profile UI refreshes.
- Profile page transaction arrow now renders green using the supplied arrow-right asset as a mask.

## Validation
- `node --check src/js/bank.js` passed.
