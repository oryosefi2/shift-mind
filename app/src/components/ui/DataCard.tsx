import { useState } from 'react';

interface DataCardProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  itemsPerPage?: number;
}

export function DataCard<T extends { id?: string | number }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  searchPlaceholder = "חיפוש...",
  itemsPerPage = 10 
}: DataCardProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = data.filter(item => 
    columns.some(column => 
      String(item[column.key]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card-elevated">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="input-primary max-w-md pr-10"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((column) => (
                <th 
                  key={String(column.key)} 
                  className="text-right py-4 px-6 font-semibold text-gray-700 font-['Assistant']"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="text-right py-4 px-6 font-semibold text-gray-700">פעולות</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📋</span>
                    <div>
                      {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'אין נתונים להצגה'}
                    </div>
                    {!searchTerm && (
                      <div className="text-sm">לחץ על "הוסף חדש" כדי להתחיל</div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr 
                  key={item.id || index} 
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="py-4 px-6 text-gray-800">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')
                      }
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="עריכה"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="מחיקה"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-6 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            מציג {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} מתוך {filteredData.length} רשומות
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← קודם
            </button>
            
            <span className="px-3 py-1 bg-blue-500 text-white rounded-lg">
              {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              הבא →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
