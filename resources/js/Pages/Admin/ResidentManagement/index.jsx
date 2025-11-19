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
import { Trash2, SquarePen, Eye, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/Components/ui/button';

import AddResident from './add';
import EditResident from './edit';
import DeleteResident from './delete';
import ShowResident from './show';

export default function ResidentManagement() {
    const columns = [
        { header: 'Name', width: '20%' },
        { header: 'Email', width: '18%' },
        { header: 'Phone', width: '12%' },
        { header: 'Barangay', width: '15%' },
        { header: 'Address', width: '20%' },
        { header: 'Status', width: '10%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editResident, setEditResident] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteResident, setDeleteResident] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewResident, setViewResident] = useState(null);

    const pagination = usePage().props.residents;
    const residentData = usePage().props.residents.data;
    const barangays = usePage().props.barangays;

    const [search, setSearch] = useState(usePage().props.search || '');
    const [verificationFilter, setVerificationFilter] = useState(usePage().props.verificationFilter || '');
    const [barangayFilter, setBarangayFilter] = useState(usePage().props.barangayFilter || '');

    // Selected residents for bulk delete
    const [selectedResidents, setSelectedResidents] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('admin.resident-management.index'), 
            { 
                search: e.target.value,
                verification: verificationFilter,
                barangay: barangayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (type, value) => {
        if (type === 'verification') {
            setVerificationFilter(value);
        } else if (type === 'barangay') {
            setBarangayFilter(value);
        }

        router.get(
            route('admin.resident-management.index'),
            {
                search,
                verification: type === 'verification' ? value : verificationFilter,
                barangay: type === 'barangay' ? value : barangayFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePageChange = ({ search, page }) => {
        router.get(
            route('admin.resident-management.index'), 
            { 
                search, 
                page,
                verification: verificationFilter,
                barangay: barangayFilter
            }, 
            { preserveState: true, replace: true }
        );
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedResidents([]);
            setIsAllSelected(false);
        } else {
            setSelectedResidents(residentData.map(r => r.id));
            setIsAllSelected(true);
        }
    };

    const handleSelectResident = (id) => {
        if (selectedResidents.includes(id)) {
            const newSelected = selectedResidents.filter(residentId => residentId !== id);
            setSelectedResidents(newSelected);
            setIsAllSelected(false);
        } else {
            const newSelected = [...selectedResidents, id];
            setSelectedResidents(newSelected);
            if (newSelected.length === residentData.length) {
                setIsAllSelected(true);
            }
        }
    };


    const breadcrumbs = [
        {
            name: "Home",
            href: route('dashboard'),
        },
        {
            name: "Resident Management",
        },
    ];

    return (
        <>
        {showAddModal && (
            <AddResident setShowAddModal={setShowAddModal} barangays={barangays} />
        )}

        {showEditModal && (
            <EditResident 
                setShowEditModal={setShowEditModal} 
                resident={editResident}
                barangays={barangays}
            />
        )}
        
        {showDeleteModal && (
            <DeleteResident 
                setShowDeleteModal={setShowDeleteModal} 
                resident={deleteResident}
            />
        )}

        {showViewModal && (
            <ShowResident 
                setShowViewModal={setShowViewModal} 
                resident={viewResident}
            />
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Resident Management" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    {/* Custom header with search, filters, and add button */}
                    <div className="p-2 bg-white rounded-md shadow mb-2">
                        <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Search Input */}
                            <div className="w-full sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={search}
                                    onChange={handleSearch}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                />
                            </div>

                            {/* Verification Filter */}
                            <div className="w-full sm:w-auto">
                                <Select 
                                    value={verificationFilter} 
                                    onValueChange={(value) => handleFilterChange('verification', value)}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Status</SelectItem>
                                        <SelectItem value="verified">Verified</SelectItem>
                                        <SelectItem value="unverified">Unverified</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add Resident Button */}
                            {/* <div className="w-full sm:w-auto">
                                <Button 
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" 
                                    onClick={() => setShowAddModal(true)}
                                >
                                    Add Resident
                                </Button>
                            </div> */}
                        </div>
                    </div>

                    {/* Table without search and add button */}
                    <TableComponent
                        columns={columns}
                        data={residentData}
                        pagination={pagination}
                        search={search}
                        onPageChange={handlePageChange}
                        showSearch={false}
                        showAddButton={false}
                    >
                        {residentData.map(resident => (
                            <TableRow key={resident.id}>
                                
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {resident.name}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {resident.email}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {resident.phone_number}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {resident.barangay}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {[resident.house_no, resident.street, resident.city].filter(Boolean).join(', ') || '---'}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        resident.is_verified 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {resident.is_verified ? 'Verified' : 'Unverified'}
                                    </span>
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setViewResident(resident);
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
                                            onClick={() => {
                                                setEditResident(resident);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button> */}
                                        <button
                                            onClick={() => {
                                                setDeleteResident(resident);
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