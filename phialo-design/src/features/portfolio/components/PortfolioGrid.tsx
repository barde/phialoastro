import { motion } from '../../../lib/framer-motion';
import PortfolioItem from './PortfolioItem';
import type { PortfolioItemData } from './PortfolioSection';

interface PortfolioGridProps {
  items: PortfolioItemData[];
  onItemClick?: (item: PortfolioItemData) => void;
}

export default function PortfolioGrid({ items, onItemClick }: PortfolioGridProps) {
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
  };  return (
    <div className="portfolio-grid" data-testid="portfolio-grid">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          layout
          className="portfolio-item"
        >
          <PortfolioItem item={item} onItemClick={onItemClick} />
        </motion.div>
      ))}
    </div>
  );
}
