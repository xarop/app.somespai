/**
 * bulk-scraper.ts
 * Scraper/Importador per lots des de Google Places cap a Somespai.
 * 
 * Execució:
 * bun run scripts/bulk-scraper.ts "trasteros en Badalona" storage
 * bun run scripts/bulk-scraper.ts "coworking a Gràcia" workspace
 * 
 * Requereix variables d'entorn (.env.local):
 * - GOOGLE_PLACES_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const query = process.argv[2];
const spaceType = process.argv[3] || 'storage'; // storage, workspace, garden, room

if (!query) {
  console.error('❌ Has de proporcionar una cerca. Ex: bun run scripts/bulk-scraper.ts "coworking a Gràcia" workspace');
  process.exit(1);
}

// Mobile-friendly photo target — longest side in px. Matches src/lib/images/resize-image.ts.
const MAX_PHOTO_DIMENSION = 1280;

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Falten variables d\'entorn (GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Utilitat per generar un slug
function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log(`\n🔍 Buscant "${query}" a Google Places...\n`);

  // 1. Cercar llocs
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results || searchData.results.length === 0) {
    console.log('No s\'han trobat resultats.');
    return;
  }

  console.log(`Trobase ${searchData.results.length} espais. Començant la importació...\n`);

  for (const place of searchData.results) {
    console.log(`➡️ Processant: ${place.name}`);

    // Obtenir detalls per agafar la web, telèfon, etc.
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,address_components,website,formatted_phone_number,geometry,photos&key=${GOOGLE_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    const details = detailsData.result;

    if (!details) continue;

    // Calcular dades simulades / generades (es podrien generar amb AI si es vol)
    const title = details.name;
    let slug = slugify(title) || 'espai';
    
    // Evitar duplicats de slug
    const { count } = await supabase.from('spaces').select('id', { count: 'exact', head: true }).eq('slug', slug);
    if (count && count > 0) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

    const lat = details.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng;
    const address = details.formatted_address;
    const web = details.website || null;
    const phone = details.formatted_phone_number || null;

    // Conseguit Ciutat i Barri dels components d'adreça si existeixen
    let city = null;
    let neighborhood = null;
    for (const comp of (details.address_components || [])) {
      if (comp.types.includes('locality')) {
        city = comp.long_name;
      }
      if (comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
        neighborhood = comp.long_name;
      }
    }

    // Generació de contingut adaptat segons el tipus
    let description = `Aquest és un espai comercial ubicat a ${address}. Originalment anomenat "${title}".`;
    let priceCents = 0; // 0 significa "No definit" o "?"
    let sizeM2 = 10;
    
    if (spaceType === 'workspace') {
      description = `Espai de treball / Coworking ubicat a ${address}. Disposa d'excel·lents connexions i tot el necessari per al teu dia a dia. Ideal per a autònoms i petites empreses.\n\nWebsite: ${web || 'No disponible'}`;
      sizeM2 = 5;
    } else if (spaceType === 'storage') {
      description = `Traster o espai d'emmagatzematge situat a ${address}. Accés fàcil i segur per guardar-hi tot el que necessitis.`;
      sizeM2 = 8;
    }

    // Gestionar les fotos (Descarregar la de Google, processar-la amb Sharp i pujar a Supabase)
    const photos: string[] = [];
    if (details.photos && details.photos.length > 0) {
      console.log(`   📸 Descarregant i optimitzant foto per ${title}...`);
      const photoRef = details.photos[0].photo_reference;
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${MAX_PHOTO_DIMENSION}&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`;

      try {
        const photoRes = await fetch(photoUrl);
        const arrayBuffer = await photoRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Format lleuger òptim per a mòbil: orientació EXIF, costat llarg ≤ 1280px, WebP q80
        const webpBuffer = await sharp(buffer)
          .rotate()
          .resize({ width: MAX_PHOTO_DIMENSION, height: MAX_PHOTO_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        
        const storagePath = `imports/${slug}-${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from('space-photos').upload(storagePath, webpBuffer, { contentType: 'image/webp' });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('space-photos').getPublicUrl(storagePath);
          photos.push(publicUrl);
        }
      } catch (err) {
        console.error(`   ❌ Error pujant foto per ${title}:`, err);
      }
    }

    // Inserir l'espai en estat "paused"
    const { error: insertError } = await supabase.from('spaces').insert({
      slug,
      title,
      type: spaceType,
      description,
      price_cents: priceCents,
      size_m2: sizeM2,
      address,
      city,
      neighborhood,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      photos,
      web,
      phone,
      contact_default: 'web',
      status: 'paused', // Es posa en pausa perquè cal revisar-los
      // owner_id queda null ja que l'espai encara no té un usuari associat específic
    });

    if (insertError) {
      console.error(`   ❌ Error guardant a DB:`, insertError.message);
    } else {
      console.log(`   ✅ Guardat a la base de dades (Pausat) amb ${photos.length} fotos.`);
    }
  }

  console.log(`\n🎉 Procés acabat! Pots anar al panell d'Administració per revisar i publicar els espais.`);
}

run();