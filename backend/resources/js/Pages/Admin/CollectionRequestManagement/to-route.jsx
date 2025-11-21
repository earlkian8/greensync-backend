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
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import InputError from '@/Components/InputError';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { router } from '@inertiajs/react';

const ToRouteModal = ({ request, setShowToRouteModal }) => {
  const { routes } = usePage().props;
  
  // Ensure we have valid request data
  if (!request || !request.id) {
    return null;
  }

  const { data, setData, post, errors, processing } = useForm({
    route_id: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate request ID
    if (!request.id) {
      toast.error('Invalid request. Please refresh and try again.');
      return;
    }

    if (!request.latitude || !request.longitude) {
      toast.error('Collection request must have latitude and longitude coordinates');
      return;
    }

    // Log for debugging
    console.log('Adding request to route:', {
      requestId: request.id,
      binId: request.bin_id,
      binName: request.waste_bin?.name,
      requestType: request.request_type,
      routeId: data.route_id,
    });

    post(route('admin.collection-request-management.to-route', request.id), {
      preserveScroll: true,
      onSuccess: () => {
        setShowToRouteModal(false);
        toast.success('Collection request added to route successfully');
      },
      onError: (errors) => {
        console.error('To-route errors:', errors);
        toast.error('Failed to add collection request to route');
      },
    });
  };

  const inputClass = (error) =>
    "w-full border text-sm rounded-md px-4 py-2 focus:outline-none " +
    (error
      ? "border-red-500 ring-2 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-zinc-300 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800");

  return (
    <Dialog open onOpenChange={setShowToRouteModal}>
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Add Request to Route</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Select a route to add this collection request. A route stop will be automatically created.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Route Selection */}
          <div>
            <Label className="text-zinc-800">Route </Label>
            <Select 
              value={data.route_id} 
              onValueChange={(value) => setData('route_id', value)}
            >
              <SelectTrigger className={inputClass(errors.route_id)}>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {routes && routes.length > 0 ? (
                  routes.map((route) => (
                    <SelectItem key={route.id} value={route.id.toString()}>
                      {route.route_name} - {route.barangay}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No active routes available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.route_id} />
          </div>

          {/* Info Message */}
          {(!request.latitude || !request.longitude) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                <strong>Warning:</strong> This request does not have latitude and longitude coordinates. 
                Please add coordinates in the edit form before adding to a route.
              </p>
            </div>
          )}

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowToRouteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white transition"
              disabled={processing || !request.latitude || !request.longitude}
            >
              Add to Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ToRouteModal;

