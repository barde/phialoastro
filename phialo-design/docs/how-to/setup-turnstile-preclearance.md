# Setting Up Cloudflare Turnstile with Pre-clearance

This guide explains how to configure and use Cloudflare Turnstile with pre-clearance in the Phialo Design website. Pre-clearance allows users to complete a single CAPTCHA challenge that validates them for multiple form submissions across the site.

## Overview

The implementation uses a centralized token management system that:
- Loads the Turnstile script globally for better performance
- Manages tokens centrally through React Context
- Executes challenges on-demand when needed
- Caches tokens for 5 minutes to reduce user friction
- Supports multiple actions with separate tokens

## Architecture

### Components

1. **TurnstileProvider** (`src/shared/contexts/TurnstileProvider.tsx`)
   - Central context for token management
   - Handles script loading and initialization
   - Manages token cache with expiration
   - Provides methods for getting and clearing tokens

2. **ClientProviders** (`src/shared/components/providers/ClientProviders.tsx`)
   - Wrapper component that sets up providers
   - Handles language detection for Turnstile
   - Conditionally renders based on configuration

3. **ContactFormWithPreClearance** (`src/features/contact/components/ContactFormWithPreClearance.tsx`)
   - Enhanced contact form that uses pre-clearance
   - Requests tokens on form submission
   - Shows loading/error states for Turnstile

4. **ContactFormWrapper** (`src/features/contact/components/ContactFormWrapper.tsx`)
   - Smart wrapper that chooses between pre-clearance and widget forms
   - Provides backward compatibility

## Setup Instructions

### 1. Configure Turnstile in Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Turnstile section
3. Create a new site or select existing one
4. Configure the widget:
   - **Widget Mode**: Managed (recommended)
   - **Pre-clearance**: Enable
   - **Pre-clearance Level**: See recommendations below
   - **Domains**: Add ALL of these domains:
     - `localhost` (for local development)
     - `localhost:4321` (Astro dev server)
     - `localhost:4322` (Alternative dev port)
     - `127.0.0.1` (IP-based access)
     - `phialo.de` (production domain)
     - `*.phialo.de` (subdomains)
     - `phialo-master.meise.workers.dev` (master preview)
     - `phialo-pr-*.meise.workers.dev` (PR previews)

> **Important**: Turnstile requires explicit domain configuration. If you see Error 110200, it means the current domain is not in the allowed list.

#### Choosing the Right Pre-clearance Level

For a jewelry e-commerce site with planned account system, we recommend:

**🔐 Managed Level (Recommended)**
- Best balance of security and user experience
- Allows users to bypass Managed and JavaScript challenges
- Ideal for contact forms, account registration, and general interactions

This level is recommended because:
- It provides adaptive security based on risk signals
- Users only see challenges when suspicious activity is detected
- Perfect for multi-form sites where you want smooth UX but need security

#### Pre-clearance Level Options Explained

| Level | Security | User Experience | Bypasses | Best For |
|-------|----------|-----------------|----------|----------|
| **Interactive** | Highest | Most friction | All challenge types | Payment processing, admin access |
| **Managed** | Medium | Adaptive | Managed & JS challenges | Forms, account systems, APIs |
| **Non-interactive** | Lowest | Frictionless | Only JS challenges | Public content, landing pages |

### 2. Set Environment Variables

Add your Turnstile site key to the environment:

```bash
# .env or .env.local
PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
```

The secret key should be set in your worker environment:
```bash
# For local development
echo "your_secret_key" | npx wrangler secret put TURNSTILE_SECRET_KEY

# For production (via GitHub Actions)
# Add TURNSTILE_SECRET_KEY to repository secrets
```

### 3. Implementation Details

#### Global Script Loading

The Turnstile script is loaded globally in `BaseLayout.astro`:
```astro
{import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && (
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
)}
```

#### Token Management

The `TurnstileProvider` manages tokens with these features:
- **Automatic caching**: Tokens are cached for 5 minutes
- **Action-based tokens**: Different forms can use different action names
- **Graceful degradation**: Falls back to per-widget mode if pre-clearance fails
- **Security levels**: Configurable per action (interactive, managed, non-interactive)

#### Security Level Configuration

The TurnstileProvider includes default security levels for different actions:

```typescript
// Default security levels (can be customized)
const securityLevels = {
  'contact-form': 'managed',        // Adaptive security
  'account-signup': 'managed',      // Balanced approach
  'account-login': 'managed',       // User-friendly
  'password-reset': 'interactive',  // High security
  'payment-form': 'interactive',    // Maximum protection
  'newsletter': 'non-interactive',  // Minimal friction
  'default': 'managed'              // Fallback
};
```

You can customize these levels when initializing the provider:

```tsx
<TurnstileProvider
  securityLevels={{
    'contact-form': 'interactive',  // Override to higher security
    'custom-action': 'managed',     // Add custom actions
  }}
>
  {children}
</TurnstileProvider>
```

#### Using Pre-clearance in Forms

To use pre-clearance in a form component:

```tsx
import { useTurnstile } from '@/shared/contexts/TurnstileProvider';

const MyForm = () => {
  const { getToken, isReady, error } = useTurnstile();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get a token for this specific action
      const token = await getToken('my-form-action');
      
      // Submit form with token
      await submitForm({ ...formData, turnstileToken: token });
    } catch (error) {
      // Handle Turnstile errors
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={!isReady}>Submit</button>
    </form>
  );
};
```

## Benefits of Pre-clearance

1. **Better User Experience**: Users complete CAPTCHA once, not for every form
2. **Improved Performance**: Script loaded once globally, not per component
3. **Centralized Management**: Single source of truth for token state
4. **Flexible Configuration**: Different actions can have different security levels
5. **Graceful Degradation**: Falls back to widget mode if needed

## Migration from Widget Mode

The implementation maintains backward compatibility:
- Existing `ContactForm` component still works with widget mode
- `ContactFormWrapper` automatically chooses the right implementation
- No breaking changes for existing integrations

To migrate a form to pre-clearance:
1. Import and use `useTurnstile` hook
2. Call `getToken()` on form submission
3. Remove the `TurnstileWidget` component
4. Handle loading and error states

## Troubleshooting

### Common Errors and Solutions

#### Error 110200: Invalid Site Key
This error occurs when:
- The domain is not in the Turnstile allowed list
- The site key is incorrect or malformed
- The domain includes a port that's not configured

**Solution**:
1. Go to Cloudflare Dashboard > Turnstile
2. Edit your site configuration
3. Add the exact domain and port you're using
4. Save and wait 30 seconds for propagation

#### Script Loading Issues
- Check browser console for CSP errors
- Verify the site key is correct
- Ensure domains are whitelisted in Cloudflare
- Check for multiple Turnstile script loads

#### Token Expiration
- Tokens expire after 5 minutes
- The provider automatically requests new tokens
- Expired tokens are cleaned up automatically
- **Important**: Tokens are single-use only and are removed from cache after use

#### Pre-clearance Not Working on Workers.dev Subdomains
**Important Limitation**: Cloudflare Turnstile's pre-clearance feature requires the site to be running on a proper Cloudflare Zone with custom domain configuration. It does **NOT** work on `*.workers.dev` subdomains.

**Symptoms**:
- First form submission works correctly
- Second submission fails with "Security verification failed" (HTTP 400)
- Console warning: "Cannot determine Turnstile's embedded location, aborting clearance redemption"

**Affected Environments**:
- ❌ `phialo-master.meise.workers.dev` - Pre-clearance will NOT work
- ❌ `phialo-pr-*.meise.workers.dev` - Pre-clearance will NOT work
- ✅ `phialo.de` - Pre-clearance WILL work (production with Cloudflare Zone)

**Testing Pre-clearance**:
- Pre-clearance features MUST be tested on the production environment (`phialo.de`)
- On workers.dev domains, each form submission will require a new token
- This is a Cloudflare platform limitation, not a code issue

### Development Environment

#### Using Test Keys
For local development without domain configuration, use these test keys:

```env
# Always passes (invisible challenge)
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Always blocks
PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB

# Forces interactive challenge
PUBLIC_TURNSTILE_SITE_KEY=3x00000000000000000000FF
```

#### Testing Checklist
- [ ] Turnstile script loads without errors
- [ ] No "multiple instances" warning in console
- [ ] Widget renders or executes invisibly
- [ ] Token is received on successful challenge
- [ ] Form submission includes the token
- [ ] Backend validates the token correctly
- [ ] **Production Only**: Test pre-clearance by submitting form twice on `phialo.de`
- [ ] **Note**: Pre-clearance will NOT work on `*.workers.dev` preview environments

## Security Considerations

1. **Never expose the secret key**: Only use it server-side
2. **Validate tokens server-side**: Always verify tokens in your backend
3. **Use appropriate actions**: Different forms should use different action names
4. **Monitor usage**: Check Cloudflare analytics for suspicious patterns

## Pre-clearance Strategy for Account System

### Recommended Implementation for Multi-Form Sites

For your planned account system with multiple forms (signup, login, password reset, etc.), here's the optimal pre-clearance strategy:

#### 1. Use Managed Pre-clearance Level

The **Managed level** is ideal for your use case because:
- **Adaptive Security**: Cloudflare automatically adjusts challenge difficulty based on risk
- **User-Friendly**: Most legitimate users won't see challenges after initial verification
- **Bot Protection**: Still blocks sophisticated bots and automated attacks
- **Cookie Duration**: Valid for 2-4 hours (configurable)

#### 2. Progressive Security Model

Implement different security levels for different areas:

```typescript
// Example: Different actions for different security needs
const securityActions = {
  'contact-form': 'managed',        // General inquiries
  'account-signup': 'managed',      // New user registration
  'account-login': 'managed',       // User authentication
  'password-reset': 'interactive',  // Higher security for account recovery
  'payment-form': 'interactive',    // Maximum security for payments
  'newsletter': 'non-interactive'   // Low friction for marketing
};
```

#### 3. Implementation Benefits

With Managed pre-clearance enabled:
- **First Visit**: User completes one Turnstile challenge
- **Subsequent Forms**: No additional challenges for 2-4 hours
- **Suspicious Activity**: Cloudflare may request re-verification
- **High-Risk Actions**: Can still require explicit token validation

#### 4. WAF Integration (Optional)

If using Cloudflare WAF, pre-clearance provides additional benefits:
- Automatic challenge bypass for validated users
- Protection against API abuse
- Rate limiting with user context

### Cookie Behavior and User Flow

1. **Initial Contact**: User visits site and completes contact form
   - Turnstile challenge shown (if needed)
   - `cf_clearance` cookie issued (Managed level)

2. **Account Creation**: User decides to create account
   - No additional challenge required
   - Cookie validates user as legitimate

3. **Future Visits**: User returns within cookie lifetime
   - Seamless form submissions
   - Enhanced user experience

4. **Security Escalation**: User attempts sensitive action
   - System can require new validation
   - Higher clearance level replaces existing cookie

## Future Enhancements

Potential improvements for the account system:
1. Implement user session tracking with clearance levels
2. Add progressive challenge difficulty based on user behavior
3. Create form-specific security policies
4. Add analytics for conversion tracking
5. Integrate with Cloudflare WAF for advanced protection
6. Implement A/B testing for optimal challenge timing