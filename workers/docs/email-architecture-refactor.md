# Email Architecture Refactor Plan

## Current Issues

1. **Blocking isAvailable() Check**: The email service performs an unnecessary API call to check provider availability before sending emails, doubling latency
2. **Synchronous Architecture**: Email sending happens synchronously within the request-response cycle, causing timeouts
3. **Poor Separation of Concerns**: Email logic is tightly coupled with the API handler
4. **No Retry Mechanism**: Failed emails are not automatically retried

## New Architecture: Queue-Based Email System

### Overview

```
User Request → API Handler → Validate → Queue Message → Fast Response
                                             ↓
                                      Queue Consumer → Send Email → Retry if Failed
```

### Key Benefits

1. **Fast Response Times**: API returns immediately after validation
2. **Reliable Delivery**: Automatic retries through Cloudflare Queues
3. **Clean Separation**: API handles validation, Queue handles sending
4. **Scalability**: Can process multiple emails concurrently
5. **Failure Resilience**: Failed emails are automatically retried

### Implementation Steps

1. **Update wrangler.toml** - Add email queue binding
2. **Refactor API Handler** - Only validate and enqueue
3. **Create Queue Consumer** - Handle actual email sending
4. **Simplify Email Service** - Remove blocking checks
5. **Add Comprehensive Logging** - Track email flow
6. **Write Tests** - Unit and integration tests

### Simple Email API

```typescript
// Simple interface for sending emails
interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// Usage
await sendEmail({
  to: "user@example.com",
  from: "noreply@phialo.de",
  subject: "Contact Form Submission",
  html: "<p>Message content</p>",
  text: "Message content"
});
```

### Queue Message Format

```typescript
interface QueuedEmail {
  type: 'contact-form' | 'confirmation';
  data: ContactFormData;
  timestamp: string;
  retryCount?: number;
}
```

### Logging Strategy

1. **API Handler**: Log validation errors, queue success/failure
2. **Queue Consumer**: Log processing start/end, send success/failure
3. **Email Service**: Log provider attempts, API responses
4. **Structured Format**: Use consistent JSON logging

### Testing Strategy

1. **Unit Tests**:
   - Email validation logic
   - Template generation
   - Queue message formatting

2. **Integration Tests**:
   - API endpoint with mocked queue
   - Queue consumer with mocked email service
   - End-to-end flow with test credentials

## Migration Path

1. Deploy new code with queue support
2. Test in preview environment
3. Monitor queue processing
4. Remove old synchronous code
5. Update documentation