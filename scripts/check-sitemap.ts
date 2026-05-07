import { getAllSlugsPublic } from '../src/lib/supabase/spaces-seo';
async function test() {
  const slugs = await getAllSlugsPublic();
  console.log("Found slugs:", slugs.length);
  if (slugs.length > 0) console.log(slugs[0]);
}
test().catch(console.error);
