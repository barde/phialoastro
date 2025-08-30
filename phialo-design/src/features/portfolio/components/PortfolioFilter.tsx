interface Category {
  id: string;
  label: string;
  labelEn?: string;
}

interface PortfolioFilterProps {
  categories: Category[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  isEnglish?: boolean;
}

export default function PortfolioFilter({ categories, activeFilter, onFilterChange, isEnglish = false }: PortfolioFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            activeFilter === category.id
              ? 'bg-gold text-white shadow-sm'
              : 'text-gray-600 hover:text-midnight hover:bg-gray-100'
          }`}
        >
          {isEnglish && category.labelEn ? category.labelEn : category.label}
        </button>
      ))}
    </div>
  );
}
