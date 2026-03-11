const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// 3 demo profiles per docx spec:
// Maria Santos — 92% (tailor, Lagos, id_verified, work evidence)
// Carlos Mendez — 67% (electrician, Lima, no id, some refs)
// Amara Diallo — 97% (accountant, Accra, id_verified, max evidence + cross-ref)

async function seed() {
  console.log('[seed] Starting Credara demo seed...');

  const demos = [
    {
      name: 'Maria Santos',
      phone: '+2349000000001',
      password: 'demo1234',
      job_title: 'Senior Tailor & Seamstress',
      years_experience: 9,
      skills: ['Tailoring', 'Fabric Cutting', 'Alterations', 'Embroidery', 'Measurements'],
      summary: 'Experienced tailor specializing in custom clothing and alterations in Lagos.',
      profile_text: 'Maria Santos is a highly skilled tailor with 9 years of experience serving families across Lagos, Nigeria. Specializing in custom garment creation and professional alterations, she has built a reputation for precision and reliability in her craft. Her ability to work with diverse fabrics and her deep knowledge of measurements and fitting make her a sought-after craftsperson in her community. Over her career, Maria has served hundreds of clients, consistently receiving high ratings from employers and clients who value her meticulous attention to detail and timely delivery. Her work history, verified through mobile payment records and client references, demonstrates a sustained and growing income stream reflecting genuine demand for her skills.',
      id_verified: true,
      score: 92,
      refsData: [
        { phone: '+2349001000001', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 5, reply_time_seconds: 450 },
        { phone: '+2349001000002', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 4, reply_time_seconds: 820 },
        { phone: '+2349001000003', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 5, reply_time_seconds: 1200 },
      ],
      mm: { statement_type: 'MPESA', unique_payers: 18, total_transactions: 112, date_range_months: 12, avg_per_month: 320.50, cross_ref_matches: 2 },
    },
    {
      name: 'Carlos Mendez',
      phone: '+51900000002',
      password: 'demo1234',
      job_title: 'Electrician & Wiring Specialist',
      years_experience: 5,
      skills: ['Electrical Wiring', 'Panel Installation', 'Troubleshooting', 'Solar Setup'],
      summary: 'Electrician with 5 years experience serving homes and small businesses in Lima.',
      profile_text: 'Carlos Mendez is an electrician based in Lima, Peru, with 5 years of hands-on experience in residential and commercial wiring. He has consistently delivered reliable electrical work across a range of projects, from new installations to complex fault diagnosis. Clients appreciate his methodical approach and commitment to safety standards. While Carlos is still building his formal verification record, two confirmed references speak to his professional conduct and technical competence. His progression reflects a dedicated tradesperson growing his reputation through quality work and client satisfaction.',
      id_verified: false,
      score: 67,
      refsData: [
        { phone: '+51901000001', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 4, reply_time_seconds: 600 },
        { phone: '+51901000002', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 3, reply_time_seconds: 2400 },
        { phone: '+51901000003', line_type: 'mobile', is_voip: false, status: 'pending', rating: null, reply_time_seconds: null },
      ],
      mm: null,
    },
    {
      name: 'Amara Diallo',
      phone: '+233500000003',
      password: 'demo1234',
      job_title: 'Freelance Accountant & Bookkeeper',
      years_experience: 12,
      skills: ['Bookkeeping', 'Tax Preparation', 'Payroll', 'QuickBooks', 'Financial Reporting', 'VAT Filing'],
      summary: 'CPA-trained accountant managing books for 20+ SMEs across Accra with 12 years experience.',
      profile_text: 'Amara Diallo is a freelance accountant operating in Accra, Ghana, with 12 years of experience managing financial records and tax obligations for small and medium enterprises. Trained in professional accounting practices, she has developed expertise across bookkeeping, payroll processing, tax preparation, and financial reporting for clients in retail, hospitality, and services sectors. Her client base of 20+ businesses reflects the trust she has earned through accuracy, discretion, and consistent delivery. Amara\'s verification profile represents the highest tier of Credara\'s evidence system — her government ID has been confirmed, her mobile money payment history spanning 14 months demonstrates 32 unique business clients, and multiple clients who made payments have also provided reference confirmations.',
      id_verified: true,
      score: 97,
      refsData: [
        { phone: '+233501000001', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 5, reply_time_seconds: 540 },
        { phone: '+233501000002', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 5, reply_time_seconds: 980 },
        { phone: '+233501000003', line_type: 'mobile', is_voip: false, status: 'confirmed', rating: 5, reply_time_seconds: 1650 },
      ],
      mm: { statement_type: 'MTN_MOMO', unique_payers: 32, total_transactions: 198, date_range_months: 14, avg_per_month: 2100.00, cross_ref_matches: 3 },
    },
  ];

  for (const d of demos) {
    try {
      // Check existing
      const exists = await db.query('SELECT id FROM workers WHERE phone = $1', [d.phone]);
      if (exists.rows.length > 0) {
        console.log(`[seed] ${d.name} already exists — skipping`);
        continue;
      }

      // Worker
      const pw = await bcrypt.hash(d.password, 10);
      const workerRes = await db.query(
        `INSERT INTO workers (name, phone, password_hash, id_verified, id_verified_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [d.name, d.phone, pw, d.id_verified, d.id_verified ? new Date() : null]
      );
      const workerId = workerRes.rows[0].id;

      // Profile
      const structured = {
        job_title: d.job_title,
        years_experience: d.years_experience,
        skills: d.skills,
        summary: d.summary
      };
      const profileRes = await db.query(
        `INSERT INTO work_profiles (worker_id, raw_transcript, structured_data, profile_text, consistency_score, fraud_flags, status)
         VALUES ($1, $2, $3, $4, $5, '[]', 'complete') RETURNING id`,
        [workerId, d.summary, JSON.stringify(structured), d.profile_text, d.score]
      );
      const profileId = profileRes.rows[0].id;

      // Skills
      for (const skill of d.skills) {
        await db.query('INSERT INTO skills (profile_id, skill_name) VALUES ($1, $2)', [profileId, skill]);
      }

      // References
      for (const ref of d.refsData) {
        await db.query(
          `INSERT INTO references (profile_id, phone, line_type, is_voip, status, rating, reply_time_seconds, confirmed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [profileId, ref.phone, ref.line_type, ref.is_voip, ref.status, ref.rating,
           ref.reply_time_seconds, ref.status === 'confirmed' ? new Date() : null]
        );
      }

      // Mobile money stats
      if (d.mm) {
        await db.query(
          `INSERT INTO mobile_money_stats (profile_id, statement_type, unique_payers, total_transactions, date_range_months, avg_per_month, cross_ref_matches)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [profileId, d.mm.statement_type, d.mm.unique_payers, d.mm.total_transactions,
           d.mm.date_range_months, d.mm.avg_per_month, d.mm.cross_ref_matches]
        );
      }

      // Document + share link
      const shareLink = `${uuidv4().split('-')[0]}-${d.name.toLowerCase().replace(/\s/g, '-')}`;
      await db.query(
        `INSERT INTO documents (profile_id, pdf_url, share_link) VALUES ($1, $2, $3)`,
        [profileId, `/documents/demo-${shareLink}.pdf`, shareLink]
      );

      console.log(`[seed] ✅ ${d.name} — score=${d.score}% share_link=${shareLink}`);
    } catch (err) {
      console.error(`[seed] ❌ Failed for ${d.name}:`, err.message);
    }
  }

  console.log('[seed] Done!');
  process.exit(0);
}

require('dotenv').config();
seed();
