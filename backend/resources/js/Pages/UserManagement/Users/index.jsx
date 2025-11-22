import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import TableComponent from '@/Components/AdminLayout/table';
import {
  TableRow,
  TableCell
} from "@/Components/ui/table";
import { toast } from 'sonner';
import { Trash2, SquarePen, UnlockIcon } from 'lucide-react';

import AddUser from './add';
import EditUser from './edit';
import DeleteUser from './delete';
import ResetPassword from './reset';

export default function Users() {
    const columns = [
        { header: 'Name', width: '25%' },
        { header: 'Email', width: '30%' },
        { header: 'Created At', width: '20%' },
        { header: 'Updated At', width: '20%' },
        { header: 'Action', width: '10%' },
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUser, setEditUser] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUser, setResetUser] = useState(null);

    const pagination = usePage().props.users;
    const userData = usePage().props.users.data;
    const [search, setSearch] = useState(usePage().props.search || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get('/user-management/users', { search: e.target.value }, { preserveState: true, replace: true });
    };

    const handlePageChange = ({ search, page }) => {
        router.get('/user-management/users', { search, page }, { preserveState: true, replace: true });
    };

    const breadcrumbs = [
        {
            name: "User Management",
            href: '/user-management/users'
        },
        {
            name: "Users",
        },
    ];

    return (
        <>
        {showAddModal && (
            <AddUser setShowAddModal={setShowAddModal} />
        )}

        {showEditModal && (
            <EditUser setShowEditModal={setShowEditModal} user={editUser} />
        )}
        
        {showDeleteModal && (
            <DeleteUser setShowDeleteModal={setShowDeleteModal} user={deleteUser}/>
        )}

        {showResetModal && (
            <ResetPassword setShowResetModal={setShowResetModal} user={resetUser}/>
        )}

        <AuthenticatedLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div>
                <div className="w-full sm:px-6 lg:px-8">
                    <TableComponent
                        columns={columns}
                        addButtonText='Add User'
                        onAdd={() => {
                            setShowAddModal(true);
                        }}
                        data={userData}
                        pagination={pagination}
                        search={search}
                        onSearch={handleSearch}
                        onPageChange={handlePageChange}
                    >
                        {userData.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {user.name}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {user.email}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(user.created_at).toLocaleString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    }).replace(' at ', ' at ')}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    {new Date(user.updated_at).toLocaleString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    }).replace(' at ', ' at ')}
                                </TableCell>
                                <TableCell className='text-left px-2 py-2 sm:px-4 md:px-6 text-xs sm:text-sm'>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditUser(user);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                            title="Edit"
                                            aria-label="Edit"
                                            type="button"
                                        >
                                            <SquarePen size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResetUser(user);
                                                setShowResetModal(true);
                                            }}
                                            className="p-2 rounded hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition"
                                            title="Reset Password"
                                            aria-label="Reset Password"
                                            type="button"
                                        >
                                            <UnlockIcon size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteUser(user);
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