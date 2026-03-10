# Credara v3

AI-powered, 7-layer fraud-resistant work identity platform for informal workers.

## Setup

```bash
# Backend
cd backend
cp ../.env.example .env   # Fill in your API keys
npm install
npm start

# Frontend
cd frontend
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm install
npm start
```

## Accounts Required
- **DigitalOcean** → Gradient AI key
- **Supabase** → PostgreSQL database
- **Twilio** → SMS + Lookup API
- **Didit** → ID verification
- **ngrok** → Dev webhooks

See `CREDARA_BUILD_NOTES.md` (gitignored) for full setup guide and SQL schema.

## Architecture
7 fraud layers, 7 AI features, 19 tools, React + Node/Express + Supabase.

## License
MIT
