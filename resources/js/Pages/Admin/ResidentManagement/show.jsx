import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from '@/Components/ui/separator';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';

const ShowResident = ({ setShowViewModal, resident }) => {
  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className="text-sm text-zinc-900">{value || '---'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Resident Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this resident
              </DialogDescription>
            </div>
            
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Profile Section */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Profile</h3>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-200 mb-4">
                {resident.profile_image ? (
                  <img 
                    src={`/storage/${resident.profile_image}`} 
                    alt={resident.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-zinc-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 text-center">{resident.name}</h2>
              <p className="text-sm text-zinc-600 text-center mt-1">{resident.email}</p>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    resident.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {resident.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Member Since:</span>
                  <span className="text-sm text-zinc-900">
                    {new Date(resident.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Contact & Address Information</h3>
            
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Contact Details</h4>
              <InfoRow 
                icon={Mail} 
                label="Email Address" 
                value={resident.email} 
              />
              <InfoRow 
                icon={Phone} 
                label="Phone Number" 
                value={resident.phone_number} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Address Details</h4>
              <InfoRow 
                icon={Home} 
                label="House No." 
                value={resident.house_no} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Street" 
                value={resident.street} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Barangay" 
                value={resident.barangay} 
              />
              <InfoRow 
                icon={MapPin} 
                label="City" 
                value={resident.city} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Province" 
                value={resident.province} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Country" 
                value={resident.country} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Postal Code" 
                value={resident.postal_code} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Full Address</h4>
              <div className="bg-zinc-50 p-4 rounded-md">
                <p className="text-sm text-zinc-900">
                  {[
                    resident.house_no,
                    resident.street,
                    resident.barangay,
                    resident.city,
                    resident.province,
                    resident.country,
                    resident.postal_code
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Records */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Associated Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Waste Bins</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {resident.waste_bins?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Collection Requests</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {resident.collection_requests?.length || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Verified Collections</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {resident.verified_collections?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowResident;