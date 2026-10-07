# Reen Bank — Final Responsive / Figma Audit

## Project rules
- HTML
- Tailwind CSS v4 via Tailwind CLI
- JavaScript
- No page-level custom `<style>` blocks.
- Layout and responsive overrides are implemented with Tailwind utility classes.
- `src/input.css` contains only the Tailwind import and project theme tokens.

## Final source pages
- `index.html` — landing page
- `login.html` — login
- `register.html` — registration
- `otp-verification.html` — email verification
- `dashboard.html` — overview
- `accounts.html` — account management
- `transaction.html` — transactions
- `profile.html` — profile/settings

## Functionality
- Registration validation and password hashing
- Development OTP generation/verification
- Login and current-user state
- Persistent account numbers
- Per-user account balances
- Fund / withdraw actions
- Add-account action
- Balance visibility toggles
- Transaction persistence
- Transaction search
- Logout confirmation
- Profile name/password updates
- Responsive mobile navigation drawer

## Responsive strategy
- Mobile: compact header, single-column content and stacked account cards.
- Tablet: fluid content with two-column cards where appropriate.
- Desktop: persistent sidebar and Figma-inspired content proportions.
- Transaction content keeps all fields readable with horizontal overflow where a narrow viewport cannot fit the complete row.

## Build
Run:

`npm install`

Then:

`npm run build`

For development:

`npm run dev`

The final generated stylesheet is `src/output.css`.
