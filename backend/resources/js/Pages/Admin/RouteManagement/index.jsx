import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import TableComponent from '@/Components/AdminLayout/table';
import { useState } from 'react';
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/Components/ui/table";
import { toast } from 'sonner';
import { Trash2, SquarePen, Eye, Check, X, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Button } from '@/Components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";

import AddRoute from './add';
import EditRoute from './edit';
import DeleteRoute from './delete';
import ShowRoute from './show';

export default function RouteManagement() {
    const columns = [
        { header: 'Route Name', width: '20%' },
        { header: 'Barangay', width: '15%' },
        { header: 'Start Location', width: '15%' },
        { header: 'End Location', width: '15%' },
        { header: 'Duration (min)', width: '10%' },
        { header: 'Stops', width: '8%' },
        { header: 'Status', width: '10%' },
        { header: 'Action', width: '12%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRoute, setEditRoute] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRoute, setDeleteRoute] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewRoute, setViewRoute] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.routes;
    const routeData = usePage().props.routes.data;
    const barangays = usePage().props.barangays;
    const residents = usePage().props.residents || [];

    const [search, setSearch] = useState(usePage().props.search || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');
    const [barangayFilter, setBarangayFilter] = useState(usePage().props.barangayFilter || '');
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.route-management.index'), 
            { 
                search: e.target.value,
                status: statusFilter,
                barangay: barangayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'barangay') {
            setBarangayFilter(value);
        }

        router.get(
            route('admin.route-management.index'),
            {
                search,
                status: type === 'status' ? value : statusFilter,
                barangay: type === 'barangay' ? value : barangayFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setBarangayFilter('');
        
        router.get(
            route('admin.route-management.index'),
            {
                search,
                status: '',
                barangay: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.route-management.index'), 
            { 
                search, 
                page,
                status: statusFilter,
                barangay: barangayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleToggleStatus = (route) => {
        const action = route.is_active ? 'deactivate' : 'activate';
        router.post(
            route(`admin.route-management.${action}`, route.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Route ${route.is_active ? 'deactivated' : 'activated'} successfully`);
                },
            }
        );
    };

    const hasActiveFilters = statusFilter || barangayFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('admin.dashboard'),
        },
        {
            name: "Route Management",
        },
    ];

    const statuses = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    return (
        <>
        {showAddModal && (
            <AddRoute setShowAddModal={setShowAddModal} />
        )}

        {showEditModal && (
            <EditRoute 
                setShowEditModal={setShowEditModal} 
                route={editRoute}
            />
        )}
        
        {showDeleteModal && (
            <DeleteRoute 
                setShowDeleteModal={setShowDeleteModal} 
                route={deleteRoute}
            />
        )}

        {showViewModal && (
            <ShowRoute 
                setShowViewModal={setShowViewModal} 
                route={viewRoute}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Route Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search routes..."
                                    value={search}
                                    onChange={handleSearch}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                />
                            </div>

                            {/* Filter Button with Popover */}
                            <div className="w-full sm:w-auto">
                                <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="outline"
                                            className="w-full sm:w-auto relative"
                                        >
                                            <Filter size={16} className="mr-2" />
                                            Filters
                                            {hasActiveFilters && (
                                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                                    {[statusFilter, barangayFilter].filter(Boolean).length}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="end">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">Filters</h4>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleClearFilters}
                                                        className="h-auto p-1 text-xs"
                                                    >
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Status
                                                </label>
                                                <Select 
                                                    value={statusFilter} 
                                                    onValueChange={(value) => handleFilterChange('status', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        {statuses.map(status => (
                                                            <SelectItem key={status.value} value={status.value}>
                                                                {status.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Barangay Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Barangay
                                                </label>
                                                <Select 
                                                    value={barangayFilter} 
                                                    onValueChange={(value) => handleFilterChange('barangay', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Barangays" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Barangays</SelectItem>
                                                        {barangays && barangays.map((barangay) => (
                                                            <SelectItem key={barangay} value={barangay}>
                                                                {barangay}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Add Route Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Route
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={routeData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {routeData.map(route => (
                            <TableRow key={route.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {route.route_name}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {route.barangay}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {route.start_location || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {route.end_location || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {route.estimated_duration || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                        {route.total_stops}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        route.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {route.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewRoute(route);
                                                setShowViewModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                            title="View"
                                            aria-label="View"
                                            type="button"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditRoute(route);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteRoute(route);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition"
                                            title="Delete"
                                            aria-label="Delete"
                                            type="button"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableComponent>
                </div>
            </div>
        </AuthenticatedLayout>
        </>
    );
}