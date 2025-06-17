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
          className={`portfolio-item ${item.featured ? 'featured' : ''}`}
        >
          <PortfolioItem item={item} />
        </motion.div>
      ))}
    </div>
  );
}

// Portfolio grid CSS-in-JS styles
const gridStyles = `
  .portfolio-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    grid-auto-rows: 300px;
  }
  
  @media (min-width: 640px) {
    .portfolio-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      grid-auto-rows: 320px;
    }
  }
  
  @media (min-width: 768px) {
    .portfolio-grid {
      grid-template-columns: repeat(3, 1fr);
      grid-auto-rows: 340px;
    }
  }
  
  @media (min-width: 1024px) {
    .portfolio-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5rem;
      grid-auto-rows: 360px;
    }
  }
  
  .portfolio-item {
    position: relative;
    overflow: hidden;
    border-radius: 0.5rem;
    background-color: #f3f4f6;
    height: 100%;
  }
  
  .portfolio-item.featured {
    grid-column: span 2;
    grid-row: span 2;
  }
  
  @media (max-width: 639px) {
    .portfolio-item.featured {
      grid-column: span 1 !important;
      grid-row: span 1 !important;
    }
  }
  
  .portfolio-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s ease;
  }
  
  .portfolio-item:hover img {
    transform: scale(1.05);
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
