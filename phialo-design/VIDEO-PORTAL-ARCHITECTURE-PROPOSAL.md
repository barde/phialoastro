# Video Portal Architecture Proposal for Phialo Design

## Executive Summary

This proposal outlines a comprehensive architecture for adding a video learning portal to Phialo Design, featuring:
- Social and email authentication with OTP
- Video purchases (individual, bundles, subscriptions)
- 1:1 consultation booking system
- Secure video delivery and DRM
- Scalable edge-first architecture using Cloudflare ecosystem

## 1. Business Requirements

### 1.1 Authentication & User Management
- **Social Login**: Google, Apple, GitHub OAuth
- **Email Login**: Magic link/OTP authentication (no permanent passwords)
- **User Profiles**: Purchase history, active subscriptions, bookings
- **Multi-language**: German/English support

### 1.2 Content & Commerce
- **Video Library**: Categorized tutorials, courses, masterclasses
- **Purchase Options**:
  - Individual videos (one-time purchase)
  - Video bundles/series
  - Monthly/yearly subscriptions
  - First-timer discounts
- **1:1 Consultations**:
  - 30min, 60min, 90min sessions
  - Special "first-timer" rates
  - Calendar integration
  - Video call links (Zoom/Google Meet)

### 1.3 Technical Requirements
- **Performance**: Sub-2s page loads
- **Security**: DRM for videos, secure payments
- **Scalability**: Handle 10,000+ users
- **Availability**: 99.9% uptime
- **Mobile-first**: Responsive video player

## 2. Proposed Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Astro + React)                 │
├─────────────────────────────────────────────────────────────────┤
│                     Cloudflare Workers (API Layer)               │
├─────────────────────────────────────────────────────────────────┤
│  Auth     │  Commerce  │  Video     │  Booking   │  Analytics   │
│  Service  │  Service   │  Service   │  Service   │  Service     │
├───────────┼────────────┼────────────┼────────────┼──────────────┤
│ CF Access │ Stripe API │ CF Stream  │ Cal.com    │ CF Analytics │
│ Auth0/    │ PayPal     │ + R2       │ Google Cal │ Mixpanel     │
│ Supabase  │            │            │            │              │
├───────────┴────────────┴────────────┴────────────┴──────────────┤
│              Data Layer (Cloudflare D1 + KV + R2)               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

#### Frontend Layer
- **Framework**: Astro (existing) + React for portal components
- **Video Player**: Video.js or Plyr with DRM support
- **Payment UI**: Stripe Elements or PayPal SDK
- **Calendar UI**: Custom React component with Cal.com integration
- **State Management**: Zustand or Context API
- **Authentication**: NextAuth.js adapter for Astro

#### API Layer (Cloudflare Workers)
- **Runtime**: Workers with Durable Objects for sessions
- **API Design**: RESTful with GraphQL considerations
- **Authentication**: JWT with refresh tokens in KV
- **Rate Limiting**: Workers rate limiting
- **Caching**: Aggressive caching for video metadata

#### Data Storage
- **Database**: Cloudflare D1 (SQLite)
  - Users, purchases, subscriptions
  - Video metadata, categories
  - Booking slots, consultations
- **Session Store**: Cloudflare KV
- **Video Storage**: Cloudflare R2 (S3-compatible)
- **CDN**: Cloudflare Stream for video delivery

#### External Services
- **Authentication**: 
  - Option A: Auth0 (managed)
  - Option B: Supabase Auth (self-hosted option)
  - Option C: Custom with Cloudflare Access
- **Payments**: 
  - Primary: Stripe (subscriptions, one-time)
  - Secondary: PayPal (additional option)
- **Booking**: 
  - Cal.com API or custom implementation
  - Google Calendar integration
- **Email**: 
  - SendGrid/Postmark for transactional emails
  - OTP delivery, purchase confirmations

### 2.3 Database Schema (D1)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'de',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Authentication
CREATE TABLE auth_providers (
  user_id TEXT REFERENCES users(id),
  provider TEXT NOT NULL, -- 'google', 'email', 'apple'
  provider_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, provider)
);

-- Videos
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title_de TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  category TEXT,
  skill_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  price_cents INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  video_id TEXT REFERENCES videos(id),
  price_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  payment_provider TEXT,
  payment_id TEXT,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  plan_type TEXT, -- 'monthly', 'yearly'
  status TEXT, -- 'active', 'cancelled', 'expired'
  price_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultations
CREATE TABLE consultation_slots (
  id TEXT PRIMARY KEY,
  instructor_id TEXT,
  start_time TIMESTAMP,
  duration_minutes INTEGER,
  price_cents INTEGER,
  is_first_timer_rate BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'available', -- 'available', 'booked', 'completed'
  booked_by TEXT REFERENCES users(id),
  meeting_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 Security Architecture

#### Authentication Flow
```
1. User initiates login (social/email)
2. Workers validate with provider
3. Generate JWT + refresh token
4. Store session in KV (TTL: 7 days)
5. Return tokens to frontend
6. Frontend stores in httpOnly cookies
```

#### Video Security
- **DRM**: Cloudflare Stream DRM for premium content
- **Signed URLs**: Time-limited access tokens
- **Watermarking**: Dynamic user email overlay
- **Download Prevention**: Encrypted HLS streaming
- **Geographic Restrictions**: Via Workers

#### Payment Security
- **PCI Compliance**: No card data stored
- **Webhook Validation**: Stripe/PayPal signatures
- **Idempotency**: Prevent duplicate charges
- **Fraud Detection**: Stripe Radar integration

### 2.5 API Design

#### RESTful Endpoints

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

// Videos
GET    /api/videos                 // List with filters
GET    /api/videos/:id            // Video details
GET    /api/videos/:id/stream     // Get streaming URL
POST   /api/videos/:id/purchase   // Purchase single video

// Subscriptions
GET    /api/subscriptions/plans
POST   /api/subscriptions/create
POST   /api/subscriptions/cancel
GET    /api/subscriptions/status

// Consultations
GET    /api/consultations/slots
POST   /api/consultations/book
GET    /api/consultations/my-bookings
POST   /api/consultations/cancel

// User
GET    /api/user/purchases
GET    /api/user/profile
PATCH  /api/user/profile
```

## 3. Implementation Phases

### Phase 1: Foundation (4-6 weeks)
1. **Database Setup**
   - Initialize Cloudflare D1
   - Create schema and migrations
   - Seed test data

2. **Authentication System**
   - Implement OAuth providers
   - Email OTP system
   - Session management
   - Protected routes

3. **Basic UI**
   - Login/register pages
   - User dashboard
   - Video library layout

### Phase 2: Commerce (6-8 weeks)
1. **Payment Integration**
   - Stripe setup and webhooks
   - Subscription management
   - Purchase flow UI
   - Invoice generation

2. **Video Infrastructure**
   - Cloudflare Stream setup
   - Upload pipeline
   - DRM configuration
   - Player integration

3. **Content Management**
   - Admin panel for videos
   - Categorization system
   - Pricing management

### Phase 3: Consultations (4-6 weeks)
1. **Booking System**
   - Calendar integration
   - Availability management
   - Booking UI
   - Reminder emails

2. **Video Calls**
   - Meeting link generation
   - Calendar invites
   - Follow-up automation

### Phase 4: Polish & Launch (4 weeks)
1. **Performance Optimization**
   - Lazy loading
   - CDN optimization
   - Bundle splitting

2. **Testing & QA**
   - E2E test suite
   - Load testing
   - Security audit

3. **Documentation**
   - User guides
   - API documentation
   - Admin manual

## 4. Cost Analysis

### Monthly Operational Costs (EUR)
```
Cloudflare Workers: €5-20 (based on requests)
Cloudflare Stream: €1 per 1,000 minutes viewed
Cloudflare R2: €0.015 per GB stored
Cloudflare D1: €5 base + usage
Auth Provider: €0-500 (depends on MAU)
Email Service: €10-100
Payment Processing: 2.9% + €0.30 per transaction
Calendar/Booking: €0-50
---
Estimated Total: €100-500/month (scaling with usage)
```

### Development Costs
- Phase 1: 160-240 hours
- Phase 2: 240-320 hours
- Phase 3: 160-240 hours
- Phase 4: 160 hours
- **Total**: 720-960 hours

## 5. Technical Considerations

### 5.1 Performance Optimization
- **Edge Caching**: Cache video metadata at edge
- **Lazy Loading**: Load videos on demand
- **Progressive Enhancement**: Basic features work without JS
- **Image Optimization**: Automatic WebP/AVIF conversion

### 5.2 Scalability
- **Horizontal Scaling**: Workers scale automatically
- **Database Sharding**: D1 supports read replicas
- **CDN Distribution**: Global video delivery
- **Queue Management**: Durable Objects for job processing

### 5.3 Monitoring & Analytics
- **Error Tracking**: Sentry integration
- **Performance**: Cloudflare Analytics
- **Business Metrics**: Custom dashboard
- **Video Analytics**: Engagement tracking

### 5.4 Compliance & Legal
- **GDPR**: Data privacy controls
- **Cookie Consent**: Granular permissions
- **Terms of Service**: Video usage rights
- **Refund Policy**: Automated handling

## 6. Migration Strategy

### 6.1 Gradual Rollout
1. **Beta Access**: Limited user testing
2. **Soft Launch**: Existing customers only
3. **Public Launch**: Full marketing push
4. **Legacy Support**: Maintain Skillshare links

### 6.2 Data Migration
- Import existing customer emails
- Offer migration incentives
- Grandfather pricing for early adopters

## 7. Success Metrics

### Technical KPIs
- Page Load Time: < 2s
- Video Start Time: < 3s
- Uptime: > 99.9%
- Error Rate: < 0.1%

### Business KPIs
- Monthly Active Users
- Conversion Rate (visitor → paid)
- Average Revenue Per User
- Consultation Booking Rate
- Churn Rate

## 8. Risk Analysis

### Technical Risks
- **Vendor Lock-in**: Mitigated by using standards
- **Scaling Issues**: Cloudflare's proven scale
- **Security Breaches**: Regular audits, best practices

### Business Risks
- **Competition**: Unique positioning, quality content
- **Payment Disputes**: Clear policies, good support
- **Content Piracy**: DRM, watermarking, legal action

## 9. Alternatives Considered

### 9.1 Third-Party Platforms
- **Teachable/Thinkific**: Less control, higher fees
- **Vimeo OTT**: Limited customization
- **Custom WordPress**: Performance concerns

### 9.2 Architecture Options
- **Traditional Server**: Higher costs, maintenance
- **Serverless (AWS)**: More complex, expensive
- **Jamstack + APIs**: Chosen approach

## 10. Conclusion

This architecture provides a scalable, secure, and performant foundation for Phialo Design's video portal. By leveraging Cloudflare's edge network and modern web technologies, we can deliver a premium user experience while maintaining reasonable costs and development complexity.

The phased approach allows for iterative development and validation, reducing risk and ensuring each component is thoroughly tested before moving to the next phase.

## Appendix A: Technology Decisions

### Why Cloudflare Ecosystem?
1. **Edge Performance**: Global distribution
2. **Integrated Stack**: Fewer vendors to manage
3. **Cost Effective**: Predictable pricing
4. **Security**: Built-in DDoS, WAF
5. **Developer Experience**: Modern APIs

### Why Astro + React?
1. **Existing Investment**: Reuse current site
2. **Performance**: Static where possible
3. **Flexibility**: React for complex UIs
4. **SEO**: Excellent Core Web Vitals

### Why Stripe + PayPal?
1. **Market Coverage**: 95%+ users covered
2. **Subscription Support**: Built-in recurring
3. **Global Reach**: Multi-currency support
4. **Developer Friendly**: Excellent APIs