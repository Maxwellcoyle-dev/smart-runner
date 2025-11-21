# Public Hosting Plan for Garmin Training Dashboard

## Executive Summary

This document outlines the plan to transform the current single-user Garmin data dashboard into a multi-user, public-facing web application. The app currently uses hardcoded credentials and local file storage, which needs to be replaced with a proper authentication system, multi-user database, and secure credential management.

## Current Architecture Analysis

### What Works

- ✅ React frontend with comprehensive data visualization
- ✅ Express.js backend API with well-structured endpoints
- ✅ Data sync functionality using `garmindb` Python tool
- ✅ SQLite databases for activity and monitoring data
- ✅ JSON file storage for activity details

### Critical Issues for Public Hosting

1. **Authentication & User Management**

   - ❌ No user registration/login system
   - ❌ Hardcoded Garmin credentials in config file
   - ❌ No session management
   - ❌ No user isolation

2. **Data Storage**

   - ❌ Local file system storage (not scalable)
   - ❌ Single SQLite database (not multi-user)
   - ❌ Hardcoded file paths
   - ❌ No data isolation between users

3. **Security**

   - ❌ Credentials stored in plain text
   - ❌ No HTTPS enforcement
   - ❌ No rate limiting
   - ❌ No input validation/sanitization
   - ❌ CORS not properly configured for production

4. **Infrastructure**

   - ❌ Hardcoded Python paths (`/Users/maxwell-coyle/...`)
   - ❌ No environment variable management
   - ❌ No background job system for syncing
   - ❌ No error monitoring/logging

5. **Garmin Integration**

   - ❌ Single user's credentials hardcoded
   - ❌ No OAuth flow for Garmin Connect
   - ❌ Session tokens stored in local files
   - ❌ No credential refresh mechanism

6. **Monetization & Subscriptions**

   - ❌ No payment processing
   - ❌ No subscription management
   - ❌ No feature gating
   - ❌ No usage limits

7. **AI/ML Infrastructure**
   - ❌ No AI model integration
   - ❌ No training data analysis pipeline
   - ❌ No AI API infrastructure

## Recommended Hosting Solution

### Option 1: Platform-as-a-Service (Easiest) ⭐ RECOMMENDED

**Recommended Stack:**

- **Frontend**: Vercel or Netlify (free tier available)
- **Backend**: Railway, Render, or Fly.io
- **Database**: PostgreSQL on Railway/Render or Supabase (free tier)
- **Background Jobs**: Railway/Render cron jobs or BullMQ with Redis
- **File Storage**: AWS S3, Cloudflare R2, or Supabase Storage
- **Payments**: Stripe (industry standard, excellent API)
- **AI/ML**: OpenAI API, Anthropic Claude, or self-hosted models
- **Vector Database** (for AI): Pinecone, Weaviate, or PostgreSQL with pgvector

**Pros:**

- Minimal DevOps overhead
- Auto-scaling
- Built-in CI/CD
- Free tiers available
- Easy deployment

**Cons:**

- Vendor lock-in
- Less control over infrastructure
- Can get expensive at scale

### Option 2: VPS (More Control)

**Recommended Stack:**

- **VPS**: DigitalOcean Droplet, Linode, or AWS EC2
- **Database**: PostgreSQL on same VPS or managed service
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Background Jobs**: Node-cron or BullMQ
- **File Storage**: Local filesystem or S3

**Pros:**

- Full control
- Predictable costs
- Can optimize for your needs

**Cons:**

- Requires DevOps knowledge
- Manual scaling
- Security maintenance required

## Implementation Plan

### Phase 1: Core Infrastructure Setup

#### 1.1 Database Migration

**Current**: SQLite with local files  
**Target**: PostgreSQL with per-user data isolation

**Tasks:**

- [ ] Set up PostgreSQL database (local dev + production)
- [ ] Create database schema:
  - `users` table (id, email, password_hash, created_at, updated_at)
  - `garmin_credentials` table (user_id, encrypted_email, encrypted_password, session_data, last_sync, created_at)
  - `activities` table (id, user_id, activity_id, activity_data JSONB, start_time, created_at)
  - `daily_summaries` table (id, user_id, date, summary_data JSONB, created_at)
  - `sync_logs` table (id, user_id, status, started_at, completed_at, error_message)
- [ ] Migration script to move from SQLite to PostgreSQL
- [ ] Update all database queries to use PostgreSQL

**Estimated Time**: 2-3 days

#### 1.2 User Authentication System

**Current**: None  
**Target**: JWT-based authentication with secure password hashing

**Tasks:**

- [ ] Install authentication libraries (`bcrypt`, `jsonwebtoken`, `express-session` or `passport`)
- [ ] Create user registration endpoint (`POST /api/auth/register`)
- [ ] Create login endpoint (`POST /api/auth/login`)
- [ ] Create logout endpoint (`POST /api/auth/logout`)
- [ ] Create password reset flow (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`)
- [ ] Add JWT middleware to protect API routes
- [ ] Update frontend with login/register pages
- [ ] Add protected route wrapper in React
- [ ] Store JWT tokens securely (httpOnly cookies recommended)

**Estimated Time**: 3-4 days

#### 1.3 Garmin Credential Management

**Current**: Hardcoded credentials in config file  
**Target**: Per-user encrypted credential storage

**Tasks:**

- [ ] Create credential storage endpoint (`POST /api/garmin/connect`)
  - Accepts Garmin email/password
  - Encrypts credentials using `crypto` or `node-forge`
  - Stores encrypted credentials in database
  - Tests connection to Garmin Connect
- [ ] Create credential update endpoint (`PUT /api/garmin/connect`)
- [ ] Create credential deletion endpoint (`DELETE /api/garmin/connect`)
- [ ] Implement credential encryption/decryption utilities
- [ ] Update sync endpoint to use user's encrypted credentials
- [ ] Handle Garmin session token refresh
- [ ] Add frontend UI for connecting Garmin account

**Security Considerations:**

- Use AES-256-GCM encryption
- Store encryption key in environment variable (never in code)
- Consider using AWS KMS or similar for key management in production
- Never log credentials

**Estimated Time**: 3-4 days

### Phase 2: Multi-User Data Isolation

#### 2.1 Update Backend API

**Tasks:**

- [ ] Add user context to all API endpoints (from JWT)
- [ ] Filter all database queries by `user_id`
- [ ] Update file storage to use user-specific directories or S3 prefixes
- [ ] Ensure sync operations are user-scoped
- [ ] Add user validation to prevent cross-user data access

**Example Changes:**

```javascript
// Before
app.get("/api/running", async (req, res) => {
  let activities = await getAllActivities();
  // ...
});

// After
app.get("/api/running", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  let activities = await getActivitiesByUser(userId);
  // ...
});
```

**Estimated Time**: 2-3 days

#### 2.2 Update Data Sync Process

**Tasks:**

- [ ] Modify sync endpoint to accept user context
- [ ] Create per-user config files dynamically (or pass credentials directly)
- [ ] Update `garmindb` command execution to use user-specific credentials
- [ ] Store sync results in user-specific database records
- [ ] Handle concurrent syncs (prevent multiple syncs for same user)
- [ ] Add sync queue system (BullMQ or similar)

**Estimated Time**: 2-3 days

### Phase 3: Frontend Updates

#### 3.1 Authentication UI

**Tasks:**

- [ ] Create login page (`/login`)
- [ ] Create registration page (`/register`)
- [ ] Create "Connect Garmin" page/section (`/settings/garmin`)
- [ ] Add authentication state management (Context API or Redux)
- [ ] Add protected route wrapper
- [ ] Add logout functionality
- [ ] Show user email/avatar in header
- [ ] Handle token expiration and refresh

**Estimated Time**: 2-3 days

#### 3.2 User Onboarding

**Tasks:**

- [ ] Create welcome/onboarding flow
- [ ] Guide users through Garmin connection
- [ ] Show initial sync progress
- [ ] Display "no data" state with helpful message

**Estimated Time**: 1-2 days

### Phase 4: Infrastructure & Deployment

#### 4.1 Environment Configuration

**Tasks:**

- [ ] Create `.env.example` file
- [ ] Move all hardcoded values to environment variables:
  - Database connection strings
  - JWT secret
  - Encryption keys
  - Garmin API endpoints (if any)
  - File storage paths/credentials
- [ ] Update code to read from environment variables
- [ ] Document required environment variables

**Estimated Time**: 1 day

#### 4.2 Background Job System

**Tasks:**

- [ ] Set up job queue (BullMQ with Redis or node-cron)
- [ ] Create scheduled sync jobs (e.g., daily at 2 AM)
- [ ] Create manual sync job endpoint
- [ ] Add job status tracking
- [ ] Handle job failures and retries
- [ ] Add job monitoring/UI

**Estimated Time**: 2-3 days

#### 4.3 File Storage Migration

**Tasks:**

- [ ] Choose cloud storage (S3, R2, or Supabase Storage)
- [ ] Create storage abstraction layer
- [ ] Migrate from local files to cloud storage
- [ ] Update all file read/write operations
- [ ] Implement file cleanup for deleted users

**Estimated Time**: 2-3 days

#### 4.4 Deployment Setup

**Tasks:**

- [ ] Set up production database
- [ ] Configure environment variables in hosting platform
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Create production build scripts
- [ ] Set up domain and SSL certificate
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Set up logging (Winston or similar)
- [ ] Create deployment documentation

**Estimated Time**: 3-4 days

### Phase 5: Security & Performance

#### 5.1 Security Hardening

**Tasks:**

- [ ] Add rate limiting (express-rate-limit)
- [ ] Add input validation (express-validator or Joi)
- [ ] Add SQL injection prevention (use parameterized queries)
- [ ] Add XSS protection (helmet.js)
- [ ] Enforce HTTPS in production
- [ ] Add CSRF protection
- [ ] Implement password strength requirements
- [ ] Add email verification (optional but recommended)
- [ ] Security audit of dependencies

**Estimated Time**: 2-3 days

#### 5.2 Performance Optimization

**Tasks:**

- [ ] Add database indexes
- [ ] Implement API response caching (Redis)
- [ ] Add pagination to list endpoints
- [ ] Optimize database queries
- [ ] Add compression middleware
- [ ] Optimize frontend bundle size
- [ ] Add CDN for static assets
- [ ] Implement lazy loading for charts

**Estimated Time**: 2-3 days

### Phase 6: Subscription & Payment System

#### 6.1 Stripe Integration

**Current**: No payment system  
**Target**: Full subscription management with Stripe

**Tasks:**

- [ ] Set up Stripe account and get API keys
- [ ] Install Stripe SDK (`stripe` package)
- [ ] Create subscription plans (Free, Pro, Premium)
- [ ] Create Stripe webhook endpoint for payment events
- [ ] Implement subscription creation endpoint (`POST /api/subscriptions/create`)
- [ ] Implement subscription cancellation endpoint (`POST /api/subscriptions/cancel`)
- [ ] Implement subscription update endpoint (`POST /api/subscriptions/update`)
- [ ] Add subscription status to user model
- [ ] Create customer portal for subscription management
- [ ] Handle payment failures and retries
- [ ] Add subscription renewal logic
- [ ] Test with Stripe test mode

**Subscription Tiers (Recommended):**

- **Free**: Basic dashboard, limited sync frequency, basic charts
- **Pro ($9.99/month)**: Full dashboard, daily auto-sync, advanced charts, AI insights (limited)
- **Premium ($19.99/month)**: Everything in Pro + unlimited AI analysis, training plan generation, priority support

**Estimated Time**: 4-5 days

#### 6.2 Feature Gating

**Tasks:**

- [ ] Create subscription middleware to check user tier
- [ ] Add feature flags to database schema
- [ ] Gate AI features behind subscription tiers
- [ ] Gate advanced analytics behind Pro/Premium
- [ ] Add usage limits (e.g., AI requests per month)
- [ ] Create upgrade prompts in UI
- [ ] Add subscription status indicator in frontend
- [ ] Handle subscription expiration gracefully

**Estimated Time**: 2-3 days

#### 6.3 Billing & Usage Tracking

**Tasks:**

- [ ] Create usage tracking table (AI requests, syncs, etc.)
- [ ] Track usage per user per billing period
- [ ] Create usage dashboard for users
- [ ] Implement usage-based billing if needed
- [ ] Add billing history endpoint
- [ ] Create invoice generation (Stripe handles this, but add UI)
- [ ] Add payment method management

**Estimated Time**: 2-3 days

### Phase 7: AI/ML Integration

#### 7.1 AI Infrastructure Setup

**Current**: No AI capabilities  
**Target**: AI-powered training analysis and planning

**Tasks:**

- [ ] Choose AI provider (OpenAI GPT-4, Anthropic Claude, or self-hosted)
- [ ] Set up AI API client
- [ ] Create prompt engineering system for training analysis
- [ ] Design AI response schema
- [ ] Implement rate limiting for AI requests
- [ ] Add AI request logging and cost tracking
- [ ] Create fallback mechanisms for API failures
- [ ] Set up vector database if needed for context retrieval

**AI Features to Build:**

1. **Training Analysis**: Analyze patterns, identify trends, suggest improvements
2. **Training Plan Generation**: Create personalized training plans based on goals
3. **Recovery Recommendations**: Suggest rest days based on training load
4. **Performance Predictions**: Predict race times, suggest pacing strategies
5. **Injury Prevention**: Identify risk factors and suggest modifications

**Estimated Time**: 5-7 days

#### 7.2 Training Data Analysis AI

**Tasks:**

- [ ] Create data aggregation pipeline for AI analysis
- [ ] Design prompts for training analysis
- [ ] Implement training pattern detection
- [ ] Create AI endpoint (`POST /api/ai/analyze-training`)
- [ ] Store AI analysis results in database
- [ ] Add caching for repeated analyses
- [ ] Create frontend UI for AI insights
- [ ] Add visualization for AI recommendations

**Estimated Time**: 4-5 days

#### 7.3 Training Plan Generation AI

**Tasks:**

- [ ] Design training plan schema
- [ ] Create prompts for plan generation
- [ ] Implement goal-based plan generation
- [ ] Create AI endpoint (`POST /api/ai/generate-plan`)
- [ ] Store generated plans in database
- [ ] Add plan modification/regeneration
- [ ] Create frontend UI for plan management
- [ ] Add plan-to-calendar integration

**Estimated Time**: 5-6 days

#### 7.4 AI Cost Optimization

**Tasks:**

- [ ] Implement request caching (similar analyses)
- [ ] Batch similar requests
- [ ] Use cheaper models for simple tasks
- [ ] Implement request queuing for cost control
- [ ] Add usage limits per subscription tier
- [ ] Monitor and optimize token usage
- [ ] Consider fine-tuning smaller models for specific tasks

**Estimated Time**: 2-3 days

### Phase 8: Testing & Documentation

#### 8.1 Testing

**Tasks:**

- [ ] Write unit tests for authentication
- [ ] Write integration tests for API endpoints
- [ ] Write tests for credential encryption/decryption
- [ ] Test multi-user data isolation
- [ ] Load testing
- [ ] Security testing

**Estimated Time**: 3-4 days

#### 8.2 Documentation

**Tasks:**

- [ ] Update README with setup instructions
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Document deployment process
- [ ] Create troubleshooting guide

**Estimated Time**: 1-2 days

## Technology Stack Recommendations

### Backend

- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js (current)
- **Database**: PostgreSQL 14+ (with pgvector extension for AI if needed)
- **ORM/Query Builder**: Prisma or Knex.js
- **Authentication**: JWT with `jsonwebtoken` + `bcrypt`
- **Job Queue**: BullMQ with Redis (or node-cron for simple cases)
- **File Storage**: AWS S3, Cloudflare R2, or Supabase Storage
- **Validation**: express-validator or Joi
- **Security**: helmet.js, express-rate-limit
- **Payments**: Stripe SDK (`stripe`)
- **AI/ML**: OpenAI SDK (`openai`) or Anthropic SDK (`@anthropic-ai/sdk`)
- **Vector DB** (optional): Pinecone, Weaviate, or pgvector

### Frontend

- **Framework**: React (current)
- **State Management**: Context API or Zustand (lightweight)
- **HTTP Client**: Axios or fetch with interceptors
- **Routing**: React Router (add if not present)
- **UI Components**: Keep current or consider Material-UI/Chakra UI

### Infrastructure

- **Hosting**: Railway, Render, or Fly.io (recommended)
- **Database**: Managed PostgreSQL (Railway, Supabase, or Neon)
- **Redis**: Upstash (serverless Redis) or Railway Redis
- **File Storage**: Cloudflare R2 (S3-compatible, free tier) or Supabase Storage
- **Payments**: Stripe (2.9% + $0.30 per transaction, no monthly fee)
- **AI/ML**: OpenAI API (pay-per-use) or Anthropic Claude API
- **Vector DB** (optional): Pinecone (free tier: 1 index), Weaviate Cloud, or pgvector
- **Monitoring**: Sentry (errors) + Logtail (logs)
- **Analytics**: PostHog or Mixpanel (for user analytics)
- **Domain**: Namecheap, Cloudflare, or Route 53

## Cost Estimates

### Free Tier (Small Scale)

- **Frontend**: Vercel/Netlify (free)
- **Backend**: Railway free tier (500 hours/month) or Render free tier
- **Database**: Supabase free tier (500MB) or Neon free tier
- **Redis**: Upstash free tier (10K commands/day)
- **Storage**: Cloudflare R2 free tier (10GB)
- **Total**: $0/month (up to ~100 active users)

### Paid Tier (Medium Scale - 100-1,000 users)

- **Backend**: Railway $5-20/month
- **Database**: Supabase Pro $25/month or Neon $19/month
- **Redis**: Upstash $10/month
- **Storage**: Cloudflare R2 $0.015/GB (very cheap, ~$5/month)
- **Monitoring**: Sentry free tier (5K events/month)
- **Stripe**: 2.9% + $0.30 per transaction (no monthly fee)
- **AI Costs**: Variable based on usage
  - OpenAI GPT-4: ~$0.03-0.06 per analysis
  - Anthropic Claude: ~$0.015-0.03 per analysis
  - Estimate: $50-200/month for 1,000 active users
- **Total Infrastructure**: ~$95-280/month (before AI costs)
- **Total with AI**: ~$145-480/month

### Scale Tier (1,000+ users)

- **Backend**: Railway $20-50/month (auto-scales)
- **Database**: Supabase Pro $25/month or managed PostgreSQL $50-100/month
- **Redis**: Upstash $20-50/month
- **Storage**: Cloudflare R2 $10-30/month
- **Monitoring**: Sentry $26/month (Team plan)
- **AI Costs**: $200-500/month (with caching/optimization)
- **Total**: ~$300-700/month

**Revenue Projections** (assuming 1,000 paying users):

- 60% Free tier: $0
- 30% Pro ($9.99/month): $2,997/month
- 10% Premium ($19.99/month): $1,999/month
- **Total MRR**: ~$5,000/month
- **After Stripe fees**: ~$4,855/month
- **Net profit margin**: ~85-90% (very healthy SaaS margins)

## Implementation Timeline

**Total Estimated Time**: 8-10 weeks (working part-time)

### MVP Timeline (Core Features)

- **Week 1**: Phase 1 (Database + Auth + Credentials)
- **Week 2**: Phase 2 (Multi-user isolation)
- **Week 3**: Phase 3 (Frontend updates)
- **Week 4**: Phase 4 (Infrastructure & Deployment)
- **Week 5**: Phase 5 (Security & Performance)
- **Week 6**: Phase 6 (Subscription & Payment System)
- **Week 7**: Phase 8 (Testing & Documentation)

### Full Feature Timeline (With AI)

- **Week 1-5**: Same as MVP
- **Week 6**: Phase 6 (Subscription & Payment System)
- **Week 7-8**: Phase 7 (AI/ML Integration)
- **Week 9**: Phase 8 (Testing & Documentation)
- **Week 10**: Polish, optimization, launch prep

**Recommended Approach**: Launch MVP first (Weeks 1-6), then add AI features based on user feedback (Weeks 7-10)

## Critical Decisions Needed

1. **Garmin Authentication Method**

   - Option A: Store encrypted username/password (current approach, simpler)
   - Option B: OAuth if Garmin provides it (more secure, but may not be available)
   - **Recommendation**: Start with Option A, migrate to OAuth if available

2. **Python Dependency**

   - Current: Uses `garmindb` Python CLI tool
   - Options:
     - Keep Python dependency (requires Python in production)
     - Rewrite sync logic in Node.js using Garmin API directly
   - **Recommendation**: Keep Python for now (faster to implement), consider Node.js rewrite later

3. **Data Sync Strategy**

   - Option A: On-demand sync (user clicks "Sync" button)
   - Option B: Scheduled background syncs (daily)
   - Option C: Both
   - **Recommendation**: Option C (both manual and scheduled)

4. **File Storage**

   - Option A: Keep FIT files and JSON (more storage, faster queries)
   - Option B: Store only in database (less storage, slower for large files)
   - **Recommendation**: Hybrid - store metadata in DB, large files in object storage

5. **Subscription Model**

   - Option A: Freemium (free tier + paid tiers)
   - Option B: Free trial then paid only
   - Option C: Completely free (monetize later)
   - **Recommendation**: Option A (Freemium) - allows viral growth, converts to paid for AI features

6. **AI Provider**
   - Option A: OpenAI GPT-4 (best quality, higher cost)
   - Option B: Anthropic Claude (good quality, competitive pricing)
   - Option C: Self-hosted open-source models (lower cost, more complex)
   - **Recommendation**: Start with Option B (Claude), consider Option A for premium features

## Next Steps

1. **Review and approve this plan**
2. **Set up development environment** with PostgreSQL
3. **Start with Phase 1.1** (Database migration)
4. **Create GitHub issues** for each task
5. **Set up project board** for tracking progress

## Additional Considerations

### Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance (if serving EU users)
- [ ] Data retention policies
- [ ] User data export/deletion

### Features for Future

- [ ] Email notifications (sync complete, weekly summary)
- [ ] Social features (share runs, compare with friends)
- [ ] Advanced training plans with periodization
- [ ] Goal setting and tracking
- [ ] Export data (GPX, CSV)
- [ ] Mobile app (React Native)
- [ ] Integration with other fitness platforms (Strava, TrainingPeaks)
- [ ] Team/coach features (for coaches managing multiple athletes)
- [ ] Custom AI model fine-tuning for specific training methodologies

### Monitoring & Analytics

- [ ] User analytics (signups, active users, conversion rates)
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Usage metrics (API calls, storage)
- [ ] Revenue analytics (MRR, churn, LTV)
- [ ] AI usage and cost tracking
- [ ] Feature usage analytics (which features drive conversions)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Author**: AI Assistant
