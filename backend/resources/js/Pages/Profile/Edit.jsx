import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Profile Settings
                        </h2>
                        <p className="text-sm text-gray-500">
                            Manage your account information and preferences
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-lg sm:rounded-xl">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white">
                                Profile Information
                            </h3>
                        </div>
                        <div className="p-6">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-2xl"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-lg sm:rounded-xl">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white">
                                Update Password
                            </h3>
                        </div>
                        <div className="p-6">
                            <UpdatePasswordForm className="max-w-2xl" />
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-lg sm:rounded-xl">
                        <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white">
                                Delete Account
                            </h3>
                        </div>
                        <div className="p-6">
                            <DeleteUserForm className="max-w-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
