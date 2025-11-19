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
  IdCard,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  User,
  Activity
} from 'lucide-react';

const ShowCollector = ({ setShowViewModal, collector }) => {
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
              <DialogTitle className="text-zinc-800">Collector Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this collector
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
                {collector.profile_image ? (
                  <img 
                    src={`/storage/${collector.profile_image}`} 
                    alt={collector.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-zinc-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 text-center">{collector.name}</h2>
              <p className="text-sm text-zinc-600 text-center mt-1">Employee ID: #{collector.employee_id}</p>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    collector.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {collector.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Verification:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    collector.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {collector.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Member Since:</span>
                  <span className="text-sm text-zinc-900">
                    {new Date(collector.created_at).toLocaleDateString('en-US', {
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
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Contact & Vehicle Information</h3>
            
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Contact Details</h4>
              <InfoRow 
                icon={Mail} 
                label="Email Address" 
                value={collector.email} 
              />
              <InfoRow 
                icon={Phone} 
                label="Phone Number" 
                value={collector.phone_number} 
              />
              <InfoRow 
                icon={IdCard} 
                label="Employee ID" 
                value={`#${collector.employee_id}`} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Vehicle & License Details</h4>
              <InfoRow 
                icon={CreditCard} 
                label="License Number" 
                value={collector.license_number} 
              />
              <InfoRow 
                icon={Truck} 
                label="Vehicle Type" 
                value={collector.vehicle_type} 
              />
              <InfoRow 
                icon={Truck} 
                label="Vehicle Plate Number" 
                value={collector.vehicle_plate_number} 
              />
            </div>

            {collector.vehicle_type && collector.vehicle_plate_number && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-700 mb-2">Vehicle Summary</h4>
                  <div className="bg-zinc-50 p-4 rounded-md">
                    <div className="flex items-center gap-3">
                      <Truck className="h-8 w-8 text-zinc-600" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {collector.vehicle_type}
                        </p>
                        <p className="text-sm text-zinc-600">
                          Plate: {collector.vehicle_plate_number}
                        </p>
                        {collector.license_number && (
                          <p className="text-xs text-zinc-500">
                            License: {collector.license_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Associated Records */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Work Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">Route Assignments</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {collector.route_assignments?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">Collection Requests</p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {collector.collection_requests?.length || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <p className="text-sm text-purple-600 font-medium">QR Collections</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {collector.qr_collections?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowCollector;