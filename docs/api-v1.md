# API v1 — somespai

Base URL: `https://app.somespai.net/api/v1`

## Authentication

All endpoints require an `X-API-Key` header. Keys are managed by admins via SQL in the `api_keys` table. To generate a key:

```sql
-- Generate a key (run once, save the secret; it's never retrievable again)
do $$
declare
  v_secret text := encode(gen_random_bytes(32), 'hex');  -- 64-char hex key
  v_prefix text := left(v_secret, 8);
  v_hash   text := encode(digest(v_secret, 'sha256'), 'hex');
begin
  insert into api_keys (name, key_prefix, key_hash, scopes, created_by)
  values ('My app', v_prefix, v_hash, '{spaces:read}', auth.uid());

  raise notice 'API key: %', v_secret;
end $$;
```

Store the key in your app's environment variables as `SOMESPAI_API_KEY`.

---

## GET /api/v1/spaces

Returns active spaces matching the given filters.

### Query parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int 1–100 | `20` | Page size |
| `cursor` | string | — | Opaque pagination cursor from `pagination.next_cursor` |
| `bbox` | string | — | Bounding box `lng_min,lat_min,lng_max,lat_max` (exclusive with `near`) |
| `near` | string | — | Center point `lat,lng` (exclusive with `bbox`) |
| `radius` | int (m) | `5000` | Radius in metres (only with `near`) |
| `type` | string | — | Comma-separated types: `storage,workspace,garden,room,parking` |
| `price_min` | int | — | Minimum price in cents |
| `price_max` | int | — | Maximum price in cents |
| `price_unit` | string | — | `month`, `day`, or `hour` |
| `size_min_m2` | number | — | Minimum size in m² |
| `size_max_m2` | number | — | Maximum size in m² |
| `city` | string | — | Exact city match (case-insensitive) |
| `neighborhood` | string | — | Partial neighborhood match |
| `amenities` | string | — | Comma-separated required amenities |
| `q` | string | — | Full-text search across title, description, city, neighborhood |
| `sort` | string | `featured` | `featured`, `newest`, `price_asc`, `price_desc`, `distance` (`distance` requires `near`) |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "parking-biada-13",
      "type": "parking",
      "title": "Parking Biada 13, Gràcia",
      "description": "Plaça de pàrquing coberta...",
      "price": { "cents": 12000, "unit": "month", "currency": "EUR" },
      "size_m2": 12.5,
      "address": "Carrer de Biada, 13",
      "neighborhood": "Vila de Gràcia",
      "city": "Barcelona",
      "region": "Catalunya",
      "location": { "lat": 41.4036, "lng": 2.1577 },
      "distance_m": 342.1,
      "photos": ["https://..."],
      "amenities": ["covered", "auto_gate"],
      "owner": { "id": "uuid", "display_name": "Joan", "avatar_url": null },
      "rating": { "average": 4.5, "count": 3 },
      "published_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-03-20T14:00:00Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJhdCI6IjIwMjUtMDEtMTVUMTA6MzA6MDBaIiwiaWQiOiJ1dWlkIn0",
    "limit": 20
  }
}
```

`distance_m` is `null` unless the `near` parameter is used. `next_cursor` is `null` on the last page.

### Error format

```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": { "issues": [...] }
  }
}
```

Error codes: `INVALID_PARAMS` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `UPSTREAM_ERROR` (502).

---

## Examples

### Parkings in the Eixample district

```bash
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?type=parking&neighborhood=Eixample&limit=10'
```

### Storage spaces within 1 km of Plaça Catalunya

```bash
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?type=storage&near=41.3879,2.1699&radius=1000&sort=distance'
```

### Spaces in a bounding box, cheapest first

```bash
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?bbox=2.1,41.3,2.2,41.5&sort=price_asc&limit=50'
```

### Paginate through all active spaces

```bash
# First page
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?limit=100'

# Next page (use next_cursor from previous response)
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?limit=100&cursor=<next_cursor>'
```
