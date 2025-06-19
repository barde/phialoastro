# Translation Setup Guide

This document explains how to set up the language translation feature for the Phialo Design website.

## Overview

The website now includes a professional language selector with support for multiple translation services:

- **Primary**: Weglot (Professional translation service)
- **Fallback**: Google Translate (Free but basic)

## Supported Languages

- 🇩🇪 German (Deutsch) - Original language
- 🇬🇧 English
- 🇫🇷 French (Français)
- 🇪🇸 Spanish (Español)
- 🇮🇹 Italian (Italiano)
- 🇳🇱 Dutch (Nederlands)

## Setup Instructions

### Option 1: Weglot (Recommended)

Weglot is a professional translation service that provides:
- High-quality translations
- SEO-friendly URLs
- Professional styling
- Real-time content translation

**Setup Steps:**

1. **Sign up for Weglot**: Go to [weglot.com](https://www.weglot.com)
2. **Get your API key**: After creating an account, get your API key from the dashboard
3. **Configure environment**: Set your API key in your environment variables:
   ```bash
   PUBLIC_WEGLOT_API_KEY=your_actual_api_key_here
   ```
4. **Deploy**: The language selector will automatically use Weglot when a valid API key is detected

**Pricing**: Weglot offers a free tier for small websites and paid plans for larger sites.

### Option 2: Google Translate (Fallback)

If no Weglot API key is configured, the system automatically falls back to Google Translate.

**Note**: Google Translate Widget has limitations:
- Less reliable for professional websites
- Limited styling options
- May not work consistently with modern frameworks

## Technical Implementation

### Files Modified

- `src/components/layout/LanguageSelector.tsx` - Main language selector component
- `src/components/layout/Navigation.tsx` - Desktop navigation integration
- `src/components/layout/MobileMenu.tsx` - Mobile menu integration
- Tests updated to reflect new functionality

### Features

- **Smart Fallback**: Automatically chooses the best available translation service
- **6 Languages**: Support for German, English, French, Spanish, Italian, and Dutch
- **Professional UI**: Custom-styled dropdown that matches the website design
- **Mobile Responsive**: Works seamlessly on both desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Testing**: Comprehensive test suite ensures reliability

### API Integration

The language selector intelligently detects which translation service to use:

```typescript
// Check for Weglot API key
const weglotApiKey = process.env.PUBLIC_WEGLOT_API_KEY;

if (weglotApiKey && weglotApiKey !== 'your-api-key-here') {
  // Use Weglot (preferred)
  initializeWeglot(weglotApiKey);
} else {
  // Fall back to Google Translate
  initializeGoogleTranslate();
}
```

## Testing

The translation feature includes comprehensive tests:

```bash
npm test  # All tests should pass (48/48)
```

## Deployment

1. **For Production with Weglot**: Set the `PUBLIC_WEGLOT_API_KEY` environment variable
2. **For Development/Demo**: The system will automatically fall back to Google Translate

## Best Practices

1. **Use Weglot for Production**: It provides better quality and reliability
2. **Test All Languages**: Verify translations work correctly for your content
3. **SEO Considerations**: Weglot provides SEO-friendly translated URLs
4. **Content Strategy**: Consider creating some manually translated content for key pages

## Troubleshooting

**Translation not working?**
- Check browser console for errors
- Verify API key is correctly set (for Weglot)
- Ensure scripts are loading correctly

**Styling issues?**
- The component uses Tailwind CSS classes
- Custom styling can be modified in `LanguageSelector.tsx`

**Mobile issues?**
- Test on actual mobile devices
- Check that the dropdown closes properly

## Support

For issues specific to:
- **Weglot**: Check [Weglot documentation](https://support.weglot.com/)
- **Google Translate**: Limited support available
- **Website Integration**: Contact the development team