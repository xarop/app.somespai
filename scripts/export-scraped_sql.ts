
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function exportScraped() {
  const { data: spaces, error } = await supabase.from("spaces").select("*").is("owner_id", null);
  if (error) throw error;
  
  if (!spaces || spaces.length === 0) {
    console.log("No scraped spaces found.");
    return;
  }
  
  let sql = "-- Importacio nomes dels espais sense propietari (scraped)\\n\\n";
  for (const s of spaces) {
    const escape = (val: any) => {
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "string") return " + val.replace(/'/g, ) + ";
      if (typeof val === "number" || typeof val === "boolean") return val;
      if (Array.isArray(val)) return `ARRAY[${val.map(v => " + v.replace(/'/g, ) + ").join(",")}]::text[]`;
      return " + val + ";
    };
    
    // We omit ID so it generates a new one, or keep ID if we want. keeping ID is fine since they dont exist in prod.
    // Omit id, ownerId (which is null anyway), created_at, updated_at
    const columns = [
      "slug", "title", "description", "type", "price_cents", "currency", 
      "size_m2", "address", "neighborhood", "city", "region", "location", 
      "amenities", "photos", "status", "price_unit", "phone", "web", "contact_default"
    ];
    
    const values = columns.map(c => escape(s[c]));
    sql += `INSERT INTO spaces (${columns.join(", ")}) VALUES (${values.join(", ")});\\n`;
  }
  
  fs.writeFileSync("supabase/import_scraped.sql", sql);
  console.log("Exportats " + spaces.length + " espais a supabase/import_scraped.sql");
}

exportScraped();

