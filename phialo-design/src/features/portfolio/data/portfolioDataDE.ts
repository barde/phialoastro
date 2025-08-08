import type { PortfolioItemData } from '../components/PortfolioSection';

export const portfolioItemsDE: PortfolioItemData[] = [
  {
    id: 1,
    title: "Geflügelter Ring",
    category: "Ringe",
    image: "/images/portfolio/winged-ring-1.jpg",
    slug: "winged-ring",
    description: "Maßgefertigter geflügelter Ring mit aufwendigen Details, 3D-gedruckt und in Gelbgold gegossen, mit maßgeschliffenem römischem Glas besetzt, veredelt durch Sandstrahlen und Polieren",
    year: 2025,
    materials: ["18kt Gold", "Antikes grünes römisches Glas"],
    techniques: ["3D-Druck", "Gussverfahren", "Sandstrahlen", "Polieren"],
    details: "Dieser außergewöhnliche Ring verbindet modernste 3D-Drucktechnologie mit traditioneller Goldschmiedekunst. Das komplexe Design der Flügel wurde zunächst digital modelliert und mittels 3D-Druck in Wachs umgesetzt.",
    gallery: [
      "/images/portfolio/winged-ring-1.jpg",
      "/images/portfolio/winged-ring-2.jpg",
      "/images/portfolio/winged-ring-3.jpg",
      "/images/portfolio/winged-ring-4.jpg",
      "/images/portfolio/winged-ring-5.jpg",
      "/images/portfolio/winged-ring-6.jpg",
      "/images/portfolio/winged-ring-7.jpg"
    ],
    youtubeVideoId: "P6dbNl9xsc8",
    youtubeAspectRatio: "9:16" as const
  },
  {
    id: 2,
    title: "DNA-Spirale Ohrhänger",
    category: "Ohrringe",
    image: "/images/portfolio/dna_spirale_freigestellt_refl.jpg",
    slug: "dna-spirale-ohrhaenger",
    description: "Elegante Ohrhänger inspiriert von der DNA-Doppelhelix-Struktur. Diese einzigartigen Schmuckstücke verbinden wissenschaftliche Ästhetik mit kunstvoller Handwerkskunst.",
    year: 2023,
    materials: ["Platin", "Fancy Diamanten"],
    techniques: ["3D-Modellierung", "Wachsausschmelzverfahren", "Handpolitur"],
    details: "Die spiralförmige Struktur wurde in Blender entworfen und durch präzise 3D-Drucktechnologie in Wachs umgesetzt. Nach dem Guss in 925er Silber wurden die Ohrhänger sorgfältig von Hand poliert und rhodiniert für dauerhaften Glanz.",
    gallery: [
      "/images/portfolio/dna_spirale_freigestellt_refl.jpg"
    ]
  },
  {
    id: 3,
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
      "/images/portfolio/turmalinring_refl.jpg"
    ]
  },
  {
    id: 4,
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
    title: "Schützenplakette",
    category: "Anhänger",
    image: "/images/portfolio/schuetzenplakette-1.jpg",
    slug: "schuetzenplakette",
    description: "Originalplastik einer Schützenplakette als detailreiche 3D-druckbare Datei nachmodelliert, dann in Sterlingsilber gegossen und als tragbare Ehrenplakette fertiggestellt.",
    year: 2024,
    materials: ["Sterling Silber"],
    techniques: ["3D-Digitalisierung", "3D-Druck", "Silberguss"],
    details: "Die originale Schützenplakette wurde sorgfältig digitalisiert und als hochdetaillierte 3D-Datei aufbereitet. Nach dem 3D-Druck des Modells erfolgte der Guss in Sterling Silber mit anschließender Feinbearbeitung.",
    gallery: [
      "/images/portfolio/schuetzenplakette-1.jpg",
      "/images/portfolio/schuetzenplakette-2.jpg"
    ],
    videoUrl: "https://www.youtube.com/embed/PLoXu-trLcQ"
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
    materials: ["925er Silber"],
    techniques: ["Detailmodellierung", "Mikrogravur"],
    details: "Die filigrane Federstruktur wurde durch präzise 3D-Modellierung erreicht. Die natürliche Form des Vogels wird durch rhodiniertes Silber perfekt zur Geltung gebracht.",
    gallery: [
      "/images/portfolio/bartmeise_reflect.jpg",
      "/images/portfolio/meisenpin_seitlich.jpg",
      "/images/portfolio/meise_frontal.jpg",
      "/images/portfolio/meise_seitlich.jpg"
    ]
  }
];