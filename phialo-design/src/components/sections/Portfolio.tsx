import { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import PortfolioGrid from '../portfolio/PortfolioGrid';
import PortfolioFilter from '../portfolio/PortfolioFilter';
import PortfolioModal from '../common/PortfolioModal';

// Export Portfolio item interface for use in other components
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

// Real portfolio data from migrated content
const portfolioItems: PortfolioItemData[] = [
  {
    id: 1,
    title: "DNA-Spirale Ohrhänger",
    category: "Ohrringe",
    image: "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
    slug: "dna-spirale-ohrhaenger",
    description: "Elegante Ohrhänger inspiriert von der DNA-Doppelhelix-Struktur. Diese einzigartigen Schmuckstücke verbinden wissenschaftliche Ästhetik mit kunstvoller Handwerkskunst.",
    year: 2023,
    materials: ["925er Silber", "Rhodiniert"],
    techniques: ["3D-Modellierung", "Wachsausschmelzverfahren", "Handpolitur"],
    details: "Die spiralförmige Struktur wurde in Blender entworfen und durch präzise 3D-Drucktechnologie in Wachs umgesetzt. Nach dem Guss in 925er Silber wurden die Ohrhänger sorgfältig von Hand poliert und rhodiniert für dauerhaften Glanz.",
    gallery: [
      "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
      "/images/portfolio/ohrhaenger_energetic_freigestellt_refl.jpg"
    ]
  },
  {
    id: 2,
    title: "Turmalinring Masterpiece",
    category: "Ringe",
    image: "/images/portfolio/turmalinring_refl.jpg",
    slug: "turmalinring-masterpiece",
    description: "Ein außergewöhnlicher Ring mit einem seltenen grünen Turmalin als Zentrum. Die moderne Fassung betont die natürliche Schönheit des Edelsteins.",
    year: 2023,
    materials: ["750er Weißgold", "Grüner Turmalin 3.2ct", "Brillanten 0.24ct"],
    techniques: ["CAD-Design", "Mikropavé-Fassung", "Hochglanzpolitur"],
    details: "Der Ring wurde speziell für den ausgewählten Turmalin entworfen. Die asymmetrische Fassung hebt die einzigartige Farbe und Klarheit des Steins hervor, während die seitlichen Brillanten zusätzlichen Glanz verleihen.",
    gallery: [
      "/images/portfolio/turmalinring_refl.jpg",
      "/images/portfolio/square_tourmaline1_square.jpg",
      "/images/portfolio/square_tourmaline3.jpg"
    ]
  },
  {
    id: 3,
    title: "Silbernes Schloss-Münzkästchen",
    category: "Skulpturen",
    image: "/images/portfolio/silver_piggy_bank.jpg",
    slug: "silber-piggy-bank",
    description: "Eine kunstvolle Neuinterpretation des klassischen Sparschweins als elegantes Schloss-Münzkästchen. Funktionale Kunst trifft auf traditionelle Silberschmiedekunst.",
    year: 2022,
    materials: ["925er Silber", "Vergoldet"],
    techniques: ["3D-Modellierung", "Silberguss", "Gravur", "Teilvergoldung"],
    details: "Dieses einzigartige Stück vereint die Funktionalität eines Sparbehälters mit der Ästhetik eines mittelalterlichen Schlosses. Die feinen Details wurden durch präzise 3D-Modellierung erreicht und traditionell in Silber gegossen.",
    gallery: [
      "/images/portfolio/silver_piggy_bank.jpg"
    ]
  },
  {
    id: 4,
    title: "Möbius-Skulptur",
    category: "Skulpturen",
    image: "/images/portfolio/moebius.jpg",
    slug: "moebius-skulptur",
    description: "Eine faszinierende Interpretation des Möbiusbandes als Schmuckskulptur. Die unendliche Schleife symbolisiert Kontinuität und Ewigkeit.",
    year: 2023,
    materials: ["925er Silber", "Hochglanzpoliert"],
    techniques: ["Parametrisches Design", "3D-Druck", "Feinguss"],
    details: "Die mathematisch perfekte Form wurde durch parametrisches Design in Blender erstellt. Die nahtlose, einseitige Oberfläche wurde durch sorgfältige Handarbeit zu einem spiegelnden Finish poliert.",
    gallery: [
      "/images/portfolio/moebius.jpg"
    ]
  },
  {
    id: 5,
    title: "Silberne Madonna-Krone",
    category: "Skulpturen",
    image: "/images/portfolio/crown.jpg",
    slug: "madonna-krone",
    description: "Eine majestätische Krone für sakrale Kunstwerke. Traditionelle Symbolik trifft auf moderne Fertigungstechniken.",
    year: 2022,
    materials: ["925er Silber", "Vergoldet", "Zirkonia"],
    techniques: ["3D-Modellierung", "Wachsausschmelzverfahren", "Steinbesatz"],
    details: "Diese filigrane Krone wurde für eine Madonnenfigur entworfen. Jedes Ornament wurde einzeln modelliert und die Zirkonia-Steine von Hand gefasst. Die Teilvergoldung betont die sakrale Bedeutung des Stücks.",
    gallery: [
      "/images/portfolio/crown.jpg"
    ]
  },
  {
    id: 6,
    title: "ParookaVille Jubiläumsring",
    category: "Ringe",
    image: "/images/portfolio/parookavillering.jpg",
    slug: "parookaville-ring",
    description: "Ein exklusiver Gedenkring zum 10-jährigen Jubiläum des ParookaVille Festivals. Limitierte Auflage für besondere Sammler.",
    year: 2024,
    materials: ["925er Silber", "Schwarzes Rhodium"],
    techniques: ["3D-Design", "Lasergravur", "Oberflächenveredelung"],
    details: "Der Ring vereint Festival-Symbolik mit hochwertiger Schmuckkunst. Die detaillierte Gravur zeigt Elemente des Festivals, während die schwarze Rhodinierung für einen modernen Look sorgt.",
    gallery: [
      "/images/portfolio/parookavillering.jpg"
    ]
  },
  {
    id: 7,
    title: "Ouroboros Anhänger",
    category: "Anhänger",
    image: "/images/portfolio/ouroboros-freigestellt-refl.jpg",
    slug: "ouroboros-anhaenger",
    description: "Der mythische Ouroboros - eine Schlange, die sich in den eigenen Schwanz beißt. Ein kraftvolles Symbol für Unendlichkeit und Wiedergeburt.",
    year: 2023,
    materials: ["925er Silber", "Patiniert"],
    techniques: ["Skulpturale Modellierung", "Feinguss", "Antik-Finish"],
    details: "Jede Schuppe wurde einzeln modelliert, um maximale Detailtreue zu erreichen. Die Patinierung betont die Textur und verleiht dem Stück eine antike Ausstrahlung.",
    gallery: [
      "/images/portfolio/ouroboros-freigestellt-refl.jpg",
      "/images/portfolio/ouroboros.jpg"
    ]
  },
  {
    id: 8,
    title: "Tansanit Ring",
    category: "Ringe",
    image: "/images/portfolio/tansanit_1.jpg",
    slug: "tansanit-ring",
    description: "Ein eleganter Solitärring mit einem seltenen blauen Tansanit. Die klassische Fassung unterstreicht die außergewöhnliche Farbe des Edelsteins.",
    year: 2023,
    materials: ["750er Weißgold", "Tansanit 2.8ct", "Brillanten 0.18ct"],
    techniques: ["CAD-Design", "Krappenfassung", "Diamantbesatz"],
    details: "Der tiefblaue Tansanit wird von einer klassischen Viererkrappenfassung gehalten. Die Ringschiene ist mit Brillanten besetzt, die das Licht einfangen und den Hauptstein zum Strahlen bringen.",
    gallery: [
      "/images/portfolio/tansanit_1.jpg",
      "/images/portfolio/tansanit1.jpg"
    ]
  },
  {
    id: 9,
    title: "Meisen-Anstecker",
    category: "Anstecker",
    image: "/images/portfolio/bartmeise_reflect.jpg",
    slug: "meisen-anstecker",
    description: "Naturgetreue Nachbildung einer Bartmeise als eleganter Anstecker. Perfekt für Naturliebhaber und Vogelbeobachter.",
    year: 2023,
    materials: ["925er Silber", "Emaille", "Saphir"],
    techniques: ["Detailmodellierung", "Emaillearbeit", "Mikrogravur"],
    details: "Die filigrane Federstruktur wurde durch präzise 3D-Modellierung erreicht. Die Emaille-Details verleihen dem Vogel lebensechte Farben, während ein kleiner Saphir als Auge funkelt.",
    gallery: [
      "/images/portfolio/bartmeise_reflect.jpg",
      "/images/portfolio/meise_frontal.jpg",
      "/images/portfolio/meise_seitlich.jpg",
      "/images/portfolio/meisenpin_seitlich.jpg"
    ]
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(portfolioItems);
    } else {
      setFilteredItems(portfolioItems.filter(item => item.category === activeFilter));
    }
  }, [activeFilter]);

  const handleItemClick = (item: PortfolioItemData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
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
          <PortfolioGrid items={filteredItems} onItemClick={handleItemClick} />
        </motion.div>

        {/* Portfolio Modal */}
        {selectedItem && (
          <PortfolioModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedItem(null);
            }}
            portfolioItem={selectedItem}
          />
        )}
      </div>
    </section>
  );
}
