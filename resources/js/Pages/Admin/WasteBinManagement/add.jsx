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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AddWasteBin = ({ setShowAddModal, residents }) => {
  const { data, setData, post, errors, processing } = useForm({
    name: '',
    resident_id: '',
    bin_type: 'biodegradable',
    status: 'active',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.waste-bin-management.store'), {
      onSuccess: () => {
        setShowAddModal(false);
        toast.success('Waste Bin Created Successfully!');
      },
    });
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
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Add Waste Bin</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Enter the details for the new waste bin below. A QR code will be automatically generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

          {/* Bin Name */}
          <div>
            <Label className="text-zinc-800">Bin Name </Label>
            <Input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="Kitchen Bin"
              className={inputClass(errors.name)}
            />
            <InputError message={errors.name} />
          </div>

          {/* Resident */}
          <div>
            <Label className="text-zinc-800">Resident </Label>
            <Select 
              value={data.resident_id} 
              onValueChange={(value) => setData('resident_id', value)}
            >
              <SelectTrigger className={inputClass(errors.resident_id)}>
                <SelectValue placeholder="Select Resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id.toString()}>
                    {resident.name} - {resident.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.resident_id} />
          </div>

          {/* Bin Type */}
          <div>
            <Label className="text-zinc-800">Bin Type </Label>
            <Select 
              value={data.bin_type} 
              onValueChange={(value) => setData('bin_type', value)}
            >
              <SelectTrigger className={inputClass(errors.bin_type)}>
                <SelectValue placeholder="Select Bin Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="biodegradable">Biodegradable</SelectItem>
                <SelectItem value="non-biodegradable">Non-Biodegradable</SelectItem>
                <SelectItem value="recyclable">Recyclable</SelectItem>
                <SelectItem value="hazardous">Hazardous</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.bin_type} />
          </div>

          {/* Status */}
          <div>
            <Label className="text-zinc-800">Status </Label>
            <Select 
              value={data.status} 
              onValueChange={(value) => setData('status', value)}
            >
              <SelectTrigger className={inputClass(errors.status)}>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.status} />
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> A unique QR code will be automatically generated for this waste bin upon creation.
            </p>
          </div>

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
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
              Add Waste Bin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWasteBin;