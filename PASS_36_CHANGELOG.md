# Reen Bank Pass 36

## Profile photo fix
- Removed the contradictory legacy code that deleted old profile-image state.
- Profile photo is now persisted on the current user, registered user record, and per-user profile cache.
- Existing photo remains after reload/logout/login.
- Initials remain the fallback only when no photo has been uploaded.
- Shared navbar avatars use the same persisted photo.
- Preserved editable phone/gender, Gmail display, Save Changes and Reset Password.
- Added CSS hardening so the uploaded photo and initials occupy the same avatar frame cleanly.
