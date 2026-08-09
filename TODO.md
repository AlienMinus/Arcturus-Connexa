# TODO: Optimize Feed/Post CSS on Mobile & Hide Messenger on Small Screens

## Task 1: Optimize Feed/Post CSS on Mobile (reduce left/right gaps)
- [x] Reduce `.homeLayout` horizontal padding on mobile breakpoints (≤900px, ≤768px, ≤480px)
- [x] Reduce `.feed` horizontal padding on mobile (override Feed.css `0 8px`)
- [x] Reduce `.card` (postCard) horizontal padding on mobile so content isn't pushed inward
- [x] Keep create-post options and post action buttons nicely spaced

## Task 2: Remove Messenger on small screens, keep on large screens
- [x] Add a `useMediaQuery` hook in Home.jsx to conditionally render `<Messenger />` only on large screens (≥769px)
- [x] Add CSS fallback to hide `.messenger` on mobile (≤768px)

## Follow-up
- [x] Verify layout renders correctly on mobile and desktop (build check)
