import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import MagneticCursor from '../common/MagneticCursor';

interface PortfolioItemData {
  id: number;
  title: string;
  category: string;
  image: string;
  featured: boolean;
  slug: string;
}

interface PortfolioItemProps {
  item: PortfolioItemData;
}

export default function PortfolioItem({ item }: PortfolioItemProps) {
  return (
    <MagneticCursor>
      <div className="portfolio-item-container group relative overflow-hidden rounded-lg bg-gray-100 h-full">        {/* Image with simple img tag for debugging */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="font-display text-xl font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-white/80 mb-4">{item.category}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <a
                href={`/portfolio/${item.slug}`}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              >
                <Eye size={16} className="mr-2" />
                Details
              </a>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Featured badge */}
        {item.featured && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full">
            Featured
          </div>
        )}
      </div>
    </MagneticCursor>
  );
}
