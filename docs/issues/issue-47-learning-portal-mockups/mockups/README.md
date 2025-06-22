# Learning Portal Mockups

This directory contains browsable HTML mockups for the Phialo Design Learning Portal, demonstrating three different architectural approaches.

## Viewing the Mockups

### Option 1: Local File System
Simply open `index.html` in your web browser to see all mockups with navigation.

### Option 2: Local Web Server
For the best experience, serve the files with a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000/mockups/`

## Mockup Files

1. **`index.html`** - Overview page with all mockups and comparison
2. **`learning-portal-integrated.html`** - Integrated approach within main site
3. **`learning-portal-standalone.html`** - Standalone platform approach
4. **`learning-portal-hybrid.html`** - Hybrid approach (RECOMMENDED)

## Design Approach Comparison

### Integrated Approach
- Seamlessly embedded within existing website
- Unified navigation and accounts
- Cost: €120-140k, 3-4 months

### Standalone Platform
- Dedicated learning platform at learn.phialo.de
- Advanced LMS features
- Cost: €180-200k, 5-6 months

### Hybrid Solution ⭐ RECOMMENDED
- Semi-integrated at phialo.de/academy
- Best balance of features and cost
- Cost: €150-170k, 4-5 months

## Technical Notes

- All mockups are self-contained HTML files
- No external dependencies required
- Responsive design included
- Uses Google Fonts (Playfair Display, Inter)
- Modern CSS with custom properties

## Related Documentation

- [Full Analysis](../LEARNING-PORTAL-MOCKUPS.md)
- [GitHub Issue #41](https://github.com/barde/phialoastro/issues/41) - Architecture Proposal
- [GitHub Issue #47](https://github.com/barde/phialoastro/issues/47) - UI/UX Design Analysis

## Color Palette

```css
--gold: #D4AF37;
--midnight: #1a1a2e;
--pearl: #F8F6F3;
--academy-gold: #C9A961;
--academy-black: #0A0A0A;
```

## Next Steps

1. Review mockups with stakeholders
2. Gather feedback on preferred approach
3. Refine chosen design
4. Create detailed component specifications
5. Begin implementation phase