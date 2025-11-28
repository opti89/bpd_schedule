// scripts/writeConfig.js
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'frontend', 'js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const content = `// GENERATED CONFIG - DO NOT COMMIT
const SUPABASE_URL = "${https://regighceakyjsscojxku.supabase.co}";
const SUPABASE_ANON_KEY = "${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2lnaGNlYWt5anNzY29qeGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDEwNDksImV4cCI6MjA3OTkxNzA0OX0.xUNwNTdSF3xHf8FOAbTmhenAErN9Y2wBGJJEr-ilu9A}";
`;

fs.writeFileSync(path.join(outDir, 'config.js'), content, { encoding: 'utf8' });
console.log('Wrote frontend/js/config.js');
