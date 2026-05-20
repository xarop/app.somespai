import fs from 'fs';
import path from 'path';
import { MOCK_SPACES } from '../data/mock-spaces';

const DB_PATH = path.join(process.cwd(), 'src/lib/supabase/mock-db-file.json');

interface DbState {
  spaces: any[];
  profiles: any[];
  reviews: any[];
  favorites: any[];
  api_keys: any[];
}

function getInitialDbState(): DbState {
  // Map camelCase MOCK_SPACES to snake_case rows for the mock DB
  const spaces = MOCK_SPACES.map((s, idx) => ({
    id: s.id || String(idx + 1),
    slug: s.slug,
    owner_id: '00000000-0000-0000-0000-000000000001',
    title: s.title,
    description: s.description,
    type: s.type,
    price_cents: s.priceCents,
    currency: s.currency,
    size_m2: s.sizeM2,
    address: s.address,
    neighborhood: s.neighborhood,
    city: s.city,
    region: s.region,
    lat: s.lat,
    lng: s.lng,
    amenities: s.amenities,
    photos: s.photos || [],
    is_featured: s.isFeatured,
    rating: s.rating,
    reviews_count: s.reviewsCount,
    status: s.status,
    price_unit: s.priceUnit,
    phone: s.phone,
    email_contact: s.emailContact,
    whatsapp: s.whatsapp,
    web: s.web,
    contact_default: s.contactDefault,
    created_at: new Date(Date.now() - idx * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const profiles = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      display_name: 'Somespai Seed',
      avatar_url: null,
      bio: 'Base seed user',
      is_verified: true,
      is_premium: true,
      is_admin: true,
      created_at: new Date().toISOString(),
    },
  ];

  return {
    spaces,
    profiles,
    reviews: [],
    favorites: [],
    api_keys: [],
  };
}

function readDb(): DbState {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const state = getInitialDbState();
      fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
      return state;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read mock DB file:', e);
    return getInitialDbState();
  }
}

function writeDb(state: DbState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write mock DB file:', e);
  }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

function executeRpc(name: string, args: any, db: DbState): any {
  if (name === 'v1_search_spaces') {
    let result = [...db.spaces];

    // status active only
    result = result.filter((s) => s.status === 'active');

    // filter types
    if (args.p_types && args.p_types.length > 0) {
      result = result.filter((s) => args.p_types.includes(s.type));
    }

    // price limits
    if (args.p_price_min !== null && args.p_price_min !== undefined) {
      result = result.filter((s) => s.price_cents >= args.p_price_min);
    }
    if (args.p_price_max !== null && args.p_price_max !== undefined) {
      result = result.filter((s) => s.price_cents <= args.p_price_max);
    }
    if (args.p_price_unit !== null && args.p_price_unit !== undefined) {
      result = result.filter((s) => s.price_unit === args.p_price_unit);
    }

    // size limits
    if (args.p_size_min !== null && args.p_size_min !== undefined) {
      result = result.filter((s) => s.size_m2 >= args.p_size_min);
    }
    if (args.p_size_max !== null && args.p_size_max !== undefined) {
      result = result.filter((s) => s.size_m2 <= args.p_size_max);
    }

    // city & neighborhood
    if (args.p_city) {
      result = result.filter(
        (s) => s.city?.toLowerCase() === args.p_city.toLowerCase()
      );
    }
    if (args.p_neighborhood) {
      result = result.filter(
        (s) => s.neighborhood?.toLowerCase() === args.p_neighborhood.toLowerCase()
      );
    }

    // amenities
    if (args.p_amenities && args.p_amenities.length > 0) {
      result = result.filter((s) =>
        args.p_amenities.every((a: string) => s.amenities?.includes(a))
      );
    }

    // text search (title & description)
    if (args.p_q) {
      const q = args.p_q.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    // distance
    if (args.p_near_lat !== null && args.p_near_lng !== null) {
      result = result.map((s) => {
        const distance = getDistance(args.p_near_lat, args.p_near_lng, s.lat, s.lng);
        return { ...s, distance_m: distance };
      });
      if (args.p_radius !== null) {
        result = result.filter((s) => s.distance_m <= args.p_radius);
      }
    } else {
      result = result.map((s) => ({ ...s, distance_m: null }));
    }

    // sorting
    if (args.p_sort === 'distance' && args.p_near_lat !== null) {
      result.sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));
    } else if (args.p_sort === 'price_asc') {
      result.sort((a, b) => a.price_cents - b.price_cents);
    } else if (args.p_sort === 'price_desc') {
      result.sort((a, b) => b.price_cents - a.price_cents);
    } else {
      result.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
    }

    // Map fields back to database shape expected by search (SearchRow fields)
    const finalRows = result.map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.type,
      title: s.title,
      description: s.description || null,
      price_cents: s.price_cents,
      price_unit: s.price_unit,
      currency: s.currency || 'EUR',
      size_m2: s.size_m2 || null,
      address: s.address || null,
      neighborhood: s.neighborhood || null,
      city: s.city || null,
      region: s.region || null,
      photos: s.photos || [],
      amenities: s.amenities || [],
      is_featured: s.is_featured,
      rating: s.rating || 0,
      reviews_count: s.reviews_count || 0,
      lat: s.lat,
      lng: s.lng,
      distance_m: s.distance_m,
      created_at: s.created_at || new Date().toISOString(),
      updated_at: s.updated_at || new Date().toISOString(),
      owner_id: s.owner_id || '00000000-0000-0000-0000-000000000001',
      owner_name: 'Somespai Seed',
      owner_avatar: null,
    }));

    return { data: finalRows, error: null };
  }

  if (name === 'admin_list_users') {
    const list = db.profiles.map((p) => ({
      id: p.id,
      email: `${p.display_name.toLowerCase().replace(/\s+/g, '')}@somespai.cat`,
      created_at: p.created_at || new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    }));
    return { data: list, error: null };
  }

  return { data: null, error: { message: `RPC ${name} not implemented` } };
}

export function executeMockQueryServer(payload: any): any {
  const db = readDb();
  let writeRequired = false;

  const {
    table,
    filters,
    orderCol,
    orderAsc,
    limitCount,
    isSingle,
    isMaybeSingle,
    updateData,
    insertData,
    isDelete,
    rpcName,
    rpcArgs,
  } = payload;

  if (table === 'rpc') {
    return executeRpc(rpcName, rpcArgs, db);
  }

  const tableData = (db as any)[table] || [];

  // Write operation: INSERT/UPSERT
  if (insertData) {
    const itemsToInsert = Array.isArray(insertData) ? insertData : [insertData];
    const insertedItems = itemsToInsert.map((item: any) => {
      const newItem = {
        id: item.id || Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      };

      // If upsert, find duplicate and replace
      if (table === 'profiles' || table === 'favorites') {
        const idx = tableData.findIndex((existing: any) => {
          if (table === 'profiles') return existing.id === newItem.id;
          if (table === 'favorites')
            return (
              existing.user_id === newItem.user_id &&
              existing.space_id === newItem.space_id
            );
          return false;
        });
        if (idx !== -1) {
          tableData[idx] = { ...tableData[idx], ...newItem };
          return tableData[idx];
        }
      }

      tableData.push(newItem);
      return newItem;
    });

    writeDb(db);
    return { data: Array.isArray(insertData) ? insertedItems : insertedItems[0], error: null };
  }

  // Find matches
  const filterFn = (item: any) => {
    for (const f of filters || []) {
      const itemVal = item[f.col];
      if (f.type === 'eq') {
        if (itemVal !== f.val) return false;
      } else if (f.type === 'neq') {
        if (itemVal === f.val) return false;
      } else if (f.type === 'in') {
        if (!f.vals.includes(itemVal)) return false;
      } else if (f.type === 'is') {
        if (itemVal !== f.val) return false;
      } else if (f.type === 'not') {
        if (f.op === 'is') {
          if (f.val === null && itemVal !== null) return false;
          if (f.val !== null && itemVal === null) return false;
        }
      }
    }
    return true;
  };

  const matches = tableData.filter(filterFn);

  // Write operation: UPDATE
  if (updateData) {
    matches.forEach((item: any) => {
      Object.assign(item, updateData, { updated_at: new Date().toISOString() });
    });
    writeDb(db);
    return { data: matches, error: null };
  }

  // Write operation: DELETE
  if (isDelete) {
    (db as any)[table] = tableData.filter((item: any) => !filterFn(item));
    writeDb(db);
    return { data: matches, error: null };
  }

  // SELECT query sorting
  let result = [...matches];
  if (orderCol) {
    result.sort((a, b) => {
      const valA = a[orderCol];
      const valB = b[orderCol];
      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return orderAsc ? -1 : 1;
      if (valA > valB) return orderAsc ? 1 : -1;
      return 0;
    });
  }

  if (limitCount !== undefined) {
    result = result.slice(0, limitCount);
  }

  if (isSingle) {
    return {
      data: result[0] || null,
      error: result[0] ? null : { message: 'Row not found' },
    };
  } else if (isMaybeSingle) {
    return { data: result[0] || null, error: null };
  } else {
    return { data: result, error: null };
  }
}
