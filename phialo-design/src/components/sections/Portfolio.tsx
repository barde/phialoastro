import { useState, useEffect, useRef, useMemo } from 'react';
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

// Portfolio content with translations
const portfolioContent = {
  de: {
    items: [
      {
        // DNA-Spirale Ohrhänger
        description: "Elegante Ohrhänger inspiriert von der DNA-Doppelhelix-Struktur. Diese einzigartigen Schmuckstücke verbinden wissenschaftliche Ästhetik mit kunstvoller Handwerkskunst.",
        materials: ["925er Silber", "Rhodiniert"],
        techniques: ["3D-Modellierung", "Wachsausschmelzverfahren", "Handpolitur"],
        details: "Die spiralförmige Struktur wurde in Blender entworfen und durch präzise 3D-Drucktechnologie in Wachs umgesetzt. Nach dem Guss in 925er Silber wurden die Ohrhänger sorgfältig von Hand poliert und rhodiniert für dauerhaften Glanz."
      },
      {
        // Turmalinring Masterpiece
        description: "Ein außergewöhnlicher Ring mit einem seltenen grünen Turmalin als Zentrum. Die moderne Fassung betont die natürliche Schönheit des Edelsteins.",
        materials: ["750er Weißgold", "Grüner Turmalin 3.2ct", "Brillanten 0.24ct"],
        techniques: ["CAD-Design", "Mikropavé-Fassung", "Hochglanzpolitur"],
        details: "Der Ring wurde speziell für den ausgewählten Turmalin entworfen. Die asymmetrische Fassung hebt die einzigartige Farbe und Klarheit des Steins hervor, während die seitlichen Brillanten zusätzlichen Glanz verleihen."
      },
      {
        // Silbernes Schloss-Münzkästchen
        description: "Eine kunstvolle Neuinterpretation des klassischen Sparschweins als elegantes Schloss-Münzkästchen. Funktionale Kunst trifft auf traditionelle Silberschmiedekunst.",
        materials: ["925er Silber", "Vergoldet"],
        techniques: ["3D-Modellierung", "Silberguss", "Gravur", "Teilvergoldung"],
        details: "Dieses einzigartige Stück vereint die Funktionalität eines Sparbehälters mit der Ästhetik eines mittelalterlichen Schlosses. Die feinen Details wurden durch präzise 3D-Modellierung erreicht und traditionell in Silber gegossen."
      },
      {
        // Möbius-Skulptur
        description: "Eine faszinierende Interpretation des Möbiusbandes als Schmuckskulptur. Die unendliche Schleife symbolisiert Kontinuität und Ewigkeit.",
        materials: ["925er Silber", "Hochglanzpoliert"],
        techniques: ["Parametrisches Design", "3D-Druck", "Feinguss"],
        details: "Die mathematisch perfekte Form wurde durch parametrisches Design in Blender erstellt. Die nahtlose, einseitige Oberfläche wurde durch sorgfältige Handarbeit zu einem spiegelnden Finish poliert."
      },
      {
        // Silberne Madonna-Krone
        description: "Eine majestätische Krone für sakrale Kunstwerke. Traditionelle Symbolik trifft auf moderne Fertigungstechniken.",
        materials: ["925er Silber", "Vergoldet", "Zirkonia"],
        techniques: ["3D-Modellierung", "Wachsausschmelzverfahren", "Steinbesatz"],
        details: "Diese filigrane Krone wurde für eine Madonnenfigur entworfen. Jedes Ornament wurde einzeln modelliert und die Zirkonia-Steine von Hand gefasst. Die Teilvergoldung betont die sakrale Bedeutung des Stücks."
      },
      {
        // ParookaVille Jubiläumsring
        description: "Ein exklusiver Gedenkring zum 10-jährigen Jubiläum des ParookaVille Festivals. Limitierte Auflage für besondere Sammler.",
        materials: ["925er Silber", "Schwarzes Rhodium"],
        techniques: ["3D-Design", "Lasergravur", "Oberflächenveredelung"],
        details: "Der Ring vereint Festival-Symbolik mit hochwertiger Schmuckkunst. Die detaillierte Gravur zeigt Elemente des Festivals, während die schwarze Rhodinierung für einen modernen Look sorgt."
      },
      {
        // Ouroboros Anhänger
        description: "Der mythische Ouroboros - eine Schlange, die sich in den eigenen Schwanz beißt. Ein kraftvolles Symbol für Unendlichkeit und Wiedergeburt.",
        materials: ["925er Silber", "Patiniert"],
        techniques: ["Skulpturale Modellierung", "Feinguss", "Antik-Finish"],
        details: "Jede Schuppe wurde einzeln modelliert, um maximale Detailtreue zu erreichen. Die Patinierung betont die Textur und verleiht dem Stück eine antike Ausstrahlung."
      },
      {
        // Tansanit Ring
        description: "Ein eleganter Solitärring mit einem seltenen blauen Tansanit. Die klassische Fassung unterstreicht die außergewöhnliche Farbe des Edelsteins.",
        materials: ["750er Weißgold", "Tansanit 2.8ct", "Brillanten 0.18ct"],
        techniques: ["CAD-Design", "Krappenfassung", "Diamantbesatz"],
        details: "Der tiefblaue Tansanit wird von einer klassischen Viererkrappenfassung gehalten. Die Ringschiene ist mit Brillanten besetzt, die das Licht einfangen und den Hauptstein zum Strahlen bringen."
      },
      {
        // Meisen-Anstecker
        description: "Naturgetreue Nachbildung einer Bartmeise als eleganter Anstecker. Perfekt für Naturliebhaber und Vogelbeobachter.",
        materials: ["925er Silber", "Emaille", "Saphir"],
        techniques: ["Detailmodellierung", "Emaillearbeit", "Mikrogravur"],
        details: "Die filigrane Federstruktur wurde durch präzise 3D-Modellierung erreicht. Die Emaille-Details verleihen dem Vogel lebensechte Farben, während ein kleiner Saphir als Auge funkelt."
      }
    ]
  },
  en: {
    items: [
      {
        // DNA Spiral Earrings
        description: "Elegant earrings inspired by the DNA double helix structure. These unique pieces of jewelry combine scientific aesthetics with artistic craftsmanship.",
        materials: ["925 Silver", "Rhodium-plated"],
        techniques: ["3D Modeling", "Lost-wax Casting", "Hand Polishing"],
        details: "The spiral structure was designed in Blender and realized through precise 3D printing technology in wax. After casting in 925 silver, the earrings were carefully hand-polished and rhodium-plated for lasting brilliance."
      },
      {
        // Tourmaline Ring Masterpiece
        description: "An extraordinary ring featuring a rare green tourmaline as its centerpiece. The modern setting emphasizes the natural beauty of the gemstone.",
        materials: ["750 White Gold", "Green Tourmaline 3.2ct", "Diamonds 0.24ct"],
        techniques: ["CAD Design", "Micropavé Setting", "High Polish"],
        details: "The ring was specially designed for the selected tourmaline. The asymmetric setting highlights the stone's unique color and clarity, while the side diamonds add additional sparkle."
      },
      {
        // Silver Castle Piggy Bank
        description: "An artistic reinterpretation of the classic piggy bank as an elegant castle coin box. Functional art meets traditional silversmithing.",
        materials: ["925 Silver", "Gold-plated"],
        techniques: ["3D Modeling", "Silver Casting", "Engraving", "Partial Gilding"],
        details: "This unique piece combines the functionality of a savings container with the aesthetics of a medieval castle. The fine details were achieved through precise 3D modeling and traditionally cast in silver."
      },
      {
        // Möbius Sculpture
        description: "A fascinating interpretation of the Möbius strip as a jewelry sculpture. The infinite loop symbolizes continuity and eternity.",
        materials: ["925 Silver", "High Polish"],
        techniques: ["Parametric Design", "3D Printing", "Fine Casting"],
        details: "The mathematically perfect form was created through parametric design in Blender. The seamless, one-sided surface was carefully hand-worked to a mirror finish."
      },
      {
        // Silver Madonna Crown
        description: "A majestic crown for sacred artworks. Traditional symbolism meets modern manufacturing techniques.",
        materials: ["925 Silver", "Gold-plated", "Cubic Zirconia"],
        techniques: ["3D Modeling", "Lost-wax Casting", "Stone Setting"],
        details: "This delicate crown was designed for a Madonna figure. Each ornament was individually modeled and the cubic zirconia stones were hand-set. The partial gilding emphasizes the sacred significance of the piece."
      },
      {
        // ParookaVille Anniversary Ring
        description: "An exclusive commemorative ring for the 10th anniversary of the ParookaVille Festival. Limited edition for special collectors.",
        materials: ["925 Silver", "Black Rhodium"],
        techniques: ["3D Design", "Laser Engraving", "Surface Finishing"],
        details: "The ring combines festival symbolism with high-quality jewelry art. The detailed engraving shows festival elements, while the black rhodium plating provides a modern look."
      },
      {
        // Ouroboros Pendant
        description: "The mythical Ouroboros - a serpent eating its own tail. A powerful symbol of infinity and rebirth.",
        materials: ["925 Silver", "Patinated"],
        techniques: ["Sculptural Modeling", "Fine Casting", "Antique Finish"],
        details: "Each scale was individually modeled to achieve maximum detail. The patination emphasizes the texture and gives the piece an antique appearance."
      },
      {
        // Tanzanite Ring
        description: "An elegant solitaire ring featuring a rare blue tanzanite. The classic setting underscores the gemstone's exceptional color.",
        materials: ["750 White Gold", "Tanzanite 2.8ct", "Diamonds 0.18ct"],
        techniques: ["CAD Design", "Prong Setting", "Diamond Setting"],
        details: "The deep blue tanzanite is held by a classic four-prong setting. The ring shank is set with diamonds that capture light and make the main stone sparkle."
      },
      {
        // Bearded Tit Pin
        description: "Lifelike reproduction of a bearded tit as an elegant pin. Perfect for nature lovers and bird watchers.",
        materials: ["925 Silver", "Enamel", "Sapphire"],
        techniques: ["Detailed Modeling", "Enamel Work", "Micro Engraving"],
        details: "The delicate feather structure was achieved through precise 3D modeling. The enamel details give the bird lifelike colors, while a small sapphire sparkles as the eye."
      }
    ]
  }
};

// Function to get portfolio items with correct language
const getPortfolioItems = (lang: 'en' | 'de'): PortfolioItemData[] => {
  const content = portfolioContent[lang].items;
  
  return [
    {
      id: 1,
      title: lang === 'en' ? "DNA Spiral Earrings" : "DNA-Spirale Ohrhänger",
      category: lang === 'en' ? "Earrings" : "Ohrringe",
      image: "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
      slug: "dna-spirale-ohrhaenger",
      description: content[0].description,
      year: 2023,
      materials: content[0].materials,
      techniques: content[0].techniques,
      details: content[0].details,
      gallery: [
        "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
        "/images/portfolio/ohrhaenger_energetic_freigestellt_refl.jpg"
      ]
    },
    {
      id: 2,
      title: lang === 'en' ? "Tourmaline Ring Masterpiece" : "Turmalinring Masterpiece",
      category: lang === 'en' ? "Rings" : "Ringe",
      image: "/images/portfolio/turmalinring_refl.jpg",
      slug: "turmalinring-masterpiece",
      description: content[1].description,
      year: 2023,
      materials: content[1].materials,
      techniques: content[1].techniques,
      details: content[1].details,
      gallery: [
        "/images/portfolio/turmalinring_refl.jpg"
      ]
    },
    {
      id: 3,
      title: lang === 'en' ? "Silver Castle Piggy Bank" : "Silbernes Schloss-Münzkästchen",
      category: lang === 'en' ? "Sculptures" : "Skulpturen",
      image: "/images/portfolio/silver_piggy_bank.jpg",
      slug: "silber-piggy-bank",
      description: content[2].description,
      year: 2022,
      materials: content[2].materials,
      techniques: content[2].techniques,
      details: content[2].details,
      gallery: [
        "/images/portfolio/silver_piggy_bank.jpg"
      ]
    },
    {
      id: 4,
      title: lang === 'en' ? "Möbius Sculpture" : "Möbius-Skulptur",
      category: lang === 'en' ? "Sculptures" : "Skulpturen",
      image: "/images/portfolio/moebius.jpg",
      slug: "moebius-skulptur",
      description: content[3].description,
      year: 2023,
      materials: content[3].materials,
      techniques: content[3].techniques,
      details: content[3].details,
      gallery: [
        "/images/portfolio/moebius.jpg"
      ]
    },
    {
      id: 5,
      title: lang === 'en' ? "Silver Madonna Crown" : "Silberne Madonna-Krone",
      category: lang === 'en' ? "Sculptures" : "Skulpturen",
      image: "/images/portfolio/crown.jpg",
      slug: "madonna-krone",
      description: content[4].description,
      year: 2022,
      materials: content[4].materials,
      techniques: content[4].techniques,
      details: content[4].details,
      gallery: [
        "/images/portfolio/crown.jpg"
      ]
    },
    {
      id: 6,
      title: lang === 'en' ? "ParookaVille Anniversary Ring" : "ParookaVille Jubiläumsring",
      category: lang === 'en' ? "Rings" : "Ringe",
      image: "/images/portfolio/parookavillering.jpg",
      slug: "parookaville-ring",
      description: content[5].description,
      year: 2024,
      materials: content[5].materials,
      techniques: content[5].techniques,
      details: content[5].details,
      gallery: [
        "/images/portfolio/parookavillering.jpg"
      ]
    },
    {
      id: 7,
      title: lang === 'en' ? "Ouroboros Pendant" : "Ouroboros Anhänger",
      category: lang === 'en' ? "Pendants" : "Anhänger",
      image: "/images/portfolio/ouroboros-freigestellt-refl.jpg",
      slug: "ouroboros-anhaenger",
      description: content[6].description,
      year: 2023,
      materials: content[6].materials,
      techniques: content[6].techniques,
      details: content[6].details,
      gallery: [
        "/images/portfolio/ouroboros-freigestellt-refl.jpg",
        "/images/portfolio/ouroboros.jpg"
      ]
    },
    {
      id: 8,
      title: lang === 'en' ? "Tanzanite Ring" : "Tansanit Ring",
      category: lang === 'en' ? "Rings" : "Ringe",
      image: "/images/portfolio/tansanit_1.jpg",
      slug: "tansanit-ring",
      description: content[7].description,
      year: 2023,
      materials: content[7].materials,
      techniques: content[7].techniques,
      details: content[7].details,
      gallery: [
        "/images/portfolio/tansanit_1.jpg",
        "/images/portfolio/tansanit1.jpg"
      ]
    },
    {
      id: 9,
      title: lang === 'en' ? "Bearded Tit Pin" : "Meisen-Anstecker",
      category: lang === 'en' ? "Pins" : "Anstecker",
      image: "/images/portfolio/bartmeise_reflect.jpg",
      slug: "meisen-anstecker",
      description: content[8].description,
      year: 2023,
      materials: content[8].materials,
      techniques: content[8].techniques,
      details: content[8].details,
      gallery: [
        "/images/portfolio/bartmeise_reflect.jpg",
        "/images/portfolio/meise_frontal.jpg",
        "/images/portfolio/meise_seitlich.jpg",
        "/images/portfolio/meisenpin_seitlich.jpg"
      ]
    }
  ];
};

const categories = [
  { id: 'all', label: 'Alle Arbeiten', labelEn: 'All Works' },
  { id: 'Rings', label: 'Ringe', labelEn: 'Rings' },
  { id: 'Earrings', label: 'Ohrringe', labelEn: 'Earrings' },
  { id: 'Pendants', label: 'Anhänger', labelEn: 'Pendants' },
  { id: 'Sculptures', label: 'Skulpturen', labelEn: 'Sculptures' },
  { id: 'Pins', label: 'Anstecker', labelEn: 'Pins' }
];

interface PortfolioProps {
  lang?: 'en' | 'de';
}

export default function Portfolio({ lang = 'de' }: PortfolioProps) {
  // Use state to handle language detection properly
  const [actualLang, setActualLang] = useState(lang);
  
  // Detect language from URL AFTER hydration to avoid mismatches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const urlLang = pathname.startsWith('/en') ? 'en' : 'de';
      setActualLang(urlLang);
      
      // Debug logging
      console.log('Portfolio Language Detection:', {
        propLang: lang,
        urlLang,
        pathname
      });
    }
  }, []); // Run once after mount
  
  const isEnglish = actualLang === 'en';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<PortfolioItemData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Get portfolio items with correct language using useMemo to recalculate when language changes
  const portfolioItems = useMemo(() => getPortfolioItems(actualLang), [actualLang]);
  
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(portfolioItems);
    } else {
      setFilteredItems(portfolioItems.filter(item => item.category === activeFilter));
    }
  }, [activeFilter, portfolioItems]);

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
            {isEnglish 
              ? "Discover our handcrafted 3D designs and realized jewelry pieces."
              : "Entdecken Sie unsere handgefertigten 3D-Designs und realisierten Schmuckstücke."
            }
          </p>
          <div className="text-center">
            <a 
              href="https://instagram.com/phialo_design" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-gold hover:text-gold/80 font-medium transition-colors"
            >
              {isEnglish ? "Portfolio on Instagram" : "Portfolio auf Instagram"}
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
            isEnglish={isEnglish}
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
            lang={actualLang}
          />
        )}
      </div>
    </section>
  );
}
