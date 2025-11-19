import { router } from '@inertiajs/react';

export default function Pagination({ 
  links = [], 
  onPageChange = () => {}, 
  search = '' 
}) {
  // Safely filter and find links
  const pageLinks = Array.isArray(links) 
    ? links.filter(link => link?.label && !isNaN(Number(link.label))) 
    : [];

  const prevLink = links.find?.(link => link?.label?.toLowerCase()?.includes('previous')) ?? null;
  const nextLink = links.find?.(link => link?.label?.toLowerCase()?.includes('next')) ?? null;

  const handlePageClick = (url) => {
    if (url) {
      try {
        const urlObj = new URL(url, window.location.origin);
        const page = urlObj.searchParams.get('page');
        onPageChange({ search, page });
      } catch (e) {
        console.error("Failed to parse pagination URL:", e);
      }
    }
  };

  // Don't render if no meaningful links exist
  if (pageLinks.length === 0 && !prevLink?.url && !nextLink?.url) {
    return null;
  }

  return (
    <div className="flex justify-end mt-4">
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          disabled={!prevLink?.url}
          className={`px-4 py-1 rounded border text-sm font-medium ${
            !prevLink?.url 
              ? 'bg-white text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-black border-gray-300 hover:bg-gray-100'
          }`}
          onClick={() => handlePageClick(prevLink?.url)}
        >
          Previous
        </button>

        {/* Page Numbers */}
        {pageLinks.map((link, idx) => (
          <button
            key={idx}
            disabled={!link?.url}
            className={`px-4 py-1 rounded border text-sm font-medium transition-all duration-150
              ${link?.active ? 'bg-zinc-700 text-white hover:bg-zinc-900' : 'bg-white text-black border-gray-300 hover:bg-gray-200'}
              ${!link?.url ? 'cursor-not-allowed text-gray-400' : ''}
            `}
            onClick={() => handlePageClick(link?.url)}
          >
            {link?.label || ''}
          </button>
        ))}

        {/* Next Button */}
        <button
          disabled={!nextLink?.url}
          className={`px-4 py-1 rounded border text-sm font-medium ${
            !nextLink?.url 
              ? 'bg-white text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-black border-gray-300 hover:bg-gray-100'
          }`}
          onClick={() => handlePageClick(nextLink?.url)}
        >
          Next
        </button>
      </div>
    </div>
  );
}