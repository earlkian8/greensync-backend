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
import { useEffect } from 'react';

const EditWasteBin = ({ wasteBin, setShowEditModal, residents }) => {
  const { data, setData, put, errors, processing } = useForm({
    name: wasteBin?.name || '',
    resident_id: wasteBin?.resident_id?.toString() || '',
    bin_type: wasteBin?.bin_type || 'biodegradable',
    status: wasteBin?.status || 'active',
  });

  useEffect(() => {
    if (wasteBin) {
      setData({
        name: wasteBin.name || '',
        resident_id: wasteBin.resident_id?.toString() || '',
        bin_type: wasteBin.bin_type || 'biodegradable',
        status: wasteBin.status || 'active',
      });
    }
  }, [wasteBin]);

  const handleSubmit = (e) => {
    e.preventDefault();

    put(route('admin.waste-bin-management.update', wasteBin.id), {
      onSuccess: () => {
        setShowEditModal(false);
        toast.success('Waste Bin Updated Successfully!');
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
    <Dialog open onOpenChange={setShowEditModal}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Edit Waste Bin</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Update the details for the waste bin below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

          {/* QR Code (Read-only) */}
          <div>
            <Label className="text-zinc-800">QR Code</Label>
            <Input
              type="text"
              value={wasteBin.qr_code}
              className={inputClass(false, true)}
              readOnly
            />
            <p className="text-xs text-zinc-500 mt-1">QR code cannot be changed</p>
          </div>

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

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white transition"
              disabled={processing}
            >
              Update Waste Bin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWasteBin;