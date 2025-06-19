interface Category {
  id: string;
  label: string;
}

interface PortfolioFilterProps {
  categories: Category[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function PortfolioFilter({ categories, activeFilter, onFilterChange }: PortfolioFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            activeFilter === category.id
              ? 'shadow-sm'
              : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeFilter === category.id ? 'var(--color-secondary)' : 'var(--color-gray-100)',
            color: activeFilter === category.id ? 'white' : 'var(--color-text-secondary)'
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== category.id) {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-200)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== category.id) {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
