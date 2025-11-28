# Schedule

This repo is a simple scheduling PWA that uses Supabase (Auth + Postgres) and Vercel for hosting.

Steps (simple)
1. Create Supabase project.
2. Run SQL in SQL Editor: create tables, RLS, trigger (copy-paste from provided SQL).
3. Create GitHub repo and push this project.
4. Create Vercel account and import the repo.
   - In Vercel Project Settings → Environment Variables, set:
     - SUPABASE_URL = https://YOUR_PROJECT.supabase.co
     - SUPABASE_ANON_KEY = <anon key>
     - SUPABASE_SERVICE_ROLE_KEY = <service_role> (ONLY if using api/)
     - ADMIN_SECRET = <random string>
5. Deploy. Vercel will run build, which writes `frontend/js/config.js` from env vars.
6. Add domain `www.opti89.net` in Vercel and follow DNS steps (CNAME for www).
7. In Supabase Table Editor, locate your user in `profiles` and set `role='admin'` and `org_id` to your org.
8. Visit site, register, and test.

## Important
- Do NOT commit sensitive keys. The build script writes config.js on deploy.
- Enable email confirmation in Supabase Auth settings for security.
