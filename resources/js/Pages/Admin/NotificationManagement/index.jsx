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
import { Trash2, SquarePen, Eye, Bell, BellOff, Filter } from 'lucide-react';
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

import AddNotification from './add';
import EditNotification from './edit';
import DeleteNotification from './delete';
import ShowNotification from './show';

export default function NotificationManagement() {
    const columns = [
        { header: 'Title', width: '20%' },
        { header: 'Recipient', width: '15%' },
        { header: 'Type', width: '12%' },
        { header: 'Priority', width: '10%' },
        { header: 'Message', width: '25%' },
        { header: 'Status', width: '8%' },
        { header: 'Date', width: '10%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editNotification, setEditNotification] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteNotification, setDeleteNotification] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewNotification, setViewNotification] = useState(null);

    const [showFilterPopover, setShowFilterPopover] = useState(false);

    const pagination = usePage().props.notifications;
    const notificationData = usePage().props.notifications.data;
    const users = usePage().props.users;

    const [search, setSearch] = useState(usePage().props.search || '');
    const [typeFilter, setTypeFilter] = useState(usePage().props.typeFilter || '');
    const [priorityFilter, setPriorityFilter] = useState(usePage().props.priorityFilter || '');
    const [recipientTypeFilter, setRecipientTypeFilter] = useState(usePage().props.recipientTypeFilter || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.notification-management.index'), 
            { 
                search: e.target.value,
                type: typeFilter,
                priority: priorityFilter,
                recipient_type: recipientTypeFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'type') {
            setTypeFilter(value);
        } else if (type === 'priority') {
            setPriorityFilter(value);
        } else if (type === 'recipient_type') {
            setRecipientTypeFilter(value);
        }

        router.get(
            route('admin.notification-management.index'),
            {
                search,
                type: type === 'type' ? value : typeFilter,
                priority: type === 'priority' ? value : priorityFilter,
                recipient_type: type === 'recipient_type' ? value : recipientTypeFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setTypeFilter('');
        setPriorityFilter('');
        setRecipientTypeFilter('');
        
        router.get(
            route('admin.notification-management.index'),
            {
                search,
                type: '',
                priority: '',
                recipient_type: '',
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.notification-management.index'), 
            { 
                search, 
                page,
                type: typeFilter,
                priority: priorityFilter,
                recipient_type: recipientTypeFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleMarkAsRead = (notification) => {
        router.post(
            route('admin.notification-management.mark-read', notification.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
            }
        );
    };

    const handleMarkAsUnread = (notification) => {
        router.post(
            route('admin.notification-management.mark-unread', notification.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    
                },
            }
        );
    };

    const getRecipientDisplay = (notification) => {
        if (notification.recipient_type === 'all_residents') {
            return 'All Residents';
        } else if (notification.recipient_type === 'all_collectors') {
            return 'All Collectors';
        } else if (notification.recipient_type === 'specific' && notification.recipient) {
            return notification.recipient.name;
        } else {
            return notification.recipient_type;
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getTypeColor = (type) => {
        const colors = {
            schedule: 'bg-purple-100 text-purple-800',
            alert: 'bg-red-100 text-red-800',
            announcement: 'bg-blue-100 text-blue-800',
            request_update: 'bg-green-100 text-green-800',
            route_assignment: 'bg-indigo-100 text-indigo-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const hasActiveFilters = typeFilter || priorityFilter || recipientTypeFilter;

    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Notification Management",
        },
    ];

    const notificationTypes = [
        { value: 'schedule', label: 'Schedule' },
        { value: 'alert', label: 'Alert' },
        { value: 'announcement', label: 'Announcement' },
        { value: 'request_update', label: 'Request Update' },
        { value: 'route_assignment', label: 'Route Assignment' },
    ];

    const priorities = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];

    const recipientTypes = [
        { value: 'resident', label: 'Resident' },
        { value: 'collector', label: 'Collector' },
        { value: 'all_residents', label: 'All Residents' },
        { value: 'all_collectors', label: 'All Collectors' },
        { value: 'specific', label: 'Specific' },
    ];

    return (
        <>
        {showAddModal && (
            <AddNotification setShowAddModal={setShowAddModal} users={users} />
        )}

        {showEditModal && (
            <EditNotification 
                setShowEditModal={setShowEditModal} 
                notification={editNotification}
                users={users}
            />
        )}
        
        {showDeleteModal && (
            <DeleteNotification 
                setShowDeleteModal={setShowDeleteModal} 
                notification={deleteNotification}
            />
        )}

        {showViewModal && (
            <ShowNotification 
                setShowViewModal={setShowViewModal} 
                notification={viewNotification}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
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
                                                    {[typeFilter, priorityFilter, recipientTypeFilter].filter(Boolean).length}
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

                                            {/* Type Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Notification Type
                                                </label>
                                                <Select 
                                                    value={typeFilter} 
                                                    onValueChange={(value) => handleFilterChange('type', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Types" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Types</SelectItem>
                                                        {notificationTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
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

                                            {/* Recipient Type Filter */}
                                            <div>
                                                <label className="text-xs font-medium text-zinc-700 mb-1 block">
                                                    Recipient Type
                                                </label>
                                                <Select 
                                                    value={recipientTypeFilter} 
                                                    onValueChange={(value) => handleFilterChange('recipient_type', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Recipients" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Recipients</SelectItem>
                                                        {recipientTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Add Notification Button */}
                            <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Notification
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={notificationData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {notificationData.map(notification => (
                            <TableRow key={notification.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="font-medium">{notification.title}</div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {getRecipientDisplay(notification)}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.notification_type)}`}>
                                        {notification.notification_type.replace('_', ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                                        {notification.priority}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="truncate max-w-xs">
                                        {notification.message}
                                    </div>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        notification.is_read 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {notification.is_read ? 'Read' : 'Unread'}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewNotification(notification);
                                                setShowViewModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                            title="View"
                                            aria-label="View"
                                            type="button"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {notification.is_read ? (
                                            <button
                                                onClick={() => handleMarkAsUnread(notification)}
                                                className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-700 transition"
                                                title="Mark as Unread"
                                                aria-label="Mark as Unread"
                                                type="button"
                                            >
                                                <BellOff size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleMarkAsRead(notification)}
                                                className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                                title="Mark as Read"
                                                aria-label="Mark as Read"
                                                type="button"
                                            >
                                                <Bell size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditNotification(notification);
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
                                                setDeleteNotification(notification);
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