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
import { Trash2, SquarePen, Eye, QrCode, CheckCircle, Filter } from 'lucide-react';
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

import AddWasteBin from './add';
import EditWasteBin from './edit';
import DeleteWasteBin from './delete';
import ShowWasteBin from './show';

export default function WasteBinManagement() {
    const columns = [
        { header: 'Bin Name', width: '15%' },
        { header: 'QR Code', width: '12%' },
        { header: 'Resident', width: '18%' },
        { header: 'Bin Type', width: '12%' },
        { header: 'Status', width: '10%' },
        { header: 'Registered', width: '12%' },
        { header: 'Last Collected', width: '12%' },
        { header: 'Action', width: '12%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editWasteBin, setEditWasteBin] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteWasteBin, setDeleteWasteBin] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewWasteBin, setViewWasteBin] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const [collectedBins, setCollectedBins] = useState(new Set());

    const pagination = usePage().props.wasteBins;
    const wasteBinData = usePage().props.wasteBins.data;
    const residents = usePage().props.residents;

    const [search, setSearch] = useState(usePage().props.search || '');
    const [binTypeFilter, setBinTypeFilter] = useState(usePage().props.binTypeFilter || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');
    const [residentFilter, setResidentFilter] = useState(usePage().props.residentFilter || '');
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.waste-bin-management.index'), 
            { 
                search: e.target.value,
                bin_type: binTypeFilter,
                status: statusFilter,
                resident: residentFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'bin_type') {
            setBinTypeFilter(value);
        } else if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'resident') {
            setResidentFilter(value);
        }

        router.get(
            route('admin.waste-bin-management.index'),
            {
                search,
                bin_type: type === 'bin_type' ? value : binTypeFilter,
                status: type === 'status' ? value : statusFilter,
                resident: type === 'resident' ? value : residentFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setBinTypeFilter('');
        setStatusFilter('');
        setResidentFilter('');
        
        router.get(
            route('admin.waste-bin-management.index'),
            {
                search,
                bin_type: '',
                status: '',
                resident: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.waste-bin-management.index'), 
            { 
                search, 
                page,
                bin_type: binTypeFilter,
                status: statusFilter,
                resident: residentFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleGenerateQrCode = (wasteBin) => {
        window.open(route('admin.waste-bin-management.generate-qr', wasteBin.id), '_blank');
        toast.success('QR Code generated successfully');
    };

    const handleMarkCollected = (wasteBin) => {
        router.post(
            route('admin.waste-bin-management.mark-collected', wasteBin.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCollectedBins(prev => new Set([...prev, wasteBin.id]));
                    toast.success('Waste bin marked as collected');
                },
                onError: () => {
                    toast.error('Failed to mark as collected');
                }
            }
        );
    };

    const getBinTypeColor = (type) => {
        const colors = {
            'biodegradable': 'bg-green-100 text-green-800',
            'non-biodegradable': 'bg-gray-100 text-gray-800',
            'recyclable': 'bg-blue-100 text-blue-800',
            'hazardous': 'bg-red-100 text-red-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'damaged': 'bg-red-100 text-red-800',
            'full': 'bg-yellow-100 text-yellow-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const hasActiveFilters = binTypeFilter || statusFilter || residentFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Waste Bin Management",
        },
    ];

    const binTypes = [
        { value: 'biodegradable', label: 'Biodegradable' },
        { value: 'non-biodegradable', label: 'Non-Biodegradable' },
        { value: 'recyclable', label: 'Recyclable' },
        { value: 'hazardous', label: 'Hazardous' },
    ];

    const statuses = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'damaged', label: 'Damaged' },
        { value: 'full', label: 'Full' },
    ];

    return (
        <>
        {showAddModal && (
            <AddWasteBin setShowAddModal={setShowAddModal} residents={residents} />
        )}

        {showEditModal && (
            <EditWasteBin 
                setShowEditModal={setShowEditModal} 
                wasteBin={editWasteBin}
                residents={residents}
            />
        )}
        
        {showDeleteModal && (
            <DeleteWasteBin 
                setShowDeleteModal={setShowDeleteModal} 
                wasteBin={deleteWasteBin}
            />
        )}

        {showViewModal && (
            <ShowWasteBin 
                setShowViewModal={setShowViewModal} 
                wasteBin={viewWasteBin}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Waste Bin Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search waste bins..."
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
                                                    {[binTypeFilter, statusFilter, residentFilter].filter(Boolean).length}
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

                                            {/* Bin Type Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Bin Type
                                                </label>
                                                <Select 
                                                    value={binTypeFilter} 
                                                    onValueChange={(value) => handleFilterChange('bin_type', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Types" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Types</SelectItem>
                                                        {binTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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

                                            {/* Resident Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Resident
                                                </label>
                                                <Select 
                                                    value={residentFilter} 
                                                    onValueChange={(value) => handleFilterChange('resident', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Residents" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Residents</SelectItem>
                                                        {residents && residents.map(resident => (
                                                            <SelectItem key={resident.id} value={resident.id.toString()}>
                                                                {resident.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Add Waste Bin Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Waste Bin
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={wasteBinData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {wasteBinData.map(wasteBin => (
                            <TableRow key={wasteBin.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {wasteBin.name}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm font-mono'>
                                    {wasteBin.qr_code}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {wasteBin.resident?.name || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getBinTypeColor(wasteBin.bin_type)}`}>
                                        {wasteBin.bin_type.replace('-', ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(wasteBin.status)}`}>
                                        {wasteBin.status}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {formatDate(wasteBin.registered_at)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {formatDate(wasteBin.last_collected)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewWasteBin(wasteBin);
                                                setShowViewModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                            title="View"
                                            aria-label="View"
                                            type="button"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {/* <button
                                            onClick={() => handleGenerateQrCode(wasteBin)}
                                            className="p-2 rounded hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition"
                                            title="Generate QR Code"
                                            aria-label="Generate QR Code"
                                            type="button"
                                        >
                                            <QrCode size={18} />
                                        </button> */}
                                        {!collectedBins.has(wasteBin.id) && (
                                            <button
                                                onClick={() => handleMarkCollected(wasteBin)}
                                                className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                                title="Mark as Collected"
                                                aria-label="Mark as Collected"
                                                type="button"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditWasteBin(wasteBin);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteWasteBin(wasteBin);
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