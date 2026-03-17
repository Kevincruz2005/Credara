# Credara v3: How It Works (Detailed System Architecture)

Credara is a 7-layer fraud-resistant AI-powered work identity platform. It is designed specifically for 1.6 billion informal workers globally who lack formal CVs and employment histories, allowing them to build a verifiable, highly-trusted digital identity from scratch.

This document serves as an exhaustive breakdown of the entire architecture, data flow, and anti-fraud mechanisms implemented in the current v3 codebase.

---

## 1. Tech Stack Overview
- **Frontend:** React (Create React App), `react-router-dom` v6 for routing, Tailwind CSS for styling.
  - **Security Paradigm:** Zero local browser storage. `AuthContext.jsx` explicitly holds the JWT token and user session entirely within React's memory (`useState`). Page refreshes deliberately log users out to prevent token theft from shared devices.
- **Backend:** Node.js, Express REST API, handling multipart file uploads (`multer`), JWT authentication, and PDF document generation (`pdfkit`).
- **Database:** PostgreSQL hosted on Supabase (`pg` driver).
- **Core Integrations:**
  - **DigitalOcean Gradient AI:** Provides Whisper-large-v3 (Audio Transcription) and LLaMA-3.3 (Text/Vision Extraction).
  - **Twilio:** Handles Lookup v2 API (Phone Intelligence) and Programmable SMS Webhooks.
  - **Didit ID:** Handles official government ID sessions.

---

## 2. The Worker Onboarding Flow (Layers of Trust)

### Step 1: Voice Recording & AI Interview (The Foundation)
Informal workers often face literacy barriers. Instead of typing a CV, the worker simply records a voice note explaining what they do, how long they've done it, and where.
- **Backend Flow:** `routes/voice.js` receives the `.webm` audio blob.
  - `ai/transcriber.js` sends it to Gradient's **Whisper-large-v3** model to get a raw text transcript.
  - `ai/skillExtractor.js` immediately forwards the transcript to **LLaMA-3.3** to extract structured JSON (Job Title, Years Experience, and a normalized array of specific technical Skills).

### Step 2: The Reference Challenge (Layers 1, 5, & 6)
To verify the skills, the worker must provide phone numbers of past clients or employers.
- **Layer 1 (Pre-Send Filtering):** `services/phoneIntelligence.js` pings Twilio's Lookup API. If the number is a `nonFixedVoip` (a virtual, disposable number often used by scammers), the backend immediately blocks it with an HTTP 400 error. It mathematically cannot enter the database.
- **Layer 6 (The SMS Baseline):** Twilio sends an SMS directly to valid numbers: *"Did [Worker] work for you? Reply YES and rate 1-5."*
- **Layer 5 (AI Follow-up Challenge):** When the reference replies "YES", the webhook triggers `ai/questionGenerator.js` (LLaMA-3.3). It looks at the worker's specific extracted skills and texts the reference a highly specific, unpredictable technical question (e.g., *"What specific type of electrical panel did Carlos install for you?"*). The reference's answer is scored by the AI. A vague answer ruins the worker's credibility score.

### Step 3: Behavioral Fraud Detection (Layers 2 & 3)
While the references are replying, `services/fraudDetector.js` quietly analyzes the incoming Twilio webhooks for coordinated attacks.
- **Layer 2 (Speed Verification):** If a reference replies "YES" impossibly fast (under 15 seconds from the SMS delivery), they are flagged as a potential bot or the worker sitting next to a burner phone.
- **Layer 3 (Prefix Clustering):** If 3 references all have the exact same phone number prefix (e.g., `+234-900...`), it flags it as a likely batch-purchased SIM card ring.
- *Note:* Rule 22 states that these fraud flags are **never** shown to the worker on their Dashboard to prevent them from gaming the system.

### Step 4: Government Identity (Layer 4)
The worker is prompted to optionally verify their identity using **Didit ID**.
- The frontend redirects to `didit.me`. Upon successful passport/ID scan, a webhook hits `routes/fraud.js` to officially mark the worker as `id_verified` in the database, granting a massive score boost.

### Step 5: Work Evidence & Cross-Referencing (Layer 7)
The worker uploads visual and financial proof of their micro-business.
- **Mobile Money Statements:** The worker uploads an MPESA or MTN Momo PDF statement. `services/mobileMoneyParser.js` pulls the text using `pdf-parse` and feeds it to LLaMA-3.3 to extract transaction counts, unique payers, and revenue. **Crucially**, it cross-references the phone numbers in the Bank PDF against the actual Reference phone numbers provided in Step 2. If they match, it proves undeniable economic activity.
- **Photo/Video Evidence:** The worker uploads photos of them working. The system checks their semantic consistency against their claimed job title.

---

## 3. The Dynamic Scoring System (v3 Formula)
After the flow is complete, the `verifyController.js` calculates a dynamic score (0-100) based on all collected data. 
- It adds points for confirmed references, follow-up quality, ID verification (+15), and mobile money matches (+15).
- It subtracts points heavily for Layer 2 & 3 fraud flags (-15 points per flag).
- **The Cap System:** A worker can never reach 100% unless they have *both* Government ID Verified *and* Work Evidence uploaded. If they have none, their score caps at 65%, no matter how many references they fake.
- **Flags Cap:** If a worker accrues more than 2 fraud flags, their score is permanently hard-capped at 40%, and their badge turns to `⚠️ FLAGGED`.

---

## 4. The Final Output: Verifier Portal & PDF Document
The entire process synthesizes into a shareable, highly professional CV.
- `ai/profileGenerator.js` uses LLaMA-3.3 to draft a professional 3-paragraph summary combining their raw transcript, their verified skills, and their confirmed reference data.
- `services/pdfService.js` uses **PDFKit** to render a beautiful identity document complete with their Score, Badge Tier (e.g., `💎 WORK_EVIDENCED` or `✅ IDENTITY_VERIFIED`), and a scannable QR code.
- Employers can scan the QR code to view the public `/verify/:share_link` portal to see the immutable timeline of how this worker earned their score, including any confidential backend fraud warnings they triggered during onboarding.
