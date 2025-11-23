import { Link, usePage } from '@inertiajs/react';
import { Toaster } from '@/Components/ui/sonner';
import Logo from '../../assets/logo/whitebg.png';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white pt-6 sm:pt-0">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center">
                    <img 
                        src={Logo} 
                        alt="GreenSync Logo" 
                        className="h-56 w-auto object-contain"
                    />
                    <p className="mt-4 text-lg font-semibold text-gray-700">
                        Admin Portal
                    </p>
                </div>

                <div className="w-full overflow-hidden bg-white px-8 py-8 shadow-xl sm:rounded-2xl">
                    {children}
                    <Toaster position="top-right"/>
                </div>
            </div>
        </div>
    );
}
