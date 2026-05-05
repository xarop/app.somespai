import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function exportAll() {
  const { data: spaces, error } = await supabase.from("spaces").select("*");
  if (error) throw error;
  
  if (!spaces || spaces.length === 0) {
    console.log("No spaces found.");
    return;
  }
  
  let sql = "-- Importacio TOTS els espais locals\n\n";
  for (const s of spaces) {
    const escape = (val: any) => {
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "string") return "'" + val.replace(/'/g, "''") + "'";
      if (typeof val === "number" || typeof val === "boolean") return val;
      if (Array.isArray(val)) return `ARRAY[${val.map(v => "'" + v.replace(/'/g, "''") + "'").join(",")}]::text[]`;
      
      // Handle PostGIS location object if it's returned as string or object
      if (typeof val === "object" && val !== null) {
         // if it's geojson object
         return "ST_GeomFromGeoJSON('" + JSON.stretch(val) + "')";
      }
      return "'" + val + "'";
    };
    
    // We leave owner_id as NULL intentionally so it has no conflicts
    const columns = [
      "slug", "title", "description", "type", "price_cents", "currency", 
      "size_m2", "address", "neighborhood", "city", "region", "location", 
      "amenities", "photos", "status", "price_unit", "phone", "web", "contact_default"
    ];
    
    const values = columns.map(c => {
       if (c === 'location') {
          // In PostGIS, Supabase might return location as WKB string (e.g. 0101000020E6100000C...) or text representation
          // Usually PostGIS strings can be cast back via ::geography
          // BUT wait, Supabase JS returns PostGIS point as `POINT(2.158 41.390)` string.
          // So we can just cast it: `'POINT(2.158 41.390)'::geography`
          const locStr = s[c];
          if (!locStr) return "NULL";
          return "'" + locStr + "'::geography";
       }
       return escape(s[c]);
    });
    sql += `INSERT INTO spaces (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
  }
  
  fs.writeFileSync("supabase/import_all_spaces.sql", sql);
  console.log("Exportats " + spaces.length + " espais a supabase/import_all_spaces.sql");
}

exportAll();
