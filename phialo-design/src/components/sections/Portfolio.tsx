import { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import PortfolioGrid from '../portfolio/PortfolioGrid';
import PortfolioFilter from '../portfolio/PortfolioFilter';

// Mock portfolio data - will be replaced with actual content collections
const portfolioItems = [
  {
    id: 1,
    title: "Ewigkeit Ring",
    category: "Verlobungsringe",
    image: "/images/portfolio/ewigkeit-ring.jpg",
    featured: true,
    slug: "ewigkeit-ring"
  },
  {
    id: 2,
    title: "Moderne Kette",
    category: "Halsketten",
    image: "/images/portfolio/moderne-kette.jpg",
    featured: true,
    slug: "moderne-kette"
  },
  {
    id: 3,
    title: "Kunst Brosche",
    category: "Broschen",
    image: "/images/portfolio/kunst-brosche.jpg",
    featured: false,
    slug: "kunst-brosche"
  },
  {
    id: 4,
    title: "Elegante Ohrringe",
    category: "Ohrringe",
    image: "/images/portfolio/elegante-ohrringe.jpg",
    featured: true,
    slug: "elegante-ohrringe"
  },
  {
    id: 5,
    title: "Custom Armband",
    category: "Armbänder",
    image: "/images/portfolio/custom-armband.jpg",
    featured: false,
    slug: "custom-armband"
  },
  {
    id: 6,
    title: "Vintage Ring",
    category: "Ringe",
    image: "/images/portfolio/vintage-ring.jpg",
    featured: false,
    slug: "vintage-ring"
  }
];

const categories = [
  { id: 'all', label: 'Alle Arbeiten' },
  { id: 'Verlobungsringe', label: 'Verlobungsringe' },
  { id: 'Halsketten', label: 'Halsketten' },
  { id: 'Ohrringe', label: 'Ohrringe' },
  { id: 'Ringe', label: 'Ringe' },
  { id: 'Custom', label: 'Maßanfertigungen' }
];

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState(portfolioItems);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(portfolioItems);
    } else {
      setFilteredItems(portfolioItems.filter(item => item.category === activeFilter));
    }
  }, [activeFilter]);
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
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
    <section className="portfolio-section py-24 bg-white" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium text-midnight mb-6">
            Unsere Arbeiten
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Jedes Schmuckstück erzählt eine einzigartige Geschichte. 
            Entdecken Sie unsere handverlesenen Kreationen, die Tradition 
            mit modernster 3D-Technologie verbinden.
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-12"
        >
          <PortfolioFilter
            categories={categories}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <PortfolioGrid items={filteredItems} />
        </motion.div>

        {/* View All CTA */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mt-16"
        >
          <a
            href="/portfolio"
            className="inline-flex items-center px-8 py-4 text-sm font-medium text-gold border border-gold rounded-full hover:bg-gold hover:text-white transition-all duration-200 group"
          >
            Komplettes Portfolio ansehen
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
