# Migration from Cloudflare Pages to Cloudflare Workers

## Problem Statement

Currently, Phialo Design is deployed using Cloudflare Pages, which provides excellent static site hosting with automatic builds from Git. However, migrating to Cloudflare Workers would provide several advantages:

1. **Enhanced Control**: Full control over request/response handling, enabling advanced features like A/B testing, dynamic routing, and custom caching strategies
2. **Edge Computing**: Execute server-side logic at the edge for personalization, authentication, and API integration
3. **Better Performance**: Optimize delivery with custom logic, conditional responses, and dynamic content generation
4. **Advanced Features**: Implement features like geolocation-based content, rate limiting, and custom analytics
5. **Unified Platform**: Leverage Workers ecosystem (KV, Durable Objects, R2) for future enhancements

## Migration Goals

### Primary Goals
1. **Zero Downtime Migration**: Seamlessly transition from Pages to Workers without service interruption
2. **Feature Parity**: Maintain all existing functionality including multilingual support, security headers, and caching
3. **Performance Improvement**: Leverage Workers' edge computing for faster response times
4. **Development Experience**: Maintain or improve local development and preview deployment workflows

### Secondary Goals
1. **Future-Ready Architecture**: Enable server-side features for upcoming requirements
2. **Cost Optimization**: Potentially reduce costs through optimized resource usage
3. **Enhanced Monitoring**: Implement custom analytics and performance tracking
4. **API Integration**: Prepare for potential backend API requirements

## Technical Analysis

### Current Pages Setup Summary

**Architecture:**
- Static site built with Astro 5.9.3
- React components with selective hydration (Islands Architecture)
- Multilingual support via URL-based routing
- Deployed via `wrangler pages deploy`

**Key Files:**
- `astro.config.mjs`: Astro configuration with i18n setup
- `public/_headers`: Security headers and caching rules
- `package.json`: Deployment scripts using wrangler
- Static assets served from `dist/` directory after build

**Current Deployment Flow:**
```bash
npm run build          # Builds to dist/
npm run deploy         # Deploys to Pages production
npm run deploy:preview # Deploys to Pages preview
```

### Workers Architecture Proposal

**Proposed Structure:**
```
phialo-design/
├── src/                    # Astro source (unchanged)
├── dist/                   # Built static assets
├── workers/
│   ├── index.ts           # Main Worker entry point
│   ├── handlers/          # Request handlers
│   │   ├── static.ts      # Static asset serving
│   │   ├── security.ts    # Security headers
│   │   └── cache.ts       # Caching logic
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
├── wrangler.toml          # Workers configuration
└── worker.config.ts       # Worker-specific config
```

**Key Components:**

1. **Asset Handling**: Serve static files from Workers Sites or R2
2. **Security Headers**: Implement CSP and other headers programmatically
3. **Caching Strategy**: Custom cache rules with Cache API
4. **Request Router**: Handle different content types and routes
5. **Error Handling**: Custom 404/500 pages with proper fallbacks

### Key Differences and Challenges

**Differences:**
1. **Deployment**: From `pages deploy` to `workers deploy`
2. **Asset Serving**: Need to implement static file serving logic
3. **Headers**: Move from `_headers` file to programmatic implementation
4. **Routing**: Handle Astro's file-based routing in Worker
5. **Build Process**: Additional Worker bundling step

**Challenges:**
1. **Asset Management**: Efficiently serve large static assets
2. **Development Parity**: Maintain smooth local development experience
3. **Preview URLs**: Ensure PR preview deployments work seamlessly
4. **Caching Complexity**: Implement cache invalidation strategies
5. **Migration Risk**: Ensure rollback capability

## Implementation Plan

### Phase 1: Setup and Preparation (Week 1)

1. **Create Worker Structure**
   - [ ] Initialize Workers project alongside existing Pages setup
   - [ ] Set up TypeScript configuration for Workers
   - [ ] Create basic Worker entry point

2. **Asset Management Setup**
   - [ ] Configure Workers Sites or R2 for static assets
   - [ ] Create asset manifest generation script
   - [ ] Implement basic static file serving

3. **Development Environment**
   - [ ] Set up local Worker development with Miniflare
   - [ ] Create development proxy for Astro dev server
   - [ ] Document new development workflow

### Phase 2: Core Implementation (Week 2)

4. **Request Handling**
   - [ ] Implement request router
   - [ ] Port security headers from `_headers`
   - [ ] Add caching logic with Cache API
   - [ ] Handle 404/error pages

5. **Multilingual Support**
   - [ ] Ensure language switching works
   - [ ] Handle language detection and routing
   - [ ] Test cookie persistence

6. **Build Pipeline**
   - [ ] Update build scripts in package.json
   - [ ] Create Worker bundling process
   - [ ] Generate asset manifest during build

### Phase 3: Testing and Validation (Week 3)

7. **Testing Suite**
   - [ ] Create Worker-specific tests
   - [ ] Test all routes and content types
   - [ ] Validate security headers
   - [ ] Performance benchmarking

8. **Preview Deployments**
   - [ ] Set up preview Worker deployments
   - [ ] Configure GitHub Actions for PR previews
   - [ ] Test preview URL generation

9. **Load Testing**
   - [ ] Simulate production traffic
   - [ ] Test edge cases and error scenarios
   - [ ] Validate caching behavior

### Phase 4: Migration and Monitoring (Week 4)

10. **Staged Migration**
    - [ ] Deploy Worker to production (not connected to domain)
    - [ ] Test with production-like traffic
    - [ ] Monitor performance metrics

11. **DNS Cutover**
    - [ ] Create detailed cutover plan
    - [ ] Switch DNS to Worker
    - [ ] Monitor for issues

12. **Post-Migration**
    - [ ] Monitor error rates and performance
    - [ ] Collect user feedback
    - [ ] Document lessons learned

## Development Workflow

### Local Development

```bash
# Terminal 1: Run Astro dev server
npm run dev

# Terminal 2: Run Worker with proxy to Astro
npm run worker:dev

# Access site at http://localhost:8787 (Worker)
# Worker proxies to Astro dev server for development
```

### Worker Development Scripts

```json
{
  "scripts": {
    "worker:dev": "wrangler dev workers/index.ts --local",
    "worker:build": "npm run build && npm run worker:bundle",
    "worker:bundle": "esbuild workers/index.ts --bundle --outfile=dist/_worker.js",
    "worker:deploy": "npm run worker:build && wrangler deploy",
    "worker:preview": "npm run worker:build && wrangler deploy --env preview"
  }
}
```

### PR Preview URLs

1. **GitHub Action Workflow**:
   - Trigger on PR creation/update
   - Build Astro site
   - Bundle Worker
   - Deploy to preview environment
   - Comment PR with preview URL

2. **Preview URL Format**:
   - Production: `https://phialo.de`
   - Preview: `https://preview-{pr-number}.phialo.workers.dev`

## Testing Strategy

### Unit Tests
- Test Worker request handlers in isolation
- Validate header injection logic
- Test caching strategies
- Verify routing logic

### Integration Tests
- Test full request/response cycle
- Validate static asset serving
- Test multilingual routing
- Verify security headers

### E2E Tests
- Use existing Playwright tests
- Add Worker-specific scenarios
- Test preview deployments
- Validate production behavior

### Performance Tests
- Measure TTFB (Time to First Byte)
- Test concurrent request handling
- Validate cache hit rates
- Monitor Worker CPU time

## Rollback Plan

### Preparation
1. Keep Pages deployment active but not connected to domain
2. Document current Pages configuration
3. Create rollback runbook

### Rollback Steps
1. **Immediate Rollback** (< 5 minutes):
   ```bash
   # Switch DNS back to Pages
   wrangler pages:rollback
   ```

2. **Monitoring**:
   - Check site availability
   - Verify all pages load correctly
   - Monitor error rates

3. **Communication**:
   - Notify team of rollback
   - Document issues encountered
   - Plan remediation

### Rollback Criteria
- Site availability drops below 99%
- Error rate exceeds 1%
- Performance degradation > 20%
- Critical functionality broken

## Success Criteria

### Technical Metrics
- [ ] **Performance**: TTFB ≤ 50ms (p95)
- [ ] **Availability**: 99.9% uptime
- [ ] **Error Rate**: < 0.1%
- [ ] **Cache Hit Rate**: > 90% for static assets
- [ ] **Build Time**: < 5 minutes for full deployment

### Functional Requirements
- [ ] All pages load correctly in both languages
- [ ] Language switching functions properly
- [ ] Security headers present on all responses
- [ ] Preview deployments work for PRs
- [ ] Local development experience maintained

### Operational Goals
- [ ] Zero downtime during migration
- [ ] Rollback possible within 5 minutes
- [ ] Monitoring and alerting configured
- [ ] Documentation complete and accurate
- [ ] Team trained on new workflow

## Risk Mitigation

### Identified Risks

1. **Asset Serving Performance**
   - *Risk*: Large assets may impact Worker performance
   - *Mitigation*: Use R2 or Cache API for efficient serving

2. **Development Complexity**
   - *Risk*: More complex development setup
   - *Mitigation*: Comprehensive tooling and documentation

3. **Cost Overruns**
   - *Risk*: Workers pricing model may increase costs
   - *Mitigation*: Monitor usage and optimize accordingly

4. **Migration Failures**
   - *Risk*: Issues during DNS cutover
   - *Mitigation*: Tested rollback plan and monitoring

## Timeline

- **Week 1**: Setup and Preparation
- **Week 2**: Core Implementation
- **Week 3**: Testing and Validation
- **Week 4**: Migration and Monitoring
- **Week 5**: Post-migration optimization and documentation

## Resources Required

### Technical Resources
- Cloudflare Workers account with sufficient limits
- R2 bucket for asset storage (optional)
- GitHub Actions minutes for CI/CD
- Monitoring tools (Workers Analytics, external monitoring)

### Team Resources
- Developer time for implementation
- DevOps support for migration
- QA resources for testing
- Documentation time

## Next Steps

1. Review and approve migration plan
2. Set up Workers development environment
3. Create proof of concept with basic functionality
4. Schedule migration timeline
5. Begin Phase 1 implementation

---

**Issue Labels**: `enhancement`, `infrastructure`, `migration`, `cloudflare-workers`

**Assignees**: TBD

**Milestone**: Q1 2025 Infrastructure Improvements