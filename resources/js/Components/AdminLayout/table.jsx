import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import Pagination from "./pagination"
import { toast } from 'sonner'
import { Check } from 'lucide-react';

export default function TableComponent({
  // Table configuration
  columns = [],
  data = [],
  children,
  
  // Search functionality
  search = '',
  onSearch = () => {},
  searchPlaceholder = 'Search',
  showSearch = true,
  
  // Add button functionality
  showAddButton = true,
  onAdd = () => {},
  addButtonText = 'Add',
  addButtonDisabled = false,
  addButtonDisabledMessage = '',
  
  // Pagination
  pagination = null,
  onPageChange = () => {},
  
  // Select All functionality
  showSelectAll = false,
  isAllSelected = false,
  onSelectAll = () => {},
}) {
  // Safely get links from pagination
  const paginationLinks = pagination?.links || [];

  // Calculate total columns including select all
  const totalColumns = columns.length + (showSelectAll ? 1 : 0);

  return (
    <div className="p-2 bg-white rounded-md shadow">
      {/* Search and Add Button Row - Only render if either search or add button is visible */}
      {(showSearch || showAddButton) && (
        <div className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {showSearch && (
            <div className="w-full sm:w-auto flex-1">
              <Input 
                placeholder={searchPlaceholder} 
                value={search} 
                onChange={(e) => onSearch(e)} 
                className="focus:border-gray-800 focus:ring-2 focus:ring-gray-800 focus-visible:ring-gray-800 focus-within:ring-gray-800 w-full"
              />
            </div>
          )}
          {showAddButton && (
            <div className="w-full sm:w-auto">
              <Button 
                className="w-full sm:w-auto bg-zinc-700 hover:bg-zinc-900 text-white" 
                onClick={() => {
                  if (!addButtonDisabled) {
                    onAdd();
                  } else if (addButtonDisabledMessage) {
                    toast.error(addButtonDisabledMessage);
                  }
                }}
                disabled={addButtonDisabled}
              >
                {addButtonText}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="w-full overflow-x-auto rounded-lg">
        <Table className="min-w-[600px] w-full bg-white whitespace-nowrap">
          <TableHeader>
            <TableRow>
              {showSelectAll && (
                <TableHead className="text-left font-semibold px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm w-[30px]">
                  <div className="flex items-center justify-center">
                    <div
                      onClick={onSelectAll}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isAllSelected ? 'border-gray-800 bg-gray-800' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {isAllSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  className="text-left font-semibold px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm"
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              children
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumns} className="text-center py-4 text-gray-500">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Only rendered if links exist */}
      <Pagination 
        links={paginationLinks}
        onPageChange={onPageChange}
        search={search}
      />
    </div>
  )
}