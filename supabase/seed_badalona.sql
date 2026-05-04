-- Badalona spaces seed
insert into spaces (slug, title, type, description, price_cents, price_unit, size_m2, address, neighborhood, city, region, location, amenities, photos, is_featured, contact_url, status)
values

-- TRASTEROS
(
  'metres-kubiks-badalona',
  'Metres Kubiks — Trasteros a Badalona',
  'storage',
  'Empresa local de Badalona especialitzada en trasteros de proximitat. Mòduls des de 3 m² fins a 13 m² (alçada 4,5 m). Sense permanència mínima. Promocions periòdiques disponibles.',
  9500, 'month', 4,
  'Carrer Latrilla, 10', 'La Salut', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2413490 41.4472573)',
  ARRAY['access_24h', 'cameras'],
  ARRAY[]::text[], false,
  'https://metreskubiks.com/', 'active'
),
(
  'bluespace-badalona-nord',
  'Bluespace Badalona Nord',
  'storage',
  'Gran centre de self-storage professional al nord de Badalona. Unitats privades des d''1 m² fins a 200 m². Aparcament gratuït, carros de transport, assegurança opcional.',
  9000, 'month', 10,
  'Riera de Canyadó, s/n', 'Canyet', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2564830 41.4561790)',
  ARRAY['access_24h', 'cameras', 'parking'],
  ARRAY[]::text[], false,
  'https://www.bluespace.es/alquiler-trasteros/barcelona/badalona', 'active'
),
(
  'bluespace-badalona-sur',
  'Bluespace Badalona Sud',
  'storage',
  'Bluespace al sud de Badalona, orientat a particulars i empreses. Mòduls des d''1 m², serveis de mudances, assegurança i aparcament inclosos.',
  7500, 'month', 6,
  'Avinguda del Maresme, 90-92', 'Sant Roc', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2296025 41.4327863)',
  ARRAY['access_24h', 'cameras', 'parking'],
  ARRAY[]::text[], false,
  'https://www.bluespace.es/alquiler-trasteros/barcelona/badalona', 'active'
),
(
  'boxmaster-badalona',
  'Boxmaster Badalona — Trasteros urbans',
  'storage',
  'Més de 90 unitats de trastero al cor de Badalona. Mòduls d''1 m² fins a 7 m² (alçada 2,5 m). Sense permanència, accés 24 h i videovigilància.',
  8000, 'month', 5,
  'Avinguda del Marquès de Mont-Roig, 35', 'Centre', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2339506 41.4406588)',
  ARRAY['access_24h', 'cameras'],
  ARRAY[]::text[], false,
  'https://www.boxmaster.es/alquiler-trasteros-badalona', 'active'
),

-- COWORKING
(
  'cowork40-badalona',
  'COwork40 — Coworking al centre de Badalona',
  'workspace',
  'Espai de coworking i despatxos privats al centre de Badalona. Facturació mensual sense permanència, 1 mes de dipòsit. Excel·lent connexió amb transport públic.',
  10000, 'month', null,
  'Carrer del Doctor Robert, 40', 'Centre', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2424741 41.4603971)',
  ARRAY['wifi', 'ac', 'heating', 'meeting_room', 'cameras'],
  ARRAY[]::text[], true,
  'https://cowork40.com/', 'active'
),
(
  'bdn-lab-coworking',
  'BDN Lab Coworking — Nau industrial reformada',
  'workspace',
  '300 m² de coworking en una nau industrial rehabilitada prop del passeig marítim i el metro (Gorg L2/L10). Terrassa, cuina, taquilles i ambient creatiu i comunitari.',
  15000, 'month', 300,
  'Carrer del General Weyler, 128', 'Gorg', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2382337 41.4420910)',
  ARRAY['wifi', 'meeting_room', 'locker', 'kitchen', 'terrace', 'hot_desk'],
  ARRAY[]::text[], true,
  'https://bdnlab.org/coworking/', 'active'
),
(
  'bdn-working-badalona',
  'BDN Working — Centre de negocis 24/7',
  'workspace',
  'Centre de negocis professional obert 24 h / 365 dies. Despatxos exteriors amb llum natural, accés per empremta digital, purificador d''aire i domiciliació d''empresa.',
  20000, 'month', null,
  'Carrer del Carme, 2', 'Centre', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2516276 41.4493430)',
  ARRAY['wifi', 'ac', 'heating', 'access_24h', 'meeting_room', 'fixed_desk', 'cameras'],
  ARRAY[]::text[], false,
  'https://www.bdnworking.com/', 'active'
),
(
  'espai114-coworking-badalona',
  'Espai 114 — Coworking professional',
  'workspace',
  'Coworking lluminós en planta baixa per a 12 usuaris. Tarifes per hores, dies o mes. Entorn col·laboratiu per a freelancers, emprenedors i pimes.',
  12000, 'month', 80,
  'Carrer de Francesc Layret, 114', 'Centre', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2502516 41.4526745)',
  ARRAY['wifi', 'meeting_room', 'printer', 'hot_desk'],
  ARRAY[]::text[], false,
  'https://espai114.com/', 'active'
),

-- SALA DE REUNIONS
(
  'ir10-sala-reunions-badalona',
  'IR10 Virtual Space — Sales de reunions',
  'room',
  'Dues sales equipades al cor de Badalona: sala de reunions (fins a 12 persones) i sala de formació (fins a 16 persones). Tarificació flexible per hores. WiFi fibra, projector i climatització.',
  3000, 'hour', 40,
  'Carrer Roger de Flor, 56', 'Centre', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2421272 41.4430770)',
  ARRAY['wifi', 'ac', 'projector', 'meeting_room'],
  ARRAY[]::text[], false,
  'https://ir10virtualspace.com/', 'active'
),

-- ESPAI EXTERIOR
(
  'espai-progres-coworking-badalona',
  'Espai Progrés — Oficina compartida',
  'workspace',
  'Oficina lluminosa de 40 m² per a 6 persones prop del metro Pep Ventura (L2) i a 5 min de la platja. WiFi de fibra 300 Mb, armari privat i zona office.',
  8000, 'month', 40,
  'Carrer del Progrés, 115', 'Llefià', 'Badalona', 'Catalunya',
  'SRID=4326;POINT(2.2325464 41.4338291)',
  ARRAY['wifi', 'locker', 'coffee', 'hot_desk'],
  ARRAY[]::text[], false,
  null, 'active'
)

on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  price_cents = excluded.price_cents,
  price_unit = excluded.price_unit,
  size_m2 = excluded.size_m2,
  address = excluded.address,
  neighborhood = excluded.neighborhood,
  location = excluded.location,
  amenities = excluded.amenities,
  contact_url = excluded.contact_url,
  status = excluded.status;
