import { useForm, usePage, router } from '@inertiajs/react';
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
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { useEffect } from 'react';

const EditRoute = ({ route: routeData, setShowEditModal }) => {
  const { data, setData, post, errors, processing } = useForm({
    route_name: routeData?.route_name || '',
    barangay: routeData?.barangay || '',
    estimated_duration: routeData?.estimated_duration || '',
    route_map_data: routeData?.route_map_data || '',
    is_active: routeData?.is_active ?? true,
    _method: 'PUT'
  });

  useEffect(() => {
    if (routeData) {
      setData({
        route_name: routeData.route_name || '',
        barangay: routeData.barangay || '',
        estimated_duration: routeData.estimated_duration || '',
        route_map_data: routeData.route_map_data || '',
        is_active: routeData.is_active ?? true,
        _method: 'PUT'
      });
    }
  }, [routeData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    router.post(route('admin.route-management.update', routeData.id), data, {
      onSuccess: () => {
        setShowEditModal(false);
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
      <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Edit Route</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Update the details for the route below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Route Name */}
          <div>
            <Label className="text-zinc-800">Route Name </Label>
            <Input
              type="text"
              value={data.route_name}
              onChange={e => setData('route_name', e.target.value)}
              placeholder="Route A - Downtown"
              className={inputClass(errors.route_name)}
            />
            <InputError message={errors.route_name} />
          </div>

          {/* Barangay */}
          <div>
            <Label className="text-zinc-800">Barangay </Label>
            <Input
              type="text"
              value={data.barangay}
              onChange={e => setData('barangay', e.target.value)}
              placeholder="Barangay Ayala"
              className={inputClass(errors.barangay)}
            />
            <InputError message={errors.barangay} />
          </div>

          {/* Estimated Duration */}
          <div>
            <Label className="text-zinc-800">Estimated Duration (minutes)</Label>
            <Input
              type="number"
              value={data.estimated_duration}
              onChange={e => setData('estimated_duration', e.target.value)}
              placeholder="120"
              min="1"
              className={inputClass(errors.estimated_duration)}
            />
            <InputError message={errors.estimated_duration} />
          </div>


          {/* Route Map Data */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Route Map Data (JSON)</Label>
            <Textarea
              value={data.route_map_data}
              onChange={e => setData('route_map_data', e.target.value)}
              placeholder='{"coordinates": [], "polyline": ""}'
              className={inputClass(errors.route_map_data)}
              rows={3}
            />
            <InputError message={errors.route_map_data} />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3 md:col-span-2">
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

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4 md:col-span-2">
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
              Update Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoute;