# Pass 46 — Overview layout refinement

- Moved the dashboard account name and account number out of the top navigation and into the left dashboard content column above the Current Account Balance section.
- Kept `#dashboard-user-name` and `#dashboard-account-number` IDs so existing JavaScript user-profile updates continue to work.
- Removed the account identity from the desktop header so the header now contains Overview + search + notifications + profile.
- Shifted the complete dashboard content grid downward on desktop with the Tailwind utility `lg:pt-[115px]` so the Current Account Balance heading aligns vertically with the Overview item in the fixed sidebar.
- Kept mobile/tablet content spacing unchanged to avoid creating excessive empty space on smaller screens.
- All changes use Tailwind utility classes; no new custom CSS selectors were added.
- JavaScript syntax checks passed for all files.
- Dashboard duplicate-ID check passed.
- Tailwind CLI build could not be executed in this Linux environment because the supplied project dependency tree is missing the Linux `lightningcss` native binary; this does not affect the HTML/Tailwind class refactor itself.
