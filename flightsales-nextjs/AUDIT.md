# FlightSales.com.au — Comprehensive UX/UI Audit
**Date:** April 27, 2026
**Auditor:** AI Agent Review
**Scope:** Full website — Desktop & Mobile

---

## EXECUTIVE SUMMARY

The website has functional core features but suffers from:
1. **Inconsistent responsive behavior** — mobile breakpoints conflict (900px vs 960px vs 768px)
2. **Visual hierarchy issues** — low contrast labels, inconsistent spacing, orphaned UI elements
3. **Mobile UX gaps** — filter sheet works but lacks polish, touch targets vary wildly
4. **Performance concerns** — 7,148-line single file, potential for code splitting
5. **Accessibility gaps** — missing ARIA labels, focus states, reduced-motion support

---

## 1. GLOBAL / CROSS-CUTTING ISSUES

### 1.1 CSS Architecture
| Issue | Severity | Details |
|-------|----------|---------|
| Single 7,148-line component file | 🔴 High | FlightSalesApp.jsx is unmaintainable. Should split into pages/ components |
| Inconsistent breakpoints | 🔴 High | 900px, 960px, 768px, 640px, 480px used inconsistently |
| CSS-in-JS mixed with globals | 🟡 Medium | Some styles in globals.css, some in JSX style props, some in styled-jsx |
| No CSS custom properties for mobile | 🟡 Medium | Missing mobile-specific spacing/sizing tokens |

**Recommended Fix:**
- Standardize breakpoints: 480px (mobile), 768px (tablet), 1024px (desktop)
- Extract components: HomePage, BuyPage, ListingDetail, etc. into separate files
- Create CSS variables for touch targets, spacing scale

### 1.2 Navigation
| Issue | Severity | Details |
|-------|----------|---------|
| Mobile nav lacks hamburger animation | 🟡 Medium | Opens/closes without transition |
| No active state on nav items | 🟡 Medium | User can't see which page they're on |
| Nav z-index conflicts possible | 🟡 Medium | z-index: 100 on mobile sidebar, 999/1000 on filter sheet |

### 1.3 Typography
| Issue | Severity | Details |
|-------|----------|---------|
| Inconsistent font weights | 🟡 Medium | 500, 600, 700, 800 used arbitrarily |
| Line-height not standardized | 🟢 Low | Varies between 1.1, 1.5, 1.7 |
| Letter-spacing inconsistencies | 🟢 Low | -0.04em to 0.14em, no system |

---

## 2. HOMEPAGE (/)

### 2.1 Hero Section
| Issue | Severity | Details |
|-------|----------|---------|
| AI search placeholder rotates but lacks visual indicator | 🟡 Medium | Users may not realize it's a rotating hint |
| Hero search fields lack visual grouping | 🟡 Medium | 5 fields feel disconnected |
| Year/Price row uses inline styles instead of class | 🟢 Low | Should use fs-search-field wrapper |
| No loading state on search button | 🟢 Low | Clicking "Search" gives no feedback |

**Screenshot Needed:** Hero on 375px viewport

### 2.2 Featured Listings
| Issue | Severity | Details |
|-------|----------|---------|
| Cards lack hover lift effect | 🟡 Medium | Static cards feel lifeless |
| "View all" link is plain text | 🟢 Low | Should be a button or styled link |
| No empty state if featured fails to load | 🟢 Low | Skeleton loaders only, no error state |

### 2.3 Stats Section
| Issue | Severity | Details |
|-------|----------|---------|
| Numbers animate on load? | 🟢 Low | Not verified — should have count-up animation |
| Icons are inconsistent sizes | 🟢 Low | Some 24px, some 20px |

### 2.4 Dealer Section
| Issue | Severity | Details |
|-------|----------|---------|
| Dealer cards lack hover state | 🟡 Medium | No visual feedback on hover |
| No "View all dealers" link | 🟢 Low | Only shows 6, no way to see more |

### 2.5 News Section
| Issue | Severity | Details |
|-------|----------|---------|
| Cards lack date formatting | 🟢 Low | Raw dates like "2026-03-20" |
| No category filtering | 🟢 Low | Could filter by Market/Regulation/etc |

---

## 3. BUY PAGE (/buy)

### 3.1 Desktop Sidebar (≥961px)
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Live result count | ✅ | Now shows correct "X of Y aircraft" |
| ✅ Fixed: Equipment chips | ✅ | 6 chips with proper touch targets |
| ✅ Fixed: Year selects | ✅ | 51 options with proper styling |
| Advanced filters disclosure | 🟡 Medium | `<details>` works but lacks animation |
| No filter persistence on refresh | 🟡 Medium | Filters lost on page reload |
| Scrollbar styling inconsistent | 🟢 Low | Webkit scrollbar vs none on Firefox |

### 3.2 Mobile Filter Sheet (≤960px)
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Bottom sheet pattern | ✅ | 85vh, sticky header/footer |
| ✅ Fixed: Result count | ✅ | Shows correct count |
| ✅ Fixed: Year stacking | ✅ | Vertical on ≤480px |
| Sheet lacks drag-to-dismiss | 🟡 Medium | Users expect swipe down to close |
| No haptic feedback on toggle | 🟢 Low | Chips should have tactile feel |
| Apply button text repeats "aircraft" | 🟢 Low | "Show 12 aircraft" — redundant word |

### 3.3 Listing Grid
| Issue | Severity | Details |
|-------|----------|---------|
| Cards lack consistent aspect ratio | 🟡 Medium | Images vary in height |
| No lazy loading on images | 🔴 High | All images load at once, hurts performance |
| No placeholder for missing images | 🟡 Medium | Broken image icon shows |
| Pagination lacks jump-to-page | 🟢 Low | Only prev/next/page numbers |

### 3.4 Search Bar
| Issue | Severity | Details |
|-------|----------|---------|
| AI search lacks loading indicator | 🟡 Medium | "Searching..." text only, no spinner |
| Search history not persisted | 🟡 Medium | Users can't see recent searches |
| No search suggestions/autocomplete | 🟡 Medium | Free-text search with no guidance |

---

## 4. LISTING DETAIL PAGE

### 4.1 Header
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Price moved to header | ✅ | No longer duplicated |
| Title can overflow on mobile | 🟡 Medium | Long titles break layout |
| Tags wrap awkwardly | 🟡 Medium | Flex wrap with gaps creates uneven rows |
| No "Back to results" breadcrumb | 🟡 Medium | Only "Buy > Category > Title" |

### 4.2 Image Gallery
| Issue | Severity | Details |
|-------|----------|---------|
| No zoom on click | 🟡 Medium | Users expect lightbox/zoom |
| Thumbnail navigation missing | 🟡 Medium | No way to see all images at once |
| Swipe gestures not supported | 🟡 Medium | Mobile users expect swipe between images |

### 4.3 Specifications
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Layout | ✅ | Single column, no glued text |
| ✅ Fixed: Boolean specs | ✅ | "✓" / "—" format |
| Collapsible section lacks animation | 🟡 Medium | Opens/closes instantly |
| Cost of Ownership estimates are generic | 🟡 Medium | Same ranges for all aircraft in category |

### 4.4 Sidebar (Desktop)
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Z-index | ✅ | No longer scrolls behind |
| ✅ Fixed: Price removed | ✅ | Only actions in sidebar |
| Finance section lacks CTA | 🟡 Medium | "Speak to specialist" but no link/button |
| Trust signals lack icons | 🟢 Low | Checkmark is text, not icon |

### 4.5 Mobile Layout
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Sidebar hidden | ✅ | No duplicate buttons |
| Mobile CTA removed | 🟡 Medium | No quick action on mobile now |
| Image gallery height excessive | 🟡 Medium | Takes full viewport on mobile |

---

## 5. DEALER PAGES

### 5.1 Dealers List (/dealers)
| Issue | Severity | Details |
|-------|----------|---------|
| No search/filter | 🟡 Medium | Can't search dealers by name/location |
| Cards lack hover state | 🟡 Medium | Static, no interaction feedback |
| No map view | 🟢 Low | Could show dealer locations on map |

### 5.2 Dealer Detail (/dealers/[id])
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Responsive layout | ✅ | Stacks on mobile |
| Contact form lacks validation feedback | 🟡 Medium | Error shows but no field highlighting |
| No phone/email display | 🟡 Medium | Only contact form, no direct contact info |
| Dealer logo is just initials | 🟢 Low | Should support actual logo images |
| Listings grid lacks empty state styling | 🟢 Low | Plain text when no listings |

---

## 6. SELL PAGE (/sell)

### 6.1 Form UX
| Issue | Severity | Details |
|-------|----------|---------|
| Multi-step form lacks progress indicator | 🔴 High | Users don't know how many steps |
| No auto-save | 🔴 High | Form data lost on refresh |
| Image upload lacks preview | 🟡 Medium | Can't see uploaded images |
| Price field lacks format hint | 🟡 Medium | Users enter "$500,000" vs "500000" |
| No draft mode | 🟡 Medium | Must complete in one session |

### 6.2 Mobile
| Issue | Severity | Details |
|-------|----------|---------|
| Form fields are full-width (good) | ✅ | Proper mobile sizing |
| Step buttons small on mobile | 🟡 Medium | Back/Next could be larger |
| Textarea too small | 🟢 Low | 4 rows, could be 6 |

---

## 7. FINANCE PAGE (/finance)

### 7.1 Calculator
| Issue | Severity | Details |
|-------|----------|---------|
| Range sliders lack value labels | 🟡 Medium | Only show value above, not on track |
| No comparison feature | 🟡 Medium | Can't compare different scenarios |
| Results lack amortization schedule | 🟢 Low | Only monthly payment shown |

### 7.2 Form
| Issue | Severity | Details |
|-------|----------|---------|
| Form appears below calculator | 🟡 Medium | Could be in a modal or separate step |
| No loading state on submit | 🟢 Low | Button shows "Sending..." but no spinner |

---

## 8. AUTH PAGES (/login, /signup)

### 8.1 Login
| Issue | Severity | Details |
|-------|----------|---------|
| No "Remember me" option | 🟡 Medium | Users must log in every session |
| Password lacks show/hide toggle | 🟡 Medium | Can't verify password entry |
| No social login icons | 🟢 Low | Google button is text-only |

### 8.2 Signup
| Issue | Severity | Details |
|-------|----------|---------|
| Password requirements not shown | 🟡 Medium | Users don't know minimum requirements |
| No email verification flow | 🔴 High | Account created without verification |
| Account type selection lacks detail | 🟡 Medium | "Private" vs "Dealer" needs explanation |

---

## 9. DASHBOARD (/dashboard)

### 9.1 Layout
| Issue | Severity | Details |
|-------|----------|---------|
| Sidebar lacks active state | 🟡 Medium | Can't see which section is active |
| Mobile sidebar is full-screen | 🟡 Medium | Could be a sheet instead |
| No quick stats cards | 🟡 Medium | Could show saved count, listing views, etc |

### 9.2 Saved Aircraft
| Issue | Severity | Details |
|-------|----------|---------|
| No sort/filter | 🟢 Low | Can't sort saved listings |
| Empty state is plain | 🟢 Low | Could be more engaging |

### 9.3 My Listings
| Issue | Severity | Details |
|-------|----------|---------|
| No analytics/insights | 🟡 Medium | Dealer can't see listing performance |
| No duplicate/edit quick actions | 🟡 Medium | Must navigate to edit |

---

## 10. ADMIN PAGE (/admin)

### 10.1 Data Table
| Issue | Severity | Details |
|-------|----------|---------|
| Table not responsive | 🔴 High | Horizontal scroll on mobile |
| No bulk actions | 🟡 Medium | Can't select multiple rows |
| No export functionality | 🟡 Medium | Can't export to CSV/Excel |
| Search is client-side only | 🟢 Low | Could be server-side for large datasets |

---

## 11. PERFORMANCE & TECHNICAL

### 11.1 Loading States
| Issue | Severity | Details |
|-------|----------|---------|
| Skeleton loaders inconsistent | 🟡 Medium | Some pages have them, others don't |
| No error boundaries | 🔴 High | Crashes show blank screen |
| Loading spinners lack branding | 🟢 Low | Generic spinner, could be branded |

### 11.2 SEO
| Issue | Severity | Details |
|-------|----------|---------|
| Meta tags are static | 🟡 Medium | Same title/description on all pages |
| No structured data | 🟡 Medium | Missing JSON-LD for listings |
| No sitemap generation | 🟢 Low | Hardcoded sitemap.js |

### 11.3 Accessibility
| Issue | Severity | Details |
|-------|----------|---------|
| Missing ARIA labels | 🔴 High | Many buttons lack aria-label |
| Focus states inconsistent | 🟡 Medium | Some elements have focus, others don't |
| No skip-to-content link | 🟡 Medium | Keyboard users must tab through nav |
| Color contrast issues | 🟡 Medium | Some gray text may fail WCAG AA |
| No reduced-motion support | 🟡 Medium | Animations can't be disabled |

---

## 12. MOBILE-SPECIFIC ISSUES

### 12.1 Touch Targets
| Issue | Severity | Details |
|-------|----------|---------|
| ✅ Fixed: Filter chips | ✅ | Now 40px min-height |
| Pagination buttons small | 🟡 Medium | 40px × 40px, could be 44px |
| Card save button small | 🟡 Medium | Heart icon may be hard to tap |
| Nav links in hamburger menu | 🟡 Medium | Should be full-width for easy tapping |

### 12.2 Viewport Issues
| Issue | Severity | Details |
|-------|----------|---------|
| Input zoom on iOS | 🔴 High | Font size < 16px triggers zoom |
| Bottom sheet safe area | 🟡 Medium | Notch/home indicator overlap |
| Landscape mode untested | 🟡 Medium | May have layout issues |

### 12.3 Gestures
| Issue | Severity | Details |
|-------|----------|---------|
| No pull-to-refresh | 🟡 Medium | Users expect it on mobile |
| No swipe-to-dismiss on sheets | 🟡 Medium | Filter sheet needs swipe down |
| Image gallery lacks swipe | 🟡 Medium | Can't swipe between images |

---

## PRIORITY MATRIX

### 🔴 Critical (Fix Immediately)
1. **Split FlightSalesApp.jsx** — 7,148 lines is unmaintainable
2. **Add error boundaries** — Prevent blank screens on crashes
3. **Fix iOS input zoom** — Font size ≥ 16px on all inputs
4. **Add image lazy loading** — Critical for performance
5. **Email verification flow** — Security requirement

### 🟡 High (Fix This Week)
6. Standardize breakpoints across all components
7. Add drag-to-dismiss on mobile filter sheet
8. Add zoom/lightbox to listing images
9. Add form auto-save on sell page
10. Add search/filter to dealers list
11. Make admin table responsive
12. Add ARIA labels to all interactive elements

### 🟢 Medium (Fix Next Sprint)
13. Add hover states to all cards
14. Add count-up animation to stats
15. Add search history persistence
16. Add amortization schedule to finance
17. Add map view to dealers
18. Add structured data (JSON-LD)
19. Add skip-to-content link
20. Add reduced-motion support

### ⚪ Low (Backlog)
21. Add haptic feedback on mobile
22. Add search suggestions/autocomplete
23. Add bulk actions to admin table
24. Add export functionality
25. Add analytics to dashboard

---

## VERIFICATION CHECKLIST

Before shipping any fix, verify:
- [ ] Works on 375px viewport (iPhone SE)
- [ ] Works on 768px viewport (iPad)
- [ ] Works on 1440px viewport (desktop)
- [ ] Touch targets ≥ 44px
- [ ] Color contrast passes WCAG AA
- [ ] No console errors
- [ ] No layout shift
- [ ] Animations respect prefers-reduced-motion
