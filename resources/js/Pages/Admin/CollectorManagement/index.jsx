import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import TableComponent from '@/Components/AdminLayout/table';
import { useState } from 'react';
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { Trash2, SquarePen, Eye, UserCheck, UserX, CheckCircle, XCircle, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/Components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import AddCollector from './add';
import EditCollector from './edit';
import DeleteCollector from './delete';
import ShowCollector from './show';

export default function CollectorManagement() {
    const columns = [
        { header: 'Employee ID', width: '10%' },
        { header: 'Name', width: '15%' },
        { header: 'Email', width: '15%' },
        { header: 'Phone', width: '12%' },
        { header: 'Vehicle Info', width: '15%' },
        { header: 'License', width: '10%' },
        { header: 'Status', width: '10%' },
        { header: 'Verified', width: '8%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCollector, setEditCollector] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCollector, setDeleteCollector] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewCollector, setViewCollector] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.collectors;
    const collectorData = usePage().props.collectors.data;

    const [search, setSearch] = useState(usePage().props.search || '');
    const [verificationFilter, setVerificationFilter] = useState(usePage().props.verificationFilter || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.collector-management.index'), 
            { 
                search: e.target.value,
                verification: verificationFilter,
                status: statusFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'verification') {
            setVerificationFilter(value);
        } else if (type === 'status') {
            setStatusFilter(value);
        }

        router.get(
            route('admin.collector-management.index'),
            {
                search,
                verification: type === 'verification' ? value : verificationFilter,
                status: type === 'status' ? value : statusFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setVerificationFilter('');
        setStatusFilter('');
        
        router.get(
            route('admin.collector-management.index'),
            {
                search,
                verification: '',
                status: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.collector-management.index'), 
            { 
                search, 
                page,
                verification: verificationFilter,
                status: statusFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleToggleStatus = (collector) => {
        const route_name = collector.is_active 
            ? 'admin.collector-management.deactivate' 
            : 'admin.collector-management.activate';
        
        router.post(route(route_name, collector.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Collector ${collector.is_active ? 'deactivated' : 'activated'} successfully`);
            }
        });
    };

    const handleToggleVerification = (collector) => {
        const route_name = collector.is_verified 
            ? 'admin.collector-management.unverify' 
            : 'admin.collector-management.verify';
        
        router.post(route(route_name, collector.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Collector ${collector.is_verified ? 'unverified' : 'verified'} successfully`);
            }
        });
    };

    const hasActiveFilters = verificationFilter || statusFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Collector Management",
        },
    ];

    return (
        <>
        {showAddModal && (
            <AddCollector setShowAddModal={setShowAddModal} />
        )}

        {showEditModal && (
            <EditCollector 
                setShowEditModal={setShowEditModal} 
                collector={editCollector}
            />
        )}
        
        {showDeleteModal && (
            <DeleteCollector 
                setShowDeleteModal={setShowDeleteModal} 
                collector={deleteCollector}
            />
        )}

        {showViewModal && (
            <ShowCollector 
                setShowViewModal={setShowViewModal} 
                collector={viewCollector}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Collector Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone, employee ID..."
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
                                                    {[verificationFilter, statusFilter].filter(Boolean).length}
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

                                            {/* Verification Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Verification Status
                                                </label>
                                                <Select 
                                                    value={verificationFilter} 
                                                    onValueChange={(value) => handleFilterChange('verification', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Verification" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="All">All Verification</SelectItem>
                                                        <SelectItem value="verified">Verified</SelectItem>
                                                        <SelectItem value="unverified">Unverified</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Account Status
                                                </label>
                                                <Select 
                                                    value={statusFilter} 
                                                    onValueChange={(value) => handleFilterChange('status', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="All">All Status</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Add Collector Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Collector
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={collectorData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {collectorData.map(collector => (
                            <TableRow key={collector.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm font-semibold'>
                                    #{collector.employee_id}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {collector.name}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {collector.email}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {collector.phone_number}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {collector.vehicle_type && collector.vehicle_plate_number ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{collector.vehicle_type}</span>
                                            <span className="text-zinc-600">{collector.vehicle_plate_number}</span>
                                        </div>
                                    ) : '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {collector.license_number || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            collector.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {collector.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span
                                        className={`p-1 rounded  ${
                                            collector.is_verified 
                                                ? 'text-green-600' 
                                                : 'text-yellow-600'
                                        }`}
                                        title={collector.is_verified ? 'Verified' : 'Unverified'}
                                    >
                                        {collector.is_verified ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewCollector(collector);
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
                                                setEditCollector(collector);
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
                                                setDeleteCollector(collector);
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