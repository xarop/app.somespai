import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Llegim entorns directament dels .env
const localUrl = "http://127.0.0.1:54321";

// Cridarem manualment a l'API del .env per treure els valors sense carregar next
function getEnv(file) {
  try {
    const txt = fs.readFileSync(file, "utf8");
    const out = {};
    for (const line of txt.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        out[match[1].trim()] = val;
      }
    }
    return out;
  } catch (e) {
    return {};
  }
}

const prodEnvs = getEnv(".env.production.local");
const PROD_URL = prodEnvs.NEXT_PUBLIC_SUPABASE_URL;
const PROD_KEY = prodEnvs.SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_URL || !PROD_KEY) {
  console.error("Missing remote credentials.");
  process.exit(1);
}

const prodClient = createClient(PROD_URL, PROD_KEY);

async function run() {
  console.log("Connectant a producció...");
  const { data: spaces, error } = await prodClient.from('spaces').select('id, slug, photos');
  
  if (error) {
    console.error("Error", error);
    return;
  }
  
  let ok = 0, skip = 0, fail = 0;
  
  for (const space of spaces) {
    const rawPhotos = space.photos || [];
    
    // Filtrem fotos que tinguin http://127.0.0.1
    let needsUpdate = false;
    const newPhotos = [];
    
    for (const url of rawPhotos) {
      if (url.includes('127.0.0.1:54321')) {
        needsUpdate = true;
        // Obtenim path: "imports/..." o "admin/..."
        const parts = url.split('/space-photos/');
        if (parts.length < 2) continue;
        const bucketPath = parts[1];
        
        console.log(`Baixant de local: ${url}...`);
        
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          console.log(`  -> Pujant a prod (${bucketPath})`);
          
          // Pugem a prod
          const { error: uploadErr } = await prodClient.storage
            .from('space-photos')
            .upload(bucketPath, buffer, { contentType: 'image/webp', upsert: true });
            
          // Si dóna error i no ens cal aturar-nos:
          if (uploadErr) console.warn("  (avís upload):", uploadErr.message);
          
          // Genera nova URL pública de Prod
          const { data: { publicUrl } } = prodClient.storage.from('space-photos').getPublicUrl(bucketPath);
          newPhotos.push(publicUrl);
          ok++;
        } catch(e) {
          console.error(`  -> Error descarregant/pujant:`, e.message);
          // Mantenim antiga petada temporalment o simplement l'apartem? La canviem per només el URL de prod tot i estar caiguda, per seguir l'estructura
          const fakeProdUrl = PROD_URL + "/storage/v1/object/public/space-photos/" + bucketPath;
          newPhotos.push(fakeProdUrl);
          fail++;
        }
      } else {
        newPhotos.push(url);
      }
    }
    
    if (needsUpdate) {
       console.log(`Actualitzant array fotos de ${space.slug}...`);
       const { error: upErr } = await prodClient.from('spaces').update({ photos: newPhotos }).eq('id', space.id);
       if (upErr) console.error("Error BD", upErr.message);
    } else {
      skip++;
    }
  }
  
  console.log(`Finalitzat. Traspassades: ${ok}. Falses/errors: ${fail}. Ignorades: ${skip}`);
}

run();
