# Graph Report - .  (2026-06-08)

## Corpus Check
- Corpus is ~21,157 words - fits in a single context window. You may not need a graph.

## Summary
- 233 nodes · 306 edges · 19 communities (12 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Public Security Controls|Public Security Controls]]
- [[_COMMUNITY_AI Analysis API|AI Analysis API]]
- [[_COMMUNITY_Billing Webhooks|Billing Webhooks]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Build Tooling|Build Tooling]]
- [[_COMMUNITY_Plans And Pricing|Plans And Pricing]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Video Processing|Video Processing]]
- [[_COMMUNITY_Home Analysis UI|Home Analysis UI]]
- [[_COMMUNITY_Vercel API Config|Vercel API Config]]
- [[_COMMUNITY_Acceptable Use Page|Acceptable Use Page]]
- [[_COMMUNITY_Privacy Page|Privacy Page]]
- [[_COMMUNITY_Security Page|Security Page]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Terms Page|Terms Page]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Next Config|Next Config]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `Security & Legal Audit Report` - 13 edges
3. `POST()` - 12 edges
4. `Next.js Fullstack App` - 8 edges
5. `scripts` - 7 edges
6. `createCheckoutSession()` - 6 edges
7. `analyzeVideo()` - 5 edges
8. `PLANS` - 5 edges
9. `getPlanLimits()` - 5 edges
10. `processVideo()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Stripe Billing` --semantically_similar_to--> `Stripe Checkout Hardening`  [INFERRED] [semantically similar]
  README.md → SECURITY_AND_LEGAL_AUDIT.md
- `Webhook Configuration` --semantically_similar_to--> `Webhook Reliability`  [INFERRED] [semantically similar]
  README.md → SECURITY_AND_LEGAL_AUDIT.md
- `Sitemap Reference` --conceptually_related_to--> `Security & Legal Audit Report`  [AMBIGUOUS]
  public/robots.txt → SECURITY_AND_LEGAL_AUDIT.md
- `Code Vulnerabilities Found & Fixed` --semantically_similar_to--> `IP Spoofing Fix`  [INFERRED] [semantically similar]
  SECURITY_AUDIT.md → SECURITY_AND_LEGAL_AUDIT.md
- `Code Vulnerabilities Found & Fixed` --semantically_similar_to--> `Prompt Injection Mitigation`  [INFERRED] [semantically similar]
  SECURITY_AUDIT.md → SECURITY_AND_LEGAL_AUDIT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MVP External Service Architecture** — readme_vercel_deployment, readme_supabase_database, readme_clerk_auth, readme_upstash_redis, readme_stripe_billing, readme_anthropic_video_analysis, readme_openai_transcription [EXTRACTED 1.00]
- **Post-remediation Security Hardening** — security_and_legal_audit_ip_spoofing_fix, security_and_legal_audit_atomic_rate_limiting, security_and_legal_audit_prompt_injection_mitigation, security_and_legal_audit_base64_image_validation, security_and_legal_audit_content_security_policy, security_and_legal_audit_stripe_checkout_hardening, security_and_legal_audit_webhook_reliability [EXTRACTED 1.00]
- **Public Security and Crawler Controls** — _well_known_security_security_txt, _well_known_security_responsible_disclosure_contact, _well_known_security_security_policy_url, public_robots_crawler_api_block, public_robots_auth_route_block [INFERRED 0.75]

## Communities (19 total, 7 thin omitted)

### Community 0 - "Public Security Controls"
Cohesion: 0.08
Nodes (34): Responsible Disclosure Contact, Security Policy URL, Auth Route Block, Crawler API Block, Sitemap Reference, Anthropic Video Analysis AI, Clerk Auth, .env.local Secrets (+26 more)

### Community 1 - "AI Analysis API"
Cohesion: 0.12
Nodes (26): FrameSchema, POST(), RequestSchema, AnalysisResult, analyzeVideo(), anthropic, buildSystemPrompt(), buildUserPrompt() (+18 more)

### Community 2 - "Billing Webhooks"
Cohesion: 0.11
Nodes (17): CheckoutSchema, PortalSchema, POST(), RequestSchema, globalForPrisma, PlanKey, timingSafeEqual(), createCheckoutSession() (+9 more)

### Community 3 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 4 - "Build Tooling"
Cohesion: 0.11
Nodes (17): devDependencies, autoprefixer, postcss, prisma, tailwindcss, @types/node, @types/react, name (+9 more)

### Community 5 - "Plans And Pricing"
Cohesion: 0.18
Nodes (10): formatPrice(), getPlanLimits(), PLANS, yearlySavings(), features, PricingPage(), styles, ALLOWED_AUDIO_MIME_TYPES (+2 more)

### Community 6 - "Runtime Dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @anthropic-ai/sdk, @clerk/nextjs, @clerk/themes, next, @prisma/client, react, react-dom (+6 more)

### Community 7 - "Video Processing"
Cohesion: 0.29
Nodes (10): analyzeAudioTrack(), computeVariance(), estimateBpm(), estimateFps(), extractFrames_(), loadVideoElement(), pickTimestamps(), ProcessedVideo (+2 more)

### Community 8 - "Home Analysis UI"
Cohesion: 0.22
Nodes (7): ACCEPTED_TYPES, AnalysisResult, ApiResponse, formatMb(), HomePage(), TimingSlot, UploadDraft

### Community 9 - "Vercel API Config"
Cohesion: 0.20
Nodes (9): crons, functions, src/app/api/analyze/route.ts, src/app/api/transcribe/route.ts, src/app/api/webhook/route.ts, headers, maxDuration, maxDuration (+1 more)

### Community 13 - "Auth Middleware"
Cohesion: 0.40
Nodes (4): config, isApiRoute, isProtectedRoute, isWebhookRoute

## Ambiguous Edges - Review These
- `Security & Legal Audit Report` → `Sitemap Reference`  [AMBIGUOUS]
  public/robots.txt · relation: conceptually_related_to

## Knowledge Gaps
- **95 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Security & Legal Audit Report` and `Sitemap Reference`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Runtime Dependencies` to `Build Tooling`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public Security Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.08253968253968254 - nodes in this community are weakly interconnected._
- **Should `AI Analysis API` be split into smaller, more focused modules?**
  _Cohesion score 0.12043010752688173 - nodes in this community are weakly interconnected._
- **Should `Billing Webhooks` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._