const SUPABASE_URL = "https://mfcabsshwymaudbkcuoc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY2Fic3Nod3ltYXVkYmtjdW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTg4NDIsImV4cCI6MjA4OTE5NDg0Mn0.Q8HPOXpaar1vZ7Cjey-rE9-uMZ7XgNoZHw3Tbi5J2Fg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
