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
import { Trash2, SquarePen, Eye, Filter, Play, CheckCircle2, Route } from 'lucide-react';
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

import EditCollectionRequest from './edit';
import DeleteCollectionRequest from './delete';
import ShowCollectionRequest from './show';
import ToRouteModal from './to-route';

export default function CollectionRequestManagement() {
    const columns = [
        { header: 'Request Type', width: '15%' },
        { header: 'Resident', width: '15%' },
        { header: 'Waste Bin', width: '12%' },
        { header: 'Waste Type', width: '10%' },
        { header: 'Priority', width: '8%' },
        { header: 'Status', width: '10%' },
        { header: 'Collector', width: '12%' },
        { header: 'Preferred Date', width: '10%' },
        { header: 'Action', width: '8%' },
    ];

    const [showEditModal, setShowEditModal] = useState(false);
    const [editRequest, setEditRequest] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRequest, setDeleteRequest] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewRequest, setViewRequest] = useState(null);

    const [showToRouteModal, setShowToRouteModal] = useState(false);
    const [toRouteRequest, setToRouteRequest] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.requests;
    const requestData = usePage().props.requests.data;
    const residents = usePage().props.residents || [];
    const wasteBins = usePage().props.wasteBins || [];
    const collectors = usePage().props.collectors || [];

    const [search, setSearch] = useState(usePage().props.search || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');
    const [priorityFilter, setPriorityFilter] = useState(usePage().props.priorityFilter || '');
    const [wasteTypeFilter, setWasteTypeFilter] = useState(usePage().props.wasteTypeFilter || '');
    const [assignedFilter, setAssignedFilter] = useState(usePage().props.assignedFilter || '');
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.collection-request-management.index'), 
            { 
                search: e.target.value,
                status: statusFilter,
                priority: priorityFilter,
                waste_type: wasteTypeFilter,
                assigned: assignedFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'priority') {
            setPriorityFilter(value);
        } else if (type === 'waste_type') {
            setWasteTypeFilter(value);
        } else if (type === 'assigned') {
            setAssignedFilter(value);
        }

        router.get(
            route('admin.collection-request-management.index'),
            {
                search,
                status: type === 'status' ? value : statusFilter,
                priority: type === 'priority' ? value : priorityFilter,
                waste_type: type === 'waste_type' ? value : wasteTypeFilter,
                assigned: type === 'assigned' ? value : assignedFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setPriorityFilter('');
        setWasteTypeFilter('');
        setAssignedFilter('');
        
        router.get(
            route('admin.collection-request-management.index'),
            {
                search,
                status: '',
                priority: '',
                waste_type: '',
                assigned: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.collection-request-management.index'), 
            { 
                search, 
                page,
                status: statusFilter,
                priority: priorityFilter,
                waste_type: wasteTypeFilter,
                assigned: assignedFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleStartProgress = (request) => {
        router.post(
            route('admin.collection-request-management.start-progress', request.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
                onError: () => {
                    toast.error('Failed to start progress');
                },
            }
        );
    };

    const handleComplete = (request) => {
        router.post(
            route('admin.collection-request-management.complete', request.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
                onError: () => {
                    toast.error('Failed to complete request');
                },
            }
        );
    };


    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pending',
            assigned: 'Assigned',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        const labels = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            urgent: 'Urgent',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[priority] || 'bg-gray-100 text-gray-800'}`}>
                {labels[priority] || priority}
            </span>
        );
    };

    const getWasteTypeBadge = (wasteType) => {
        const badges = {
            biodegradable: 'bg-green-100 text-green-800',
            'non-biodegradable': 'bg-gray-100 text-gray-800',
            recyclable: 'bg-blue-100 text-blue-800',
            special: 'bg-purple-100 text-purple-800',
            all: 'bg-zinc-100 text-zinc-800',
        };
        const labels = {
            biodegradable: 'Bio',
            'non-biodegradable': 'Non-Bio',
            recyclable: 'Recyclable',
            special: 'Special',
            all: 'All',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${badges[wasteType] || 'bg-gray-100 text-gray-800'}`}>
                {labels[wasteType] || wasteType}
            </span>
        );
    };

    const hasActiveFilters = statusFilter || priorityFilter || wasteTypeFilter || assignedFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Collection Requests",
        },
    ];

    const statuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const priorities = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];

    const wasteTypes = [
        { value: 'biodegradable', label: 'Biodegradable' },
        { value: 'non-biodegradable', label: 'Non-Biodegradable' },
        { value: 'recyclable', label: 'Recyclable' },
        { value: 'special', label: 'Special' },
        { value: 'all', label: 'All Types' },
    ];

    const assignmentStatuses = [
        { value: 'assigned', label: 'Assigned' },
        { value: 'unassigned', label: 'Unassigned' },
    ];

    return (
        <>
        {showEditModal && editRequest && (
            <EditCollectionRequest 
                key={editRequest.id} // Force remount when editing different request
                setShowEditModal={setShowEditModal} 
                request={editRequest}
            />
        )}
        
        {showDeleteModal && (
            <DeleteCollectionRequest 
                setShowDeleteModal={setShowDeleteModal} 
                request={deleteRequest}
            />
        )}

        {showViewModal && (
            <ShowCollectionRequest 
                setShowViewModal={setShowViewModal} 
                request={viewRequest}
            />
        )}

        {showToRouteModal && toRouteRequest && (
            <ToRouteModal 
                key={toRouteRequest.id} // Force remount when adding different request to route
                setShowToRouteModal={setShowToRouteModal} 
                request={toRouteRequest}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Collection Request Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search requests..."
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
                                                    {[statusFilter, priorityFilter, wasteTypeFilter, assignedFilter].filter(Boolean).length}
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

                                            {/* Priority Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Priority
                                                </label>
                                                <Select 
                                                    value={priorityFilter} 
                                                    onValueChange={(value) => handleFilterChange('priority', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Priorities" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Priorities</SelectItem>
                                                        {priorities.map(priority => (
                                                            <SelectItem key={priority.value} value={priority.value}>
                                                                {priority.label}
                                                            </SelectItem>
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

                                            {/* Assignment Status Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Assignment Status
                                                </label>
                                                <Select 
                                                    value={assignedFilter} 
                                                    onValueChange={(value) => handleFilterChange('assigned', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Assignments" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Assignments</SelectItem>
                                                        {assignmentStatuses.map(status => (
                                                            <SelectItem key={status.value} value={status.value}>
                                                                {status.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={requestData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {requestData.map(request => (
                            <TableRow key={request.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="font-medium">{request.request_type}</div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div>
                                        <div className="font-medium">{request.resident?.name || '---'}</div>
                                        <div className="text-xs text-zinc-600">{request.resident?.phone_number || '---'}</div>
                                    </div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div>
                                        <div className="font-medium">{request.waste_bin?.name || '---'}</div>
                                        <div className="text-xs text-zinc-600">{request.waste_bin?.qr_code || '---'}</div>
                                    </div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getWasteTypeBadge(request.waste_type)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getPriorityBadge(request.priority)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getStatusBadge(request.status)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {request.collector ? (
                                        <div>
                                            <div className="font-medium">{request.collector.name}</div>
                                            <div className="text-xs text-zinc-600">{request.collector.phone_number}</div>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-400 italic">Unassigned</span>
                                    )}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {request.preferred_date 
                                        ? new Date(request.preferred_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewRequest(request);
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
                                                setEditRequest(request);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button>
                                        {(request.status === 'pending' || request.status === 'assigned') && (
                                            <button
                                                onClick={() => {
                                                    setToRouteRequest(request);
                                                    setShowToRouteModal(true);
                                                }}
                                                className="p-2 rounded hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition"
                                                title="Add to Route"
                                                aria-label="Add to Route"
                                                type="button"
                                            >
                                                <Route size={18} />
                                            </button>
                                        )}
                                        {request.status === 'assigned' && (
                                            <button
                                                onClick={() => handleStartProgress(request)}
                                                className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                                title="Start Progress"
                                                aria-label="Start Progress"
                                                type="button"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                        {request.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleComplete(request)}
                                                className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                                title="Complete"
                                                aria-label="Complete"
                                                type="button"
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setDeleteRequest(request);
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