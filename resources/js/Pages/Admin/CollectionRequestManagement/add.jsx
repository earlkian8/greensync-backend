import { useForm, usePage } from '@inertiajs/react';
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
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AddCollectionRequest = ({ setShowAddModal }) => {
  const { residents, wasteBins, collectors } = usePage().props;

  const { data, setData, post, errors, processing } = useForm({
    user_id: '',
    bin_id: '',
    request_type: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    waste_type: 'all',
    image: null,
    priority: 'medium',
    status: 'pending',
    assigned_collector_id: '',
    resolution_notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.collection-request-management.store'), {
      onSuccess: () => {
        setShowAddModal(false);
      },
      onError: () => {
        toast.error('Failed to create collection request. Please check the form.');
      },
      forceFormData: true,
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setData('image', e.target.files[0]);
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
          <DialogTitle className="text-zinc-800">Add Collection Request</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Create a new waste collection request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Resident */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Resident </Label>
            <Select 
              value={data.user_id} 
              onValueChange={(value) => setData('user_id', value)}
            >
              <SelectTrigger className={inputClass(errors.user_id)}>
                <SelectValue placeholder="Select resident" />
              </SelectTrigger>
              <SelectContent>
                {residents && residents.length > 0 ? (
                  residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id.toString()}>
                      {resident.name} - {resident.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No residents available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.user_id} />
          </div>

          {/* Waste Bin */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Waste Bin </Label>
            <Select 
              value={data.bin_id} 
              onValueChange={(value) => setData('bin_id', value)}
            >
              <SelectTrigger className={inputClass(errors.bin_id)}>
                <SelectValue placeholder="Select waste bin" />
              </SelectTrigger>
              <SelectContent>
                {wasteBins && wasteBins.length > 0 ? (
                  wasteBins.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id.toString()}>
                      {bin.name} ({bin.qr_code}) - {bin.bin_type}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No waste bins available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.bin_id} />
          </div>

          {/* Request Type */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Request Type </Label>
            <Input
              type="text"
              value={data.request_type}
              onChange={e => setData('request_type', e.target.value)}
              placeholder="e.g., Bin Full, Special Pickup, Damaged Bin"
              className={inputClass(errors.request_type)}
            />
            <InputError message={errors.request_type} />
          </div>

          {/* Waste Type */}
          <div>
            <Label className="text-zinc-800">Waste Type </Label>
            <Select 
              value={data.waste_type} 
              onValueChange={(value) => setData('waste_type', value)}
            >
              <SelectTrigger className={inputClass(errors.waste_type)}>
                <SelectValue placeholder="Select waste type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="biodegradable">Biodegradable</SelectItem>
                <SelectItem value="non-biodegradable">Non-Biodegradable</SelectItem>
                <SelectItem value="recyclable">Recyclable</SelectItem>
                <SelectItem value="special">Special</SelectItem>
                <SelectItem value="all">All Types</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.waste_type} />
          </div>

          {/* Priority */}
          <div>
            <Label className="text-zinc-800">Priority </Label>
            <Select 
              value={data.priority} 
              onValueChange={(value) => setData('priority', value)}
            >
              <SelectTrigger className={inputClass(errors.priority)}>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.priority} />
          </div>

          {/* Preferred Date */}
          <div>
            <Label className="text-zinc-800">Preferred Date</Label>
            <Input
              type="date"
              value={data.preferred_date}
              onChange={e => setData('preferred_date', e.target.value)}
              className={inputClass(errors.preferred_date)}
            />
            <InputError message={errors.preferred_date} />
          </div>

          {/* Preferred Time */}
          <div>
            <Label className="text-zinc-800">Preferred Time</Label>
            <Input
              type="time"
              value={data.preferred_time}
              onChange={e => setData('preferred_time', e.target.value)}
              className={inputClass(errors.preferred_time)}
            />
            <InputError message={errors.preferred_time} />
          </div>

          {/* Status */}
          <div>
            <Label className="text-zinc-800">Status</Label>
            <Select 
              value={data.status} 
              onValueChange={(value) => setData('status', value)}
            >
              <SelectTrigger className={inputClass(errors.status)}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.status} />
          </div>

          {/* Assigned Collector */}
          <div>
            <Label className="text-zinc-800">Assigned Collector</Label>
            <Select 
              value={data.assigned_collector_id} 
              onValueChange={(value) => setData('assigned_collector_id', value)}
            >
              <SelectTrigger className={inputClass(errors.assigned_collector_id)}>
                <SelectValue placeholder="Select collector (optional)" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="">None</SelectItem> */}
                {collectors && collectors.length > 0 ? (
                  collectors.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id.toString()}>
                      {collector.name} {collector.employee_id ? `(ID: ${collector.employee_id})` : ''} - {collector.phone_number}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No collectors available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.assigned_collector_id} />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Upload Image</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageChange}
              className={inputClass(errors.image)}
            />
            <p className="text-xs text-zinc-500 mt-1">Accepted formats: JPG, JPEG, PNG (Max: 2MB)</p>
            <InputError message={errors.image} />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Description</Label>
            <Textarea
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              placeholder="Describe the collection request..."
              className={inputClass(errors.description)}
              rows={3}
            />
            <InputError message={errors.description} />
          </div>

          {/* Resolution Notes */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Resolution Notes</Label>
            <Textarea
              value={data.resolution_notes}
              onChange={e => setData('resolution_notes', e.target.value)}
              placeholder="Notes about resolution or actions taken..."
              className={inputClass(errors.resolution_notes)}
              rows={2}
            />
            <InputError message={errors.resolution_notes} />
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
              Add Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCollectionRequest;