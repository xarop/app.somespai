export const WORKSHOP_CATEGORIES = [
  { value: 'ceramica', ca: 'Ceràmica', es: 'Cerámica', en: 'Pottery' },
  {
    value: 'plantas',
    ca: 'Plantes i terraris',
    es: 'Plantas y terrarios',
    en: 'Plants and terrariums',
  },
  { value: 'cuina', ca: 'Cuina', es: 'Cocina', en: 'Cooking' },
  { value: 'pintura', ca: 'Pintura', es: 'Pintura', en: 'Painting' },
  { value: 'joieria', ca: 'Joieria', es: 'Joyería', en: 'Jewellery' },
  { value: 'teatre', ca: 'Teatre', es: 'Teatro', en: 'Theatre' },
  { value: 'costura', ca: 'Costura', es: 'Costura', en: 'Sewing' },
  {
    value: 'fusteria',
    ca: 'Fusteria i manualitats',
    es: 'Carpintería y manualidades',
    en: 'Woodworking and crafts',
  },
  {
    value: 'floristeria',
    ca: 'Floristeria',
    es: 'Floristería',
    en: 'Floristry',
  },
  {
    value: 'reposteria',
    ca: 'Rebosteria i pa',
    es: 'Repostería y pan',
    en: 'Baking and pastry',
  },
  {
    value: 'begudes',
    ca: 'Vi, cervesa i cocteleria',
    es: 'Vino, cerveza y coctelería',
    en: 'Wine, beer and cocktails',
  },
  {
    value: 'musica',
    ca: 'Música',
    es: 'Música',
    en: 'Music',
  },
  {
    value: 'dansa',
    ca: 'Dansa i moviment',
    es: 'Danza y movimiento',
    en: 'Dance and movement',
  },
  {
    value: 'benestar',
    ca: 'Ioga i benestar',
    es: 'Yoga y bienestar',
    en: 'Yoga and wellbeing',
  },
  {
    value: 'fotografia',
    ca: 'Fotografia i vídeo',
    es: 'Fotografía y vídeo',
    en: 'Photography and video',
  },
  {
    value: 'escriptura',
    ca: 'Escriptura i lletres',
    es: 'Escritura y letras',
    en: 'Writing and lettering',
  },
  {
    value: 'illustracio',
    ca: 'Il·lustració i dibuix',
    es: 'Ilustración y dibujo',
    en: 'Illustration and drawing',
  },
  {
    value: 'textil',
    ca: 'Teixit, ganxet i macramé',
    es: 'Tejido, ganchillo y macramé',
    en: 'Weaving, crochet and macramé',
  },
  {
    value: 'vidre',
    ca: 'Vidre i vitrall',
    es: 'Vidrio y vidriera',
    en: 'Glass and stained glass',
  },
  {
    value: 'cuir',
    ca: 'Cuir i espardenyes',
    es: 'Cuero y alpargatas',
    en: 'Leather and espadrilles',
  },
  {
    value: 'escultura',
    ca: 'Escultura i modelatge',
    es: 'Escultura y modelado',
    en: 'Sculpture and modelling',
  },
  {
    value: 'maker',
    ca: 'Electrònica i maker',
    es: 'Electrónica y maker',
    en: 'Electronics and maker',
  },
  {
    value: 'altres',
    ca: 'Altres activitats',
    es: 'Otras actividades',
    en: 'Other activities',
  },
] as const;

export function getWorkshopCategoryLabel(category: string, locale: string): string {
  const entry = WORKSHOP_CATEGORIES.find((item) => item.value === category);
  if (!entry) return category;
  return entry[locale as keyof typeof entry] ?? entry.ca;
}
