import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nkdmysztmgerwhrklzhx.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZG15c3p0bWdlcndocmtsemh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg4OTA2NywiZXhwIjoyMDkzNDY1MDY3fQ.aU8dC2Lj32nIng_k2zkzJqnrvL6aCLmU269Ql7UjbYY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const adminUser = users.users.find(u => u.email === 'ajl@xarop.com');
  if (!adminUser) {
    console.log("Admin user not found.");
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: "PasswordAdmin2026!" }
  );

  if (error) {
    console.error("Error setting password:", error);
  } else {
    console.log("Success! Password set to: PasswordAdmin2026!");
  }
}

main().catch(console.error);
