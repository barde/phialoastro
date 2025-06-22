// Portfolio item interface for use across the portfolio feature
export interface PortfolioItemData {
  id: number;
  title: string;
  category: string;
  image: string;
  slug: string;
  description: string;
  year: number;
  materials: string[];
  techniques: string[];
  details: string;
  gallery: string[];
}

// Portfolio filter types
export type PortfolioCategory = 'all' | 'rings' | 'earrings' | 'necklaces' | 'sculptures' | 'special';

// Portfolio content structure
export interface PortfolioContent {
  items: Array<{
    description: string;
    materials: string[];
    techniques: string[];
    details: string;
  }>;
}

// Portfolio translations
export interface PortfolioTranslations {
  de: PortfolioContent;
  en: PortfolioContent;
}