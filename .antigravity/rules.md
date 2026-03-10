# Credara — Master Rules File v3 — Work Evidence Edition
# Read this before EVERY task. Follow every rule exactly.

## Project Identity
Name: Credara  |  Tagline: Your Work. Verified.  |  Version: 3
Description: 7-layer fraud-resistant AI-powered work identity for informal workers.
  Voice -> AI extraction -> SMS references -> fraud detection ->
  ID verification -> mobile money evidence -> verified PDF.
Hackathon: DigitalOcean Gradient AI Hackathon 2025

## Folder Structure
credara/
  frontend/ -- React app (Tailwind, React Router v6, Axios)
  backend/
    routes/ -- auth, voice, ai, references, documents, verify, fraud, evidence
    controllers/ -- one per route file
    middleware/ -- auth.js (JWT verification)
    ai/ -- gradientClient, transcriber, skillExtractor,
            profileGenerator, questionGenerator, followupChecker
    services/ -- phoneIntelligence, fraudDetector, diditService,
               mobileMoneyParser, photoAnalyzer, pdfService, storageService
    scripts/ -- seedDemo.js
    public/ -- documents/, evidence/photos/, evidence/videos/
  .antigravity/ -- this rules file
  .do/ -- app.yaml

## Tech Stack
Frontend: React.js, Tailwind CSS, React Router v6, Axios, react-toastify
Backend: Node.js, Express, pg, jsonwebtoken, bcryptjs,
  multer, pdfkit, pdf-parse, twilio, openai (SDK), uuid, axios
AI: Gradient AI -- https://inference.do-ai.run/v1
  Text: llama3.3-70b-instruct  |  Audio: whisper-large-v3
Database: PostgreSQL via Supabase -- ssl rejectUnauthorized:false -- 7 tables
Fraud L1: Twilio Lookup v2  |  Fraud L4: Didit API
Fraud L7: pdf-parse + Gradient AI (statement + photo analysis)

## Environment Variables
PORT=5000  |  DATABASE_URL=postgresql://...  |  JWT_SECRET=32+chars
GRADIENT_MODEL_KEY=dop_v1_...  |  GRADIENT_BASE_URL=https://inference.do-ai.run/v1
TWILIO_SID=AC...  |  TWILIO_TOKEN=...  |  TWILIO_PHONE=+1...
DIDIT_API_KEY=...  |  FRONTEND_URL=http://localhost:3000
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok-free.app

## Design System
Primary: #1A56DB  |  Background: #FFFFFF  |  Surface: #F9FAFB
Text: #111827  |  Gray: #6B7280  |  Success: #059669
Warning: #D97706  |  Error: #DC2626  |  Teal: #0D9488
Diamond: #0369A1  |  Light Diamond: #E0F2FE

## Coding Rules (15 rules — all from v2 preserved exactly)
1.  Always async/await -- never .then() chains
2.  Always try/catch on every async function
3.  Never hardcode API keys or secrets
4.  Always use process.env for all config values
5.  All routes prefixed with /api
6.  Success response: {success:true, data:{...}}
7.  Error response: {success:false, error:"message"}
8.  Never commit .env to git
9.  React components under 150 lines
10. JWT token in React Context only -- never localStorage
11. Strip ```json fences: text.replace(/```json|```/g,"").trim()
12. console.log every AI call start and result         <- RESTORED from v2
13. Mobile-first Tailwind classes always               <- RESTORED from v2
14. Commit to GitHub after every working feature
15. Never keep 2+ hours of uncommitted working code

## Anti-Fraud Rules (8 rules — Layers 1-7)
16. Check every reference phone with Twilio Lookup before SMS
17. Record sent_at timestamp when SMS is sent
18. Record reply_time_seconds when reference replies
19. Send AI follow-up question after every confirmation
20. Run analyzeFraudSignals() after every new confirmation
21. Apply v3 score caps (5-tier system -- see formula)
22. Show fraud_flags to verifiers only -- never show to workers
23. Always show disclaimer text on verification portal page

## Score Formula v3
reference_rate=(confirmed/total)*20  rating_score=(avg/5)*20  story=15
followup=(avg_fs/10)*10  id_bonus=id_verified?15:0
mobile_money=payers>=10?15:payers>=5?10:payers>=1?5:0  cross_ref=matches*3
photo=photos>=5?8:photos>=3?5:photos>=1?2:0  video=videos>=2?7:videos>=1?4:0
voip*=-10  speed=fast>=2?-15:0  cluster=-10
Caps: no_id+no_ev->65 | no_id+ev->75 | id+no_ev->85 | id+ev->100 | flags>2->40

## Badge Levels (v3 — 5 levels)
WORK_EVIDENCED:    id_verified AND has_work_evidence AND flags.length===0
FULLY_VERIFIED:    id_verified AND flags.length===0 (no evidence uploaded yet)
IDENTITY_VERIFIED: id_verified AND flags.length>0
SELF_REPORTED:     !id_verified AND flags.length===0
FLAGGED:           fraud_flags.length > 2
