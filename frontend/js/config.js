
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://regighceakyjsscojxku.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2lnaGNlYWt5anNzY29qeGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDEwNDksImV4cCI6MjA3OTkxNzA0OX0.xUNwNTdSF3xHf8FOAbTmhenAErN9Y2wBGJJEr-ilu9A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
