import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import MagneticCursor from '../common/MagneticCursor';
import type { PortfolioItemData } from '../sections/Portfolio';

interface PortfolioItemProps {
  item: PortfolioItemData;
  onItemClick?: (item: PortfolioItemData) => void;
}

export default function PortfolioItem({ item, onItemClick }: PortfolioItemProps) {
  return (
    <MagneticCursor>
      <div className="portfolio-item-container group relative overflow-hidden rounded-lg bg-gray-100 h-full">        {/* Image with proper scaling */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="font-display text-xl font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-white/80 mb-4">{item.category}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onItemClick && onItemClick(item)}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              >
                <Eye size={16} className="mr-2" />
                Details
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>        </div>
      </div>
    </MagneticCursor>
  );
}
