// Fetches og:image (or falls back to thum.io screenshot) for spaces with real URLs
// Generates a SQL file to update photos[] in the DB
// Run: node scripts/fetch-og-images.mjs | npx supabase db query --linked

const SPACES = [
  { slug: 'metres-kubiks-badalona',      url: 'https://metreskubiks.com/' },
  { slug: 'bluespace-badalona-nord',     url: 'https://www.bluespace.es/alquiler-trasteros/barcelona/badalona' },
  { slug: 'bluespace-badalona-sur',      url: 'https://www.bluespace.es/alquiler-trasteros/barcelona/badalona' },
  { slug: 'boxmaster-badalona',          url: 'https://www.boxmaster.es/alquiler-trasteros-badalona' },
  { slug: 'cowork40-badalona',           url: 'https://cowork40.com/' },
  { slug: 'bdn-lab-coworking',           url: 'https://bdnlab.org/coworking/' },
  { slug: 'bdn-working-badalona',        url: 'https://www.bdnworking.com/' },
  { slug: 'espai114-coworking-badalona', url: 'https://espai114.com/' },
  { slug: 'ir10-sala-reunions-badalona', url: 'https://ir10virtualspace.com/' },
  { slug: 'aticco-pallars-193',          url: 'https://aticco.com/' },
  { slug: 'betahaus-viladomat',          url: 'https://barcelona.betahaus.com/' },
  { slug: 'crec-consell-de-cent',        url: 'https://crec.cat/' },
  { slug: 'mob-almogavers',              url: 'https://www.mob-barcelona.com/' },
  { slug: 'onecowork-marina',            url: 'https://www.onecowork.com/' },
  { slug: 'spaces-diagonal',            url: 'https://www.spacesworks.com/es/barcelona/' },
  { slug: 'talent-garden-llacuna',       url: 'https://talentgarden.com/en/campus/barcelona/' },
  { slug: 'utopicus-pallars-85',         url: 'https://utopicus.es/' },
];

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Somespai/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      const img = ogMatch[1].trim();
      return img.startsWith('http') ? img : new URL(img, url).href;
    }
    // twitter:image fallback
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch?.[1]) {
      const img = twMatch[1].trim();
      return img.startsWith('http') ? img : new URL(img, url).href;
    }
  } catch { /* ignore */ }
  return null;
}

function thumio(url) {
  return `https://image.thum.io/get/width/1200/crop/630/${encodeURIComponent(url)}`;
}

const lines = [];
for (const { slug, url } of SPACES) {
  process.stderr.write(`Fetching ${slug}... `);
  const ogImg = await getOgImage(url);
  const photo = ogImg ?? thumio(url);
  const source = ogImg ? 'og:image' : 'thum.io';
  process.stderr.write(`${source}: ${photo.slice(0, 80)}\n`);
  const escaped = photo.replace(/'/g, "''");
  lines.push(`  ('${slug}', ARRAY['${escaped}']::text[])`);
  await new Promise(r => setTimeout(r, 500));
}

const sql = `
UPDATE spaces SET photos = v.photos
FROM (VALUES
${lines.join(',\n')}
) AS v(slug, photos)
WHERE spaces.slug = v.slug
  AND (spaces.photos IS NULL OR array_length(spaces.photos, 1) IS NULL OR array_length(spaces.photos, 1) = 0);
`;

process.stdout.write(sql);
