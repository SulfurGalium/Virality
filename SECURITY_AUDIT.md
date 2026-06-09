# Security Audit Findings

## CODE VULNERABILITIES FOUND & FIXED

### CRITICAL
1. analyze/route.ts — IP spoofing: x-forwarded-for not sanitized (attacker sends "1.2.3.4, real-ip")
2. analyze/route.ts — Race condition: usage counter not atomic (two simultaneous requests both pass canAnalyze())
3. analyze/route.ts — Auto-create user with placeholder email "pending@sync.com" pollutes DB
4. analyzer.ts — Prompt injection: fileName/transcript/niche inserted raw into AI prompt
5. analyzer.ts — No base64 validation: malicious data in frame.base64 sent directly to Anthropic
6. middleware.ts — CSP header missing entirely (XSS risk)
7. middleware.ts — CORS origin check uses string equality on user-controlled header
8. stripe.ts — priceId not validated against known price IDs before checkout creation
9. billing/route.ts — No idempotency on checkout: double-click creates two sessions
10. webhook/route.ts — Logs full event.type (leaks info if logs are exposed)

### HIGH
11. analyze/route.ts — Request body size unlimited (could send 50MB JSON)
12. transcribe/route.ts — No content-type validation on audio blob (could send anything)
13. user/route.ts — page/limit params not sanitized for SQL injection via Prisma
14. analyzer.ts — AI response not sanitized before storing in DB (XSS in dashboard)
15. plans.ts — AGENCY trial hardcoded; trial on AGENCY plan is business logic error

### MEDIUM
16. middleware.ts — Missing Strict-Transport-Security header
17. All routes — No request timeout: Anthropic call could hang forever
18. All routes — Error messages leak stack traces in non-production
19. stripe.ts — createCheckoutSession success/cancel URLs not validated (open redirect)
20. webhook/route.ts — After 200 on handler error, Stripe stops retrying (silent failure)

## LEGAL GAPS FOUND & FIXED

21. No Terms of Service as separate legal document (pricing page snippet not sufficient)
22. No Privacy Policy covering CCPA (California), GDPR (EU), COPPA (under-13)
23. No data processing agreement reference for EU users
24. No cookie policy / banner requirement disclosure
25. No AI-generated content disclaimer meeting FTC guidelines
26. No refund policy as formal document
27. No acceptable use policy (needed to terminate abusive users)
28. No age verification (COPPA requires 13+ confirmation)
29. Pricing page promises "no questions asked refund" without policy backing it up
30. No mechanism for GDPR data deletion request

