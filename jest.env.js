const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Ensure environment variables are defined for testing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vqxhwbdhguhcigdouqpc.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeGh3YmRoZ3VoY2lnZG91cXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjM4NjIsImV4cCI6MjA2Mjc5OTg2Mn0.ggqmXhFJuYWGXlJYjoVxa7xZyWddUdGsM6t1eXlSmO0';
}
