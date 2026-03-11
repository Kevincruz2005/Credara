# Credara v3 — Work Identity That Cannot Be Faked

> **DigitalOcean Gradient™ AI Hackathon** · 7-layer fraud-resistant work identity for 1.6 billion informal workers

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What Is Credara?

Credara is an AI-powered verified work identity platform for informal workers — domestic workers, construction labourers, market traders, tailors, mechanics. They have real skills and real work histories, but no way to prove any of it.

A worker records a 2-minute voice note on any phone. AI transcribes it, extracts their skills, sends SMS to their references, checks those references for fraud signals, asks smart follow-up questions, and produces a shareable PDF document with a verification score.

**The result:** A domestic worker in Nairobi has a Credara profile with a 91% verification score. An employer scans her QR code. In 30 seconds they see her complete verified history. She gets the job.

---

## 7 Fraud Prevention Layers

| Layer | Name | Technology | What It Catches |
|-------|------|------------|-----------------|
| 1 | Phone Intelligence | Twilio Lookup API | VoIP, virtual, SIM-farm reference numbers |
| 2 | Reply Speed Analysis | Custom timing logic | Pre-arranged references replying in <10 seconds |
| 3 | Number Cluster Detection | Pattern matching | Multiple refs sharing the same number prefix |
| 4 | Government ID Verification | Didit API | Face match + liveness + document tampering + duplicate detection |
| 5 | AI Consistency Scoring | llama3.3-70b-instruct | Reference answers inconsistent with the worker's story |
| 6 | Reputation Over Time | Score history | Open display of all fraud flags to verifiers |
| 7 | Work Evidence | Gradient AI + pdf-parse | Mobile money records, photos, video + cross-reference matching |

---

## Technology Stack

| Tool | Purpose |
|------|---------|
| DigitalOcean Gradient™ AI | All 7 AI features (whisper + llama3.3) |
| whisper-large-v3 | Voice transcription |
| llama3.3-70b-instruct | Skill extraction, profile generation, question generation, consistency scoring, statement parsing, photo analysis |
| Twilio SMS + Lookup | Reference SMS + VoIP fraud detection |
| Didit API | Government ID verification (Layer 4) |
| Supabase / PostgreSQL | Database — 7 tables |
| pdf-parse | Mobile money statement text extraction |
| PDFKit | Server-side branded PDF generation |
| React + Tailwind CSS | Frontend — all 10 screens |
| Node.js + Express | Backend API |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/credara.git
cd credara

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Set Up Environment Variables

```bash
cd backend
cp ../.env.example .env
# Fill in all values — see table below
```

**All required env vars:**

```env
PORT=5000
DATABASE_URL=postgresql://postgres.[ref]:[pass]@[host]:6543/postgres
JWT_SECRET=atleast32characterslongrandomstringhere
GRADIENT_MODEL_KEY=dop_v1_xxxxxxxxxxxxxxxxxxxxxxxx
GRADIENT_BASE_URL=https://inference.do-ai.run/v1
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+15551234567
DIDIT_API_KEY=your_didit_api_key_here
FRONTEND_URL=http://localhost:3000
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

**Frontend** (create `frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

### 3. Set Up Supabase Database

Go to [supabase.com](https://supabase.com) → New Project → SQL Editor → New Query → paste and run:

```sql
CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  id_verified BOOLEAN DEFAULT FALSE,
  id_verified_at TIMESTAMP,
  id_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_profiles (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES workers(id),
  raw_transcript TEXT,
  structured_data JSONB,
  consistency_score DECIMAL(5,2),
  fraud_flags JSONB DEFAULT '[]',
  profile_text TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  skill_name VARCHAR(255),
  category VARCHAR(100),
  confidence_level DECIMAL(3,2),
  is_validated BOOLEAN DEFAULT FALSE
);

CREATE TABLE references (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  phone VARCHAR(20),
  line_type VARCHAR(50),
  is_voip BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending',
  rating INT,
  response_text TEXT,
  followup_question TEXT,
  followup_answer TEXT,
  followup_score DECIMAL(3,1),
  reply_time_seconds INT,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_evidence (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  evidence_type VARCHAR(50),
  file_url VARCHAR(500),
  ai_analysis JSONB,
  is_consistent BOOLEAN,
  confidence_score DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mobile_money_stats (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  statement_type VARCHAR(50),
  unique_payers INT,
  total_transactions INT,
  date_range_months INT,
  avg_per_month DECIMAL(8,2),
  cross_ref_matches INT DEFAULT 0,
  parsed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE verifications (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  verifier_type VARCHAR(100),
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES work_profiles(id),
  pdf_url VARCHAR(500),
  share_link VARCHAR(255) UNIQUE,
  qr_code_url VARCHAR(500),
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Set Up ngrok (for webhooks)

```bash
# Download from ngrok.com, then:
ngrok config add-authtoken YOUR_AUTH_TOKEN
ngrok http 5000

# Copy the https://xxx.ngrok-free.app URL
# Update WEBHOOK_BASE_URL in .env
# Update Twilio Console: Phone Numbers → Your Number → Messaging webhook
# → https://xxx.ngrok-free.app/api/references/webhook
```

> ⚠️ ngrok URL changes on every restart. Update **both** `WEBHOOK_BASE_URL` in `.env` AND the Twilio Console webhook setting each time.

### 5. Seed Demo Data

```bash
cd backend
node scripts/seedDemo.js
```

Creates 3 demo profiles:
| Name | Score | Badge | Login |
|------|-------|-------|-------|
| Maria Santos | 92% | 💎 WORK_EVIDENCED | +2349000000001 / demo1234 |
| Carlos Mendez | 67% | 🔵 SELF_REPORTED | +51900000002 / demo1234 |
| Amara Diallo | 97% | 💎 WORK_EVIDENCED | +233500000003 / demo1234 |

### 6. Run Locally

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm start

# App: http://localhost:3000
# API: http://localhost:5000
```

---

## Verification Score Formula (v3)

| Signal | Points |
|--------|--------|
| Reference confirmation rate | up to 20 |
| Average reference rating (1–5) | up to 20 |
| Story answers provided | 15 |
| AI follow-up consistency score | up to 10 |
| Government ID bonus (Didit) | 15 |
| Mobile money payers (Layer 7) | up to 15 |
| Cross-reference matches (Layer 7) | 3 per match |
| Work photos consistent (Layer 7) | up to 8 |
| Video reference (Layer 7) | up to 7 |
| VoIP penalty | −10 per number |
| Fast reply penalty | −15 |
| Cluster penalty | −10 |

**Score caps by badge tier:**
- 💎 WORK_EVIDENCED: 100% (ID verified + evidence + no fraud flags)
- ✅ FULLY_VERIFIED: 85% (ID verified + no fraud flags)
- ✅ IDENTITY_VERIFIED: 85% (ID verified + some flags)
- 🔵 SELF_REPORTED: 75% (evidence only) or 65% (nothing)
- ⚠️ FLAGGED: 40% (more than 2 fraud flags)

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register worker |
| POST | `/api/auth/login` | — | Login, receive JWT |
| POST | `/api/voice/transcribe` | JWT | Transcribe audio or text |
| POST | `/api/ai/extract-skills` | JWT | Extract skills from transcript |
| POST | `/api/ai/followup-questions` | JWT | Generate 3 AI questions |
| POST | `/api/ai/generate-profile` | JWT | Generate profile + calculate score |
| GET | `/api/ai/my-profile` | JWT | Get worker's latest profile |
| POST | `/api/references/send` | JWT | Send SMS to references |
| POST | `/api/references/webhook` | — | Twilio webhook handler |
| GET | `/api/references/status/:id` | JWT | Get reference reply status |
| POST | `/api/evidence/upload-statement` | JWT | Upload mobile money PDF |
| POST | `/api/evidence/upload-photos` | JWT | Upload work photos |
| POST | `/api/evidence/upload-video` | JWT | Upload video reference |
| GET | `/api/evidence/summary/:id` | JWT | Get evidence summary |
| POST | `/api/fraud/start-id-verify` | JWT | Create Didit session |
| POST | `/api/fraud/id-callback` | — | Didit webhook handler |
| POST | `/api/documents/generate` | JWT | Generate PDF document |
| GET | `/api/documents/download/:id` | JWT | Download PDF |
| GET | `/api/verify/:link` | — | Public profile verification |

---

## Project Structure

```
credara/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # PostgreSQL connection
│   ├── routes/            # 8 route files
│   ├── controllers/       # 8 controller files
│   ├── ai/                # 6 Gradient AI modules
│   ├── services/          # 7 service files (Twilio, Didit, PDF, etc.)
│   ├── middleware/auth.js # JWT verification
│   ├── scripts/seedDemo.js
│   └── public/            # Served files (PDFs, photos, videos)
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx, Register.jsx, Login.jsx
        │   ├── Dashboard.jsx, Verify.jsx, NotFound.jsx
        │   └── onboarding/
        │       ├── VoiceRecord.jsx  # Step 1
        │       ├── SkillReview.jsx  # Step 2
        │       ├── References.jsx   # Step 3
        │       ├── EvidenceUpload.jsx # Step 4 (Layer 7)
        │       └── Complete.jsx     # Step 5
        ├── components/    # 11 UI components
        ├── context/AuthContext.jsx
        └── services/api.js
```

---

## AI Features (Gradient™ AI)

All AI runs through `https://inference.do-ai.run/v1` — no GPU, no training, one API key.

| Feature | Model | Input → Output |
|---------|-------|----------------|
| Voice transcription | whisper-large-v3 | Audio → text |
| Skill extraction | llama3.3-70b-instruct | Transcript → JSON skills |
| Profile generation | llama3.3-70b-instruct | Worker data → 3-paragraph profile |
| Follow-up questions | llama3.3-70b-instruct | Skills → 3 smart questions |
| Consistency scoring | llama3.3-70b-instruct | Reference answer → score 0–10 |
| Statement parsing | llama3.3-70b-instruct | PDF text → payer stats + phone numbers |
| Photo analysis | llama3.3-70b-instruct | Image → consistent: true/false |

---

## Accounts Required

| Service | What For | Free Tier |
|---------|----------|-----------|
| [DigitalOcean](https://cloud.digitalocean.com) | Gradient AI key | ✅ |
| [Supabase](https://supabase.com) | PostgreSQL database | ✅ 500MB |
| [Twilio](https://twilio.com) | SMS + Lookup | ✅ $15 trial |
| [Didit](https://didit.me) | ID verification | ✅ 500/month |
| [ngrok](https://ngrok.com) | Dev webhooks | ✅ Free tier |

---

## License

MIT — see [LICENSE](LICENSE)

---

*Credara v3 · 7 fraud layers · 7 AI features · 11 days · DigitalOcean Gradient™ AI Hackathon*
