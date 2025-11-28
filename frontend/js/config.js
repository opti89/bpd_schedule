window.SUPABASE_URL = "https://regighceakyjsscojxku.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2lnaGNlYWt5anNzY29qeGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDEwNDksImV4cCI6MjA3OTkxNzA0OX0.xUNwNTdSF3xHf8FOAbTmhenAErN9Y2wBGJJEr-ilu9A";

// Create global supabase client
window.supabase = Supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
