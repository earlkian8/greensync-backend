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
import { Trash2, SquarePen, Eye, Filter, X } from 'lucide-react';
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

import AddCollectionSchedule from './add';
import EditCollectionSchedule from './edit';
import DeleteCollectionSchedule from './delete';
import ShowCollectionSchedule from './show';

export default function CollectionScheduleManagement() {
    const columns = [
        { header: 'Barangay', width: '15%' },
        { header: 'Day', width: '12%' },
        { header: 'Time', width: '10%' },
        { header: 'Waste Type', width: '15%' },
        { header: 'Frequency', width: '12%' },
        { header: 'Status', width: '10%' },
        { header: 'Created By', width: '16%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editSchedule, setEditSchedule] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteSchedule, setDeleteSchedule] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewSchedule, setViewSchedule] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.schedules;
    const scheduleData = usePage().props.schedules.data;
    const barangays = usePage().props.barangays;

    const [search, setSearch] = useState(usePage().props.search || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');
    const [barangayFilter, setBarangayFilter] = useState(usePage().props.barangayFilter || '');
    const [wasteTypeFilter, setWasteTypeFilter] = useState(usePage().props.wasteTypeFilter || '');
    const [dayFilter, setDayFilter] = useState(usePage().props.dayFilter || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.collection-schedule-management.index'), 
            { 
                search: e.target.value,
                status: statusFilter,
                barangay: barangayFilter,
                waste_type: wasteTypeFilter,
                day: dayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'barangay') {
            setBarangayFilter(value);
        } else if (type === 'waste_type') {
            setWasteTypeFilter(value);
        } else if (type === 'day') {
            setDayFilter(value);
        }

        router.get(
            route('admin.collection-schedule-management.index'),
            {
                search,
                status: type === 'status' ? value : statusFilter,
                barangay: type === 'barangay' ? value : barangayFilter,
                waste_type: type === 'waste_type' ? value : wasteTypeFilter,
                day: type === 'day' ? value : dayFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setBarangayFilter('');
        setWasteTypeFilter('');
        setDayFilter('');
        
        router.get(
            route('admin.collection-schedule-management.index'),
            {
                search,
                status: '',
                barangay: '',
                waste_type: '',
                day: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.collection-schedule-management.index'), 
            { 
                search, 
                page,
                status: statusFilter,
                barangay: barangayFilter,
                waste_type: wasteTypeFilter,
                day: dayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        // If time is in datetime format
        if (time.includes('T')) {
            const timeStr = time.split('T')[1].substring(0, 5);
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        }
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getWasteTypeLabel = (type) => {
        const labels = {
            'biodegradable': 'Biodegradable',
            'non-biodegradable': 'Non-Biodegradable',
            'recyclable': 'Recyclable',
            'special': 'Special',
            'all': 'All Types'
        };
        return labels[type] || type;
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-Weekly',
            'monthly': 'Monthly'
        };
        return labels[frequency] || frequency;
    };

    const hasActiveFilters = statusFilter || barangayFilter || wasteTypeFilter || dayFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Collection Schedule Management",
        },
    ];

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const wasteTypes = [
        { value: 'biodegradable', label: 'Biodegradable' },
        { value: 'non-biodegradable', label: 'Non-Biodegradable' },
        { value: 'recyclable', label: 'Recyclable' },
        { value: 'special', label: 'Special' },
        { value: 'all', label: 'All Types' },
    ];

    return (
        <>
        {showAddModal && (
            <AddCollectionSchedule setShowAddModal={setShowAddModal} />
        )}

        {showEditModal && (
            <EditCollectionSchedule 
                setShowEditModal={setShowEditModal} 
                schedule={editSchedule}
            />
        )}
        
        {showDeleteModal && (
            <DeleteCollectionSchedule 
                setShowDeleteModal={setShowDeleteModal} 
                schedule={deleteSchedule}
            />
        )}

        {showViewModal && (
            <ShowCollectionSchedule 
                setShowViewModal={setShowViewModal} 
                schedule={viewSchedule}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Collection Schedule Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search schedules..."
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
                                                    {[statusFilter, barangayFilter, wasteTypeFilter, dayFilter].filter(Boolean).length}
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
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Day Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Collection Day
                                                </label>
                                                <Select 
                                                    value={dayFilter} 
                                                    onValueChange={(value) => handleFilterChange('day', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Days" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Days</SelectItem>
                                                        {daysOfWeek.map(day => (
                                                            <SelectItem key={day} value={day}>{day}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Waste Type Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Waste Type
                                                </label>
                                                <Select 
                                                    value={wasteTypeFilter} 
                                                    onValueChange={(value) => handleFilterChange('waste_type', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Waste Types" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Waste Types</SelectItem>
                                                        {wasteTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
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
                                                        {barangays.map(barangay => (
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

                            {/* Add Schedule Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Schedule
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={scheduleData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {scheduleData.map(schedule => (
                            <TableRow key={schedule.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {schedule.barangay}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {schedule.collection_day}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {formatTime(schedule.collection_time)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getWasteTypeLabel(schedule.waste_type)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getFrequencyLabel(schedule.frequency)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        schedule.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {schedule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {schedule.creator?.name || 'N/A'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewSchedule(schedule);
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
                                                setEditSchedule(schedule);
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
                                                setDeleteSchedule(schedule);
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