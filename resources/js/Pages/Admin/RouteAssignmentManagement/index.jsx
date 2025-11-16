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
import { Trash2, SquarePen, Eye, Filter, Play, CheckCircle2, XCircle } from 'lucide-react';
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

import AddRouteAssignment from './add';
import EditRouteAssignment from './edit';
import DeleteRouteAssignment from './delete';
import ShowRouteAssignment from './show';

export default function RouteAssignmentManagement() {
    const columns = [
        { header: 'Assignment Date', width: '12%' },
        { header: 'Route', width: '18%' },
        { header: 'Collector', width: '15%' },
        { header: 'Schedule', width: '15%' },
        { header: 'Status', width: '12%' },
        { header: 'Start Time', width: '10%' },
        { header: 'End Time', width: '10%' },
        { header: 'Action', width: '12%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAssignment, setEditAssignment] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteAssignment, setDeleteAssignment] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewAssignment, setViewAssignment] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.assignments;
    const assignmentData = usePage().props.assignments.data;
    const routes = usePage().props.routes || [];
    const collectors = usePage().props.collectors || [];
    const schedules = usePage().props.schedules || [];

    const [search, setSearch] = useState(usePage().props.search || '');
    const [statusFilter, setStatusFilter] = useState(usePage().props.statusFilter || '');
    const [dateFilter, setDateFilter] = useState(usePage().props.dateFilter || '');
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.route-assignment-management.index'), 
            { 
                search: e.target.value,
                status: statusFilter,
                date: dateFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'date') {
            setDateFilter(value);
        }

        router.get(
            route('admin.route-assignment-management.index'),
            {
                search,
                status: type === 'status' ? value : statusFilter,
                date: type === 'date' ? value : dateFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setDateFilter('');
        
        router.get(
            route('admin.route-assignment-management.index'),
            {
                search,
                status: '',
                date: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.route-assignment-management.index'), 
            { 
                search, 
                page,
                status: statusFilter,
                date: dateFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleStartAssignment = (assignment) => {
        router.post(
            route('admin.route-assignment-management.start', assignment.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
            }
        );
    };

    const handleCompleteAssignment = (assignment) => {
        router.post(
            route('admin.route-assignment-management.complete', assignment.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
            }
        );
    };

    const handleCancelAssignment = (assignment) => {
        router.post(
            route('admin.route-assignment-management.cancel', assignment.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
            }
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pending',
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

    const formatScheduleDisplay = (schedule) => {
        if (!schedule) return '---';
        return `${schedule.barangay} - ${schedule.collection_day}`;
    };

    const hasActiveFilters = statusFilter || dateFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Route Assignment",
        },
    ];

    const statuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <>
        {showAddModal && (
            <AddRouteAssignment 
                setShowAddModal={setShowAddModal}
            />
        )}

        {showEditModal && (
            <EditRouteAssignment 
                setShowEditModal={setShowEditModal} 
                assignment={editAssignment}
            />
        )}
        
        {showDeleteModal && (
            <DeleteRouteAssignment 
                setShowDeleteModal={setShowDeleteModal} 
                assignment={deleteAssignment}
            />
        )}

        {showViewModal && (
            <ShowRouteAssignment 
                setShowViewModal={setShowViewModal} 
                assignment={viewAssignment}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Route Assignment Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search assignments..."
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
                                                    {[statusFilter, dateFilter].filter(Boolean).length}
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

                                            {/* Date Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Assignment Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={dateFilter}
                                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Add Assignment Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Assignment
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={assignmentData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {assignmentData.map(assignment => (
                            <TableRow key={assignment.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(assignment.assignment_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div>
                                        <div className="font-medium">{assignment.route?.route_name || '---'}</div>
                                        <div className="text-xs text-zinc-600">{assignment.route?.barangay || '---'}</div>
                                    </div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div>
                                        <div className="font-medium">{assignment.collector?.name || '---'}</div>
                                        <div className="text-xs text-zinc-600">{assignment.collector?.phone_number || '---'}</div>
                                    </div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {formatScheduleDisplay(assignment.schedule)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getStatusBadge(assignment.status)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {assignment.start_time 
                                        ? new Date(assignment.start_time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {assignment.end_time 
                                        ? new Date(assignment.end_time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewAssignment(assignment);
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
                                                setEditAssignment(assignment);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button>
                                        {assignment.status === 'pending' && (
                                            <button
                                                onClick={() => handleStartAssignment(assignment)}
                                                className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                                title="Start"
                                                aria-label="Start"
                                                type="button"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                        {assignment.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleCompleteAssignment(assignment)}
                                                className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                                title="Complete"
                                                aria-label="Complete"
                                                type="button"
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                        )}
                                        {(assignment.status === 'pending' || assignment.status === 'in_progress') && (
                                            <button
                                                onClick={() => handleCancelAssignment(assignment)}
                                                className="p-2 rounded hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition"
                                                title="Cancel"
                                                aria-label="Cancel"
                                                type="button"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setDeleteAssignment(assignment);
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