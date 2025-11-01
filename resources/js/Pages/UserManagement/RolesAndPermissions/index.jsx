import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import TableComponent from '@/Components/AdminLayout/table';
import {
  TableRow,
  TableCell
} from "@/components/ui/table";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import AddRole from './add';
import DeleteRole from './delete';

export default function Roles() {
    const columns = [
        { header: 'Name', width: '30%' },
        { header: 'User Count', width: '20%' },
        { header: 'Created At', width: '20%' },
        { header: 'Updated At', width: '20%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRole, setDeleteRole] = useState(null);

    const pagination = usePage().props.roles;
    const roleData = usePage().props.roles.data;
    const [search, setSearch] = useState(usePage().props.search || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route('user-management.roles-and-permissions.index'), { search: e.target.value }, { preserveState: true, replace: true });
    };

    const handlePageChange = ({ search, page }) => {
        router.get(route('user-management.roles-and-permissions.index'), { search, page }, { preserveState: true, replace: true });
    };

    const breadcrumbs = [
        {
            name: "User Management",
            href: route('user-management.roles-and-permissions.index')
        },
        {
            name: "Roles & Permissions",
        },
    ];

    return (
        <>
        {showAddModal && (
            <AddRole setShowAddModal={setShowAddModal}/>
        )}
        
        {showDeleteModal && (
            <DeleteRole setShowDeleteModal={setShowDeleteModal} role={deleteRole}/>
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    <TableComponent
                        columns={columns}
                        addButtonText='Add Role'
                        onAdd={() => {
                            setShowAddModal(true);
                        }}
                        data={roleData}
                        pagination={pagination}
                        search={search}
                        onSearch={handleSearch}
                        onPageChange={handlePageChange}
                    >
                        {roleData.map(role => (
                            <TableRow key={role.id}>
                                {/* Role Name */}
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {role.name}
                                </TableCell>

                                {/* User Count */}
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {role.users_count}
                                </TableCell>

                                {/* Created At */}
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(role.created_at).toLocaleString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </TableCell>

                                {/* Updated At */}
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(role.updated_at).toLocaleString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </TableCell>

                                {/* Actions */}
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setDeleteRole(role);
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
