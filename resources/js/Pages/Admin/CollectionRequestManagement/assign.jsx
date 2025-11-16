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

const AssignCollectorModal = ({ setShowAssignModal, request, collectors }) => {
  const { data, setData, post, errors, processing } = useForm({
    assigned_collector_id: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.collection-request-management.assign', request.id), {
      onSuccess: () => {
        setShowAssignModal(false);
      },
      onError: () => {
        toast.error('Failed to assign collector. Please try again.');
      },
    });
  };

  const inputClass = (error) =>
    "w-full border text-sm rounded-md px-4 py-2 focus:outline-none " +
    (error
      ? "border-red-500 ring-2 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-zinc-300 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800");

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open onOpenChange={setShowAssignModal}>
      <DialogContent className="w-[95vw] max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Assign Collector</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Assign a collector to this collection request.
          </DialogDescription>
        </DialogHeader>

        {/* Request Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-blue-900">Request Type:</span>
            <span className="text-sm text-blue-800 font-semibold">{request.request_type}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-blue-900">Resident:</span>
            <span className="text-sm text-blue-800 text-right">
              {request.resident?.name || '---'}
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-blue-900">Waste Bin:</span>
            <span className="text-sm text-blue-800 text-right">
              {request.waste_bin?.name || '---'} ({request.waste_bin?.qr_code || '---'})
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-blue-900">Preferred Date:</span>
            <span className="text-sm text-blue-800">{formatDate(request.preferred_date)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collector Selection */}
          <div>
            <Label className="text-zinc-800">
              Select Collector <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={data.assigned_collector_id} 
              onValueChange={(value) => setData('assigned_collector_id', value)}
            >
              <SelectTrigger className={inputClass(errors.assigned_collector_id)}>
                <SelectValue placeholder="Choose a collector" />
              </SelectTrigger>
              <SelectContent>
                {collectors && collectors.length > 0 ? (
                  collectors.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {collector.name} 
                          {collector.employee_id && (
                            <span className="text-xs text-zinc-600 ml-1">(ID: {collector.employee_id})</span>
                          )}
                        </span>
                        <span className="text-xs text-zinc-500">{collector.phone_number}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No collectors available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.assigned_collector_id} />
            <p className="text-xs text-zinc-500 mt-1">
              Only active and verified collectors are shown
            </p>
          </div>

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white transition"
              disabled={processing}
            >
              Assign Collector
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCollectorModal;