# Nightly Tests Quick Reference

## Workflow Location
`.github/workflows/nightly-tests.yml`

## Schedule
Daily at 2:00 AM UTC

## Manual Trigger
```bash
# Via GitHub UI: Actions → Nightly Comprehensive Tests → Run workflow

# Via GitHub CLI:
gh workflow run nightly-tests.yml \
  -f test_suites="unit,integration,e2e,performance,security" \
  -f node_versions="18,20,22" \
  -f browsers="chromium,firefox,webkit" \
  -f os_variants="ubuntu,alpine" \
  -f skip_security=false
```

## Test Suites

### Unit Tests
- **Command**: `npm run test:unit:coverage`
- **Config**: `vitest.config.ts`
- **Coverage**: Uploaded to Codecov
- **Matrix**: All Node versions × OS variants

### Integration Tests
- **Command**: `npm run test:integration`
- **Config**: `vitest.integration.config.ts`
- **Focus**: API and service integration

### E2E Tests
- **Command**: `playwright test`
- **Browsers**: Chromium, Firefox, WebKit
- **Shards**: 6 parallel shards
- **Retries**: 2 attempts for flaky tests

### Performance Tests
- **Tools**: Lighthouse CI, custom benchmarks
- **Metrics**: Bundle size, load time, memory usage
- **Limits**: 
  - Bundle: < 350KB
  - LCP: < 2.5s
  - CLS: < 0.1

### Security Tests
- **Container**: `ghcr.io/barde/phialo-security:latest`
- **Tools**:
  - npm audit
  - Snyk
  - OWASP Dependency Check
  - Trivy (container scanning)
  - TruffleHog (secret detection)
  - Semgrep (SAST)

## Key Scripts

### Local Testing
```bash
# Run unit tests with coverage
npm run test:unit:coverage

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run E2E tests (all browsers)
npm run test:e2e:nightly
```

### Security Scanning
```bash
# Run npm audit
npm audit

# Run dependency check
dependency-check --project "Phialo" --scan .

# Run container security scan
trivy image ghcr.io/barde/phialo-test:latest
```

## Artifacts

### Location
GitHub Actions → Workflow Run → Artifacts

### Types
- `test-results-unit-*`: Unit test results and coverage
- `e2e-results-*`: E2E test results by browser/shard
- `performance-results`: Lighthouse and perf reports
- `security-results`: All security scan reports
- `nightly-test-report`: Comprehensive summary

### Retention
- Test results: 7-14 days
- Performance/Security: 30 days
- Nightly reports: 90 days

## Failure Handling

### Automatic Actions
1. GitHub issue created with failure details
2. Artifact upload for debugging
3. Summary in GitHub Actions

### Manual Investigation
```bash
# Download artifacts
gh run download <run-id>

# View logs
gh run view <run-id> --log

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## Configuration Files

- **Lighthouse**: `phialo-design/.lighthouserc.js`
- **Vitest Integration**: `phialo-design/vitest.integration.config.ts`
- **Security Suppressions**: `phialo-design/dependency-check-suppression.xml`
- **Performance Scripts**: `phialo-design/scripts/performance-tests.js`

## Common Issues

### Container Pull Failures
```bash
# Ensure you're logged in
docker login ghcr.io -u <username> -p <token>

# Pull latest images
docker pull ghcr.io/barde/phialo-test:latest
docker pull ghcr.io/barde/phialo-security:latest
```

### Test Timeouts
- E2E tests: 30s timeout per test
- Integration tests: 30s timeout
- Adjust in respective config files

### Security False Positives
Add to `dependency-check-suppression.xml`:
```xml
<suppress>
    <notes>Reason for suppression</notes>
    <packageUrl>pkg:npm/package-name</packageUrl>
    <cve>CVE-2024-XXXXX</cve>
</suppress>
```

## Monitoring

### Dashboards
- GitHub Actions: Workflow runs
- Codecov: Coverage trends
- Lighthouse CI: Performance trends

### Alerts
- Failed runs create GitHub issues
- Tagged with: `bug`, `nightly-failure`, `high-priority`