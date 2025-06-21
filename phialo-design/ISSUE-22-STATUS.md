# Issue #22 Status Report

## Problem
Portfolio modal shows German text on English pages due to automatic language preference redirect.

## Root Cause
The LanguageSelector component (src/components/layout/LanguageSelector.astro) automatically redirects users based on their stored language preference. When visiting `/en/portfolio`, if the stored preference is 'de', it redirects to `/portfolio`, causing the language detection to fail.

## Attempted Solutions

1. **Prop Passing** ✅ 
   - Successfully configured Astro pages to pass `lang` prop to Portfolio component
   - Props are correctly serialized in HTML: `props="{&quot;lang&quot;:[0,&quot;en&quot;]}"`

2. **Translation Logic** ✅
   - Added category translations in PortfolioModal component
   - Added availability translations
   - Added all UI label translations

3. **Language Detection** ❌
   - URL-based detection fails due to redirect
   - Props are passed but redirect happens before component can use them

## Current State
- English portfolio page (`/en/portfolio`) redirects to German page (`/portfolio`)
- Modal shows German text regardless of initial URL
- Translations are implemented but not working due to redirect issue

## Recommended Fix
Modify LanguageSelector component to:
1. Allow users to temporarily override stored preferences when explicitly navigating to a different language
2. Only apply automatic redirect on homepage, not all pages
3. Add a query parameter to bypass automatic redirect (e.g., `?force-lang=en`)

## Files Modified
- src/components/common/PortfolioModal.tsx (added translations)
- src/components/sections/Portfolio.tsx (updated to accept lang prop)
- src/pages/en/portfolio/index.astro (passes lang="en")
- src/pages/portfolio/index.astro (passes lang="de")

## Test Results
- Manual testing shows German text on English pages
- E2E tests fail due to timing/hydration issues
- Screenshot evidence saved as portfolio-english-final.png