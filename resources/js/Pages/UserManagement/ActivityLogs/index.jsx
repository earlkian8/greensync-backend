import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import TableComponent from '@/Components/AdminLayout/table';

import { 
  TableRow, 
  TableCell 
} from "@/components/ui/table"

export default function ActivityLogsIndex() {
  const breadcrumbs = [
    { name: "Home", href: route('dashboard') },
    { name: "User Management", href: route('user-management.activity-logs.index') },
    { name: "Activity Logs" },
    ];

  const columns = [
    { header: 'Module', width: '16%' },
    { header: 'Action', width: '16%' },
    { header: 'User', width: '20%' },
    { header: 'Description', width: '24%' },
    { header: 'IP Address', width: '8%' },
    { header: 'Date', width: '16%' },
  ];

  const logs = usePage().props.logs?.data || [];
  const pagination = usePage().props.logs;
  const initialSearch = usePage().props.search || '';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debounceTimer = useRef(null);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      router.get(
        route('user-management.activity-logs.index'),
        { search: searchInput },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  const handlePageChange = ({ page }) => {
    router.get(
      route('user-management.activity-logs.index'),
      { search: searchInput, page },
      { preserveState: true, preserveScroll: true, replace: true }
    );
  };

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Activity Logs" />

      <div>
        <div className="w-full sm:px-6 lg:px-8">
          <div className="mb-6">
            
            
          </div>
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <TableComponent
              columns={columns}
              data={logs}
              pagination={pagination}
              search={searchInput}
              onSearch={handleSearch}
              onPageChange={handlePageChange}
              showAddButton={false}
            >
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">{log.module}</TableCell>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">{log.action}</TableCell>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">{log.user?.name || 'System'}</TableCell>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">{log.description}</TableCell>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">{log.ip_address}</TableCell>
                  <TableCell className="text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,}).replace(' at ', ' at ')}
                    </TableCell>   
                </TableRow>
              ))}
            </TableComponent>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}