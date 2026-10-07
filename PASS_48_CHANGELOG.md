# Reen Bank — Pass 48

## Rebuilt pages
- Rebuilt Accounts, Transactions, and Profile desktop compositions to follow the supplied Figma reference images.
- Reused the same 324px sidebar structure as the other pages; sidebar content begins at 102px from the viewport left edge, matching the Figma composition.
- Main desktop content is locked to a 1120px centered canvas, giving the Figma left edge at approximately 426px on a 1648px viewport.
- Header uses a 604px / 414px two-column relationship with a 102px gap; account name/number sit at the right edge of the left column.
- Accounts: four-card row, Figma-sized cards, Add Account retained, transaction section positioned to fit all seven rows in the viewport.
- Transactions: three Figma-sized account cards and seven transaction rows fitted into the viewport.
- Profile: 604px profile card + 414px right column with 102px gap, matching the Figma composition; save button remains available only through the existing form logic while the default visual stays clean.
- Desktop pages are static: body/main/sidebar use viewport-height layout with overflow hidden so there is no page scrollbar.
- Responsive Tailwind utilities are included for smaller breakpoints without changing the desktop Figma composition.
- Transaction renderer was updated to use the rebuilt Tailwind grid dimensions so dynamic transactions retain the Figma alignment.
- JavaScript syntax check passed.
- Duplicate-ID checks passed on all three rebuilt pages.
