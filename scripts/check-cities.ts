import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nkdmysztmgerwhrklzhx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZG15c3p0bWdlcndocmtsemh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODkwNjcsImV4cCI6MjA5MzQ2NTA2N30.8fcZ9JUnSGqtyfPMl3SEZxBC-Bkd-k9NwDuqDvaAlSk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
      .from('spaces')
      .select('city')
      .eq('status', 'active')
      .not('city', 'is', null);
      
  console.log("Cities available anonymously:", data?.length, "Error:", error);
}

main().catch(console.error);
