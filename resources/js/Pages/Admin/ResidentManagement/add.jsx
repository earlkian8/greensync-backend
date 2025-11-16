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
} from "@/components/ui/select"
import { useState } from 'react';

const AddResident = ({ setShowAddModal, barangays }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const { data, setData, post, errors, processing } = useForm({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    house_no: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    country: 'Philippines',
    postal_code: '',
    profile_image: null,
    is_verified: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.resident-management.store'), {
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

  return (
    <Dialog open onOpenChange={setShowAddModal}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Add Resident</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Enter the details for the new resident below.
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
          <div className="md:col-span-2">
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

          {/* Address Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">Address Information</h3>
          </div>

          {/* House No */}
          <div>
            <Label className="text-zinc-800">House No.</Label>
            <Input
              type="text"
              value={data.house_no}
              onChange={e => setData('house_no', e.target.value)}
              placeholder="123"
              className={inputClass(errors.house_no)}
            />
            <InputError message={errors.house_no} />
          </div>

          {/* Street */}
          <div>
            <Label className="text-zinc-800">Street</Label>
            <Input
              type="text"
              value={data.street}
              onChange={e => setData('street', e.target.value)}
              placeholder="Main Street"
              className={inputClass(errors.street)}
            />
            <InputError message={errors.street} />
          </div>

          {/* Barangay */}
          <div>
            <Label className="text-zinc-800">Barangay </Label>
            <Input
                type="text"
                value={data.barangay}
                onChange={e => setData('barangay', e.target.value)}
                placeholder="Ayala"
                className={inputClass(errors.barangay)}
            />
            <InputError message={errors.barangay} />
          </div>

          {/* City */}
          <div>
            <Label className="text-zinc-800">City </Label>
            <Input
              type="text"
              value={data.city}
              onChange={e => setData('city', e.target.value)}
              placeholder="Zamboanga City"
              className={inputClass(errors.city)}
            />
            <InputError message={errors.city} />
          </div>

          {/* Province */}
          <div>
            <Label className="text-zinc-800">Province </Label>
            <Input
              type="text"
              value={data.province}
              onChange={e => setData('province', e.target.value)}
              placeholder="Zamboanga Del Sur"
              className={inputClass(errors.province)}
            />
            <InputError message={errors.province} />
          </div>

          {/* Country */}
          <div>
            <Label className="text-zinc-800">Country </Label>
            <Input
              type="text"
              value={data.country}
              onChange={e => setData('country', e.target.value)}
              placeholder="Philippines"
              className={inputClass(errors.country)}
            />
            <InputError message={errors.country} />
          </div>

          {/* Postal Code */}
          <div>
            <Label className="text-zinc-800">Postal Code </Label>
            <Input
              type="text"
              value={data.postal_code}
              onChange={e => setData('postal_code', e.target.value)}
              placeholder="7000"
              className={inputClass(errors.postal_code)}
            />
            <InputError message={errors.postal_code} />
          </div>

          {/* Is Verified */}
          <div className="flex items-center gap-3 md:col-span-2">
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
              Add Resident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddResident;