# Reen Bank — Pass 35 Changelog

## Profile photo
- Replaced the initials-only profile avatar with a Figma-style photo picker.
- User can click the profile avatar/pencil badge to select JPG, PNG, or WebP.
- Image is resized/compressed before being stored in the user's localStorage profile record.
- Uploaded photo appears on the Profile page and shared navbar profile avatars.
- If no photo has been uploaded, initials remain the fallback.
- Existing Gmail, phone, gender, Save Changes, and Reset Password functionality preserved.

## Fund Wallet overlay
- Reworked the Fund Wallet overlay to follow the supplied Figma composition.
- Direct Pay remains the default and shows only the payment method + amount flow.
- Fixed the broken/empty right-side panel seen in the website screenshot by keeping the fund form in one centered modal card.
- Selecting Credit Card now reveals card number, card holder name, expiry date, and CVC fields inside the same overlay.
- Added basic card input formatting and validation.
- Amount is still required for every funding method.
- Successful funding continues to use the separate confirmation stage with the tick icon.

## Validation
- bank.js passes Node syntax validation.
- Main HTML pages checked for duplicate IDs.
- Root and src CSS copies synchronized.
