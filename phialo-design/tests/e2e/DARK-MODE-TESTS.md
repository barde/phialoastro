# Dark Mode E2E Tests Documentation

## Overview

This document describes the comprehensive end-to-end tests for the dark mode functionality in the Phialo Design website. The tests are located in `/tests/e2e/dark-mode.spec.ts` and use Playwright for browser automation.

## Test Coverage

The test suite covers all 10 requested scenarios plus additional tests:

### 1. Theme Toggle Button Existence and Clickability
- Verifies the theme toggle button is visible in the header
- Checks that it's enabled and has proper styling
- Validates the aria-label attribute for accessibility

### 2. Theme Switching Functionality
- Tests clicking the toggle switches between light and dark modes
- Verifies the `dark` class is added/removed from the `<html>` element
- Checks that the aria-label updates to reflect the current state

### 3. Background Color Changes
- Validates that the body background color changes from white (light mode) to dark blue (dark mode)
- Uses regex patterns to match RGB values accounting for browser differences

### 4. Text Color Changes
- Checks that heading and text colors change appropriately
- Light mode: dark text (rgb(17, 24, 39))
- Dark mode: light text (rgb(241, 245, 249))
- Handles multiple elements safely to avoid strict mode violations

### 5. Theme Persistence After Reload
- Verifies that the selected theme is saved to localStorage
- Confirms the theme preference persists after page reload
- Checks that the toggle button shows the correct state

### 6. Theme Persistence During Navigation
- Tests that the theme remains active when navigating between pages
- Covers multiple routes: /portfolio, /services, /contact, /about
- Ensures consistent experience across the site

### 7. System Preference Respect
- Tests with both light and dark system preferences
- Verifies that the initial theme matches the system preference
- Confirms that the preference is saved to localStorage

### 8. Component Rendering in Both Themes
- Validates that major components render correctly in both themes
- Tests header, navigation, footer, hero section, and buttons
- Ensures colors change appropriately for each component

### 9. Smooth Theme Transitions
- Verifies that CSS transitions are applied for smooth theme switching
- Checks that background-color transitions are 0.3s duration
- Validates multiple elements have transition effects

### 10. No Flash of Incorrect Theme (FOIT)
- Tests that there's no flash of the wrong theme on page load
- Uses MutationObserver to monitor theme changes during load
- Ensures the saved theme is applied before the page renders

### Additional Tests

#### Theme Toggle Icon Changes
- Verifies the sun icon is visible in light mode
- Confirms the moon icon is visible in dark mode
- Tests smooth opacity transitions between icons

#### Theme with Language Switching
- Ensures dark mode persists when switching languages
- Tests integration with the Weglot language selector

#### Keyboard Accessibility
- Validates that the theme toggle can be focused via keyboard
- Tests Enter and Space key activation
- Skips on mobile devices where keyboard testing isn't applicable

#### Cross-Tab Persistence
- Verifies theme preference is shared across browser tabs
- Uses the same browser context to test localStorage sharing

#### Mobile Viewport Testing
- Tests theme functionality on mobile viewports
- Ensures the toggle remains accessible on small screens
- Validates mobile menu rendering in dark mode

## Running the Tests

```bash
# Run all dark mode tests
npm run test:e2e -- tests/e2e/dark-mode.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui -- tests/e2e/dark-mode.spec.ts

# Run a specific test
npm run test:e2e -- tests/e2e/dark-mode.spec.ts -g "Theme toggle button exists"
```

## Test Configuration

The tests run on multiple browsers and devices as configured in `playwright.config.ts`:
- Desktop: Chromium, Firefox, WebKit
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)

## Implementation Details

### Helper Functions

- `clearThemePreference()`: Clears localStorage before tests
- `isDarkModeActive()`: Checks if the dark class is present
- `getComputedStyle()`: Gets computed CSS property values

### Theme Implementation

The dark mode uses:
- Tailwind's class-based approach with a `dark` class on the `<html>` element
- CSS custom properties for theme colors
- localStorage for persistence
- System preference detection via `prefers-color-scheme`

### Key Selectors

- Theme toggle: `button[aria-label*="mode"]`
- Dark mode class: `html.dark`
- Theme colors are defined in `/src/styles/theme.css`

## Common Issues and Solutions

1. **Strict Mode Violations**: Use `.first()` or specific selectors to avoid multiple element matches
2. **Mobile Compatibility**: Some APIs like `evaluateOnNewDocument` aren't available on all browsers
3. **Timing Issues**: Add appropriate waits for transitions (400ms)
4. **Focus Management**: Use `.focus()` method instead of Tab key navigation for reliability

## Color Values Reference

Light Mode:
- Background: rgb(255, 255, 255)
- Text: rgb(17, 24, 39)

Dark Mode:
- Background: rgb(10, 25, 47)
- Text: rgb(241, 245, 249)

## Future Enhancements

- Add visual regression tests for theme switching
- Test theme persistence across sessions
- Add performance metrics for theme switching
- Test theme with dynamic content loading