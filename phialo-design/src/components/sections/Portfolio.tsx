import { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import PortfolioGrid from '../portfolio/PortfolioGrid';
import PortfolioFilter from '../portfolio/PortfolioFilter';

// Real portfolio data from migrated content
const portfolioItems = [
  {
    id: 1,
    title: "DNA-Spirale Ohrhänger",
    category: "Ohrringe",
    image: "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
    featured: true,
    slug: "dna-spirale-ohrhaenger"
  },
  {
    id: 2,
    title: "Turmalinring Masterpiece",
    category: "Ringe",
    image: "/images/portfolio/turmalinring_refl.jpg",
    featured: true,
    slug: "turmalinring-masterpiece"
  },
  {
    id: 3,
    title: "Silbernes Schloss-Münzkästchen",
    category: "Skulpturen",
    image: "/images/portfolio/silver_piggy_bank.jpg",
    featured: true,
    slug: "silber-piggy-bank"
  },
  {
    id: 4,
    title: "Möbius-Skulptur",
    category: "Skulpturen",
    image: "/images/portfolio/moebius.jpg",
    featured: true,
    slug: "moebius-skulptur"
  },
  {
    id: 5,
    title: "Silberne Madonna-Krone",
    category: "Skulpturen",
    image: "/images/portfolio/crown.jpg",
    featured: false,
    slug: "madonna-krone"
  },
  {
    id: 6,
    title: "ParookaVille Jubiläumsring",
    category: "Ringe",
    image: "/images/portfolio/parookavillering.jpg",
    featured: true,
    slug: "parookaville-ring"
  },
  {
    id: 7,
    title: "Ouroboros Anhänger",
    category: "Anhänger",
    image: "/images/portfolio/ouroboros-freigestellt-refl.jpg",
    featured: false,
    slug: "ouroboros-anhaenger"
  },
  {
    id: 8,
    title: "Tansanit Ring",
    category: "Ringe",
    image: "/images/portfolio/tansanit_1.jpg",
    featured: true,
    slug: "tansanit-ring"
  },
  {
    id: 9,
    title: "Meisen-Anstecker",
    category: "Anstecker",
    image: "/images/portfolio/bartmeise_reflect.jpg",
    featured: false,
    slug: "meisen-anstecker"
  }
];

const categories = [
  { id: 'all', label: 'Alle Arbeiten' },
  { id: 'Ringe', label: 'Ringe' },
  { id: 'Ohrringe', label: 'Ohrringe' },
  { id: 'Anhänger', label: 'Anhänger' },
  { id: 'Skulpturen', label: 'Skulpturen' },
  { id: 'Anstecker', label: 'Anstecker' }
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
    <section id="portfolio" className="portfolio-section py-24 bg-white" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >          <h2 className="font-display text-4xl md:text-5xl font-medium text-midnight mb-6">
            Portfolio
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Entdecken Sie unsere handgefertigten 3D-Designs und realisierten Schmuckstücke.
          </p>
          <div className="text-center">
            <a 
              href="https://instagram.com/phialo_design" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-gold hover:text-gold/80 font-medium transition-colors"
            >
              Portfolio auf Instagram
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>            </a>
          </div>
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
