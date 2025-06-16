import { motion } from 'framer-motion';
import PortfolioItem from './PortfolioItem';

interface PortfolioItemData {
  id: number;
  title: string;
  category: string;
  image: string;
  featured: boolean;
  slug: string;
}

interface PortfolioGridProps {
  items: PortfolioItemData[];
}

export default function PortfolioGrid({ items }: PortfolioGridProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <div className="portfolio-grid">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          layout
          className={`portfolio-item ${item.featured ? 'featured' : ''} ${getGridPosition(index)}`}
        >
          <PortfolioItem item={item} />
        </motion.div>
      ))}
    </div>
  );
}

// Generate asymmetric grid positions
function getGridPosition(index: number): string {
  const positions = [
    'col-span-2 row-span-2', // Large featured item
    'col-span-1 row-span-1', // Standard item
    'col-span-1 row-span-2', // Tall item
    'col-span-2 row-span-1', // Wide item
    'col-span-1 row-span-1', // Standard item
    'col-span-1 row-span-1', // Standard item
  ];
  
  return positions[index % positions.length] || 'col-span-1 row-span-1';
}

// Portfolio grid CSS-in-JS styles
const gridStyles = `
  .portfolio-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    grid-auto-rows: 280px;
  }
  
  @media (min-width: 768px) {
    .portfolio-grid {
      grid-template-columns: repeat(3, 1fr);
      grid-auto-rows: 320px;
    }
  }
  
  @media (min-width: 1024px) {
    .portfolio-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5rem;
    }
  }
  
  .portfolio-item.featured {
    grid-column: span 2;
    grid-row: span 2;
  }
  
  @media (max-width: 767px) {
    .portfolio-item {
      grid-column: span 1 !important;
      grid-row: span 1 !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'portfolio-grid-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = gridStyles;
    document.head.appendChild(style);
  }
}
