# Design System Migration Plan

## Shared foundation

| Area | Files | Impact | Action |
| --- | --- | --- | --- |
| Tokens | `tailwind.config.js`, `src/index.css` | Critical, application-wide | Restrict colors, typography, spacing, radius, and card shadow to approved values. |
| Buttons | `src/components/Button.tsx` | High, all primary actions | Enforce four variants, two heights, and CTA-only shimmer. |
| Badges | `src/components/Badge.tsx` | High, status and metadata | Enforce shared dimensions, typography, and approved semantic variants. |

## High-impact product surfaces

| Component group | Files | Impact | Main violations |
| --- | --- | --- | --- |
| Planning and dashboard | `TripForm.tsx`, `Dashboard.tsx`, `TripOverview.tsx` | Critical | Prices, button bypasses, stepper, display font misuse, card states. |
| Financial views | `Expenses.tsx`, `BudgetChart.tsx`, `Analytics.tsx` | Critical | Non-coral prices, chart colors, unsupported typography and labels. |
| Itinerary views | `ItineraryCard.tsx`, `TripTimeline.tsx`, `RouteMap.tsx` | High | Arbitrary spacing, unsupported colors/radii, date and cost typography. |
| Discovery cards | `HotelCard.tsx`, `AttractionCard.tsx`, `SavedTrips.tsx`, `Demo.tsx` | High | Ad hoc badges, card states, destination typography, prices. |

## Medium-impact surfaces

| Component group | Files | Impact | Main violations |
| --- | --- | --- | --- |
| Navigation and authentication | `Navbar.tsx`, `Login.tsx`, `Register.tsx` | Medium | Native buttons, uppercase labels, legacy colors and radii. |
| Marketing | `HeroSection.tsx`, `Home.tsx`, `LoadingState.tsx` | Medium | Decorative hardcoded colors, unsupported spacing and radii. |
| Chat and profile | `Chat.tsx`, `ChatWindow.tsx`, `Profile.tsx` | Medium | Price styling, display font misuse, card and button inconsistency. |

## Execution order

1. Repair compilation and preserve a passing build.
2. Migrate tokens, typography, Button, and Badge.
3. Normalize radius and spacing; migrate every price to coral DM Mono.
4. Normalize cards, stepper, navigation states, and label casing.
5. Rebuild and rerun the static design-system audit.
