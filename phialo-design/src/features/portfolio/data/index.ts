export { portfolioItemsDE } from './portfolioDataDE';
export { portfolioItemsEN } from './portfolioDataEN';

// Category mapping to handle language differences
export const categoryMap = {
  'Rings': 'Ringe',
  'Earrings': 'Ohrringe',
  'Pendants': 'Anhänger',
  'Sculptures': 'Skulpturen',
  'Pins': 'Anstecker'
} as const;

export const categories = [
  { id: 'all', label: 'Alle Arbeiten', labelEn: 'All Works' },
  { id: 'Rings', label: 'Ringe', labelEn: 'Rings' },
  { id: 'Earrings', label: 'Ohrringe', labelEn: 'Earrings' },
  { id: 'Pendants', label: 'Anhänger', labelEn: 'Pendants' },
  { id: 'Sculptures', label: 'Skulpturen', labelEn: 'Sculptures' },
  { id: 'Pins', label: 'Anstecker', labelEn: 'Pins' }
];