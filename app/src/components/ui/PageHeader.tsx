interface PageHeaderProps {
  title: string;
  description?: string;
  onAddNew?: () => void;
  addButtonText?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  onAddNew?: () => void;
  addButtonText?: string;
}

export function PageHeader({ title, description, onAddNew, addButtonText = "הוסף חדש" }: PageHeaderProps) {
  return (
    <div className="page-header animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">
            {title}
          </h1>
          {description && (
            <p className="page-description">
              {description}
            </p>
          )}
        </div>
        
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {addButtonText}
          </button>
        )}
      </div>
    </div>
  );
}
