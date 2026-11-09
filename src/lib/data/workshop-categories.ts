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
] as const;

export function getWorkshopCategoryLabel(category: string, locale: string): string {
  const entry = WORKSHOP_CATEGORIES.find((item) => item.value === category);
  if (!entry) return category;
  return entry[locale as keyof typeof entry] ?? entry.ca;
}
