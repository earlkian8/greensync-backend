import { useForm } from '@inertiajs/react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/Components/ui/dialog"
import { Input } from '@/Components/ui/input';
import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { useState } from 'react';

const AddCollector = ({ setShowAddModal }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const { data, setData, post, errors, processing } = useForm({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    employee_id: '',
    license_number: '',
    vehicle_plate_number: '',
    vehicle_type: '',
    profile_image: null,
    is_active: true,
    is_verified: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.collector-management.store'), {
      onSuccess: () => {
        setShowAddModal(false);
      },
      forceFormData: true,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData('profile_image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const inputClass = (error, readOnly = false) =>
    "w-full border text-sm rounded-md px-4 py-2 focus:outline-none " +
    (readOnly
      ? "bg-zinc-100 text-zinc-600 cursor-not-allowed"
      : error
      ? "border-red-500 ring-2 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-zinc-300 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800");

  const vehicleTypes = ['Truck', 'Van', 'Mini-Truck' ,'Other'];

  return (
    <Dialog open onOpenChange={setShowAddModal}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Add Collector</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Enter the details for the new collector below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Profile Image */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Profile Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-300">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif"
                onChange={handleImageChange}
                className={inputClass(errors.profile_image)}
              />
            </div>
            <InputError message={errors.profile_image} />
          </div>

          {/* Name */}
          <div>
            <Label className="text-zinc-800">Full Name </Label>
            <Input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="Juan Dela Cruz"
              className={inputClass(errors.name)}
            />
            <InputError message={errors.name} />
          </div>

          {/* Employee ID */}
          <div>
            <Label className="text-zinc-800">Employee ID </Label>
            <Input
              type="number"
              value={data.employee_id}
              onChange={e => setData('employee_id', e.target.value)}
              placeholder="12345"
              className={inputClass(errors.employee_id)}
            />
            <InputError message={errors.employee_id} />
          </div>

          {/* Email */}
          <div>
            <Label className="text-zinc-800">Email </Label>
            <Input
              type="email"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              placeholder="juan@example.com"
              className={inputClass(errors.email)}
            />
            <InputError message={errors.email} />
          </div>

          {/* Phone Number */}
          <div>
            <Label className="text-zinc-800">Phone Number </Label>
            <Input
              type="text"
              value={data.phone_number}
              onChange={e => setData('phone_number', e.target.value)}
              placeholder="+63 912 345 6789"
              className={inputClass(errors.phone_number)}
            />
            <InputError message={errors.phone_number} />
          </div>

          {/* Password */}
          <div>
            <Label className="text-zinc-800">Password </Label>
            <Input
              type="password"
              value={data.password}
              onChange={e => setData('password', e.target.value)}
              placeholder="••••••••"
              className={inputClass(errors.password)}
            />
            <InputError message={errors.password} />
          </div>

          {/* Password Confirmation */}
          <div>
            <Label className="text-zinc-800">Confirm Password </Label>
            <Input
              type="password"
              value={data.password_confirmation}
              onChange={e => setData('password_confirmation', e.target.value)}
              placeholder="••••••••"
              className={inputClass(errors.password_confirmation)}
            />
            <InputError message={errors.password_confirmation} />
          </div>

          {/* Vehicle Information Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Vehicle Information</h3>
          </div>

          {/* License Number */}
          <div>
            <Label className="text-zinc-800">License Number</Label>
            <Input
              type="text"
              value={data.license_number}
              onChange={e => setData('license_number', e.target.value)}
              placeholder="N01-12-345678"
              className={inputClass(errors.license_number)}
            />
            <InputError message={errors.license_number} />
          </div>

          {/* Vehicle Type */}
          <div>
            <Label className="text-zinc-800">Vehicle Type</Label>
            <Select 
              value={data.vehicle_type} 
              onValueChange={(value) => setData('vehicle_type', value)}
            >
              <SelectTrigger className={inputClass(errors.vehicle_type)}>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.vehicle_type} />
          </div>

          {/* Vehicle Plate Number */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Vehicle Plate Number</Label>
            <Input
              type="text"
              value={data.vehicle_plate_number}
              onChange={e => setData('vehicle_plate_number', e.target.value)}
              placeholder="ABC 1234"
              className={inputClass(errors.vehicle_plate_number)}
            />
            <InputError message={errors.vehicle_plate_number} />
          </div>

          {/* Status Switches */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <h3 className="text-lg font-semibold text-zinc-800 mb-3">Account Status</h3>
            
            {/* Is Active */}
            <div className="flex items-center gap-3 mb-3">
              <Switch
                id="is_active"
                checked={data.is_active}
                onCheckedChange={(checked) => setData('is_active', checked)}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
              />
              <Label htmlFor="is_active" className="text-zinc-800 cursor-pointer">
                {data.is_active ? 'Active' : 'Inactive'}
              </Label>
            </div>

            {/* Is Verified */}
            <div className="flex items-center gap-3">
              <Switch
                id="is_verified"
                checked={data.is_verified}
                onCheckedChange={(checked) => setData('is_verified', checked)}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
              />
              <Label htmlFor="is_verified" className="text-zinc-800 cursor-pointer">
                {data.is_verified ? 'Verified' : 'Unverified'}
              </Label>
            </div>
          </div>

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white transition"
              disabled={processing}
            >
              Add Collector
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCollector;