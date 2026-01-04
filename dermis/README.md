# Dermis

**AI-First EMR for Dermatology**

Built for Novice Group Dermatology • Bloomfield, MI

---

## Overview

Dermis is a modern, AI-powered Electronic Medical Records (EMR) system designed specifically for dermatology practices. It handles the unique workflows of medical, cosmetic, and pathology dermatology—all in one platform.

### Key Features

- **🧠 AI Clinical Notes** — Type brief observations, get complete SOAP notes with ICD-10/CPT suggestions
- **📸 Derm Image Intelligence** — Structured photo tracking with AI-generated lesion descriptions
- **✨ Cosmetic Consult Flow** — Before/after photos, treatment planning, consent management
- **🔬 Pathology Integration** — Order tracking, result management, follow-up workflows
- **🏢 Multi-tenant Architecture** — Scale from one practice to many

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- An Anthropic API key

### 1. Clone & Install

```bash
git clone <your-repo>
cd dermis
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration in `supabase/migrations/001_initial_schema.sql`
3. Create a storage bucket called `patient-photos`

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dermis/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   └── generate-note/  # AI note generation endpoint
│   │   ├── demo/               # AI Notes demo page
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   ├── lib/
│   │   ├── ai/                 # AI services
│   │   │   └── clinical-notes.ts
│   │   ├── supabase/           # Supabase clients
│   │   └── utils.ts            # Utilities
│   └── types/
│       └── database.ts         # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── public/                     # Static assets
```

## Development Roadmap

### Phase 1: Foundation + AI Notes ✅
- [x] Database schema with RLS
- [x] AI clinical note generation
- [x] SOAP format with code suggestions
- [x] Demo interface

### Phase 2: Image Intelligence 🔜
- [ ] Patient photo upload
- [ ] Body location mapping
- [ ] AI lesion descriptions
- [ ] Change tracking over time
- [ ] Pathology correlation

### Phase 3: Cosmetic Flow 🔜
- [ ] Before/after photo management
- [ ] Treatment planning templates
- [ ] Consent form generation
- [ ] Outcome tracking
- [ ] Provider analytics

### Phase 4: Full EMR 🔜
- [ ] Scheduling
- [ ] Patient portal
- [ ] Billing/claims
- [ ] E-prescribing
- [ ] Lab integrations

## HIPAA Considerations

This is currently a **prototype**. Before using with real patient data:

1. **Upgrade to HIPAA-compliant tiers**
   - Supabase HIPAA plan
   - Vercel Enterprise (or self-host)
   
2. **Complete BAA agreements** with all vendors

3. **Implement required safeguards**
   - Encryption at rest and in transit (Supabase provides this)
   - Audit logging (schema includes this)
   - Access controls (RLS implemented)
   - Backup procedures

4. **Security review** of AI prompts and data handling

## License

Private / Proprietary — Novice Group Dermatology

---

Built with ❤️ by the Dermis team
