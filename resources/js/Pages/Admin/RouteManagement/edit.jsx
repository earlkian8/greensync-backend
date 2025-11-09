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
} from "@/components/ui/select"
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const EditRoute = ({ route: routeData, setShowEditModal }) => {
  const { residents } = usePage().props;
  const [stops, setStops] = useState(routeData?.stops || []);

  const { data, setData, post, errors, processing } = useForm({
    route_name: routeData?.route_name || '',
    barangay: routeData?.barangay || '',
    start_location: routeData?.start_location || '',
    end_location: routeData?.end_location || '',
    estimated_duration: routeData?.estimated_duration || '',
    route_map_data: routeData?.route_map_data || '',
    is_active: routeData?.is_active ?? true,
    created_by: routeData?.created_by?.toString() || '',
    stops: routeData?.stops || [],
    _method: 'PUT'
  });

  useEffect(() => {
    if (routeData) {
      setData({
        route_name: routeData.route_name || '',
        barangay: routeData.barangay || '',
        start_location: routeData.start_location || '',
        end_location: routeData.end_location || '',
        estimated_duration: routeData.estimated_duration || '',
        route_map_data: routeData.route_map_data || '',
        is_active: routeData.is_active ?? true,
        created_by: routeData.created_by?.toString() || '',
        stops: routeData.stops || [],
        _method: 'PUT'
      });
      setStops(routeData.stops || []);
    }
  }, [routeData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Update stops in form data
    const formData = {
      ...data,
      stops: stops,
    };

    router.post(route('admin.route-management.update', routeData.id), formData, {
      onSuccess: () => {
        setShowEditModal(false);
        toast.success('Route Updated Successfully!');
      },
    });
  };

  const addStop = () => {
    setStops([...stops, {
      stop_order: stops.length + 1,
      stop_address: '',
      latitude: '',
      longitude: '',
      estimated_time: '',
      notes: '',
    }]);
  };

  const removeStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    // Reorder stops
    const reorderedStops = newStops.map((stop, i) => ({
      ...stop,
      stop_order: i + 1,
    }));
    setStops(reorderedStops);
  };

  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
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

          {/* Start Location */}
          <div>
            <Label className="text-zinc-800">Start Location</Label>
            <Input
              type="text"
              value={data.start_location}
              onChange={e => setData('start_location', e.target.value)}
              placeholder="City Hall"
              className={inputClass(errors.start_location)}
            />
            <InputError message={errors.start_location} />
          </div>

          {/* End Location */}
          <div>
            <Label className="text-zinc-800">End Location</Label>
            <Input
              type="text"
              value={data.end_location}
              onChange={e => setData('end_location', e.target.value)}
              placeholder="Transfer Station"
              className={inputClass(errors.end_location)}
            />
            <InputError message={errors.end_location} />
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

          {/* Created By */}
          <div>
            <Label className="text-zinc-800">Created By </Label>
            <Select 
              value={data.created_by} 
              onValueChange={(value) => setData('created_by', value)}
            >
              <SelectTrigger className={inputClass(errors.created_by)}>
                <SelectValue placeholder="Select resident" />
              </SelectTrigger>
              <SelectContent>
                {residents && residents.length > 0 ? (
                  residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id.toString()}>
                      {resident.name} ({resident.email})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No residents available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.created_by} />
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

          {/* Route Stops Section */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-zinc-800">Route Stops</h3>
              <Button
                type="button"
                onClick={addStop}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus size={16} className="mr-1" />
                Add Stop
              </Button>
            </div>

            {stops.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-4">
                No stops added yet. Click "Add Stop" to add route stops.
              </p>
            ) : (
              <div className="space-y-4">
                {stops.map((stop, index) => (
                  <div key={stop.id || index} className="border rounded-lg p-4 bg-zinc-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-zinc-800">Stop #{stop.stop_order}</h4>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Stop Address */}
                      <div className="md:col-span-2">
                        <Label className="text-zinc-800 text-xs">Stop Address </Label>
                        <Input
                          type="text"
                          value={stop.stop_address}
                          onChange={e => updateStop(index, 'stop_address', e.target.value)}
                          placeholder="123 Main Street, Barangay Center"
                          className={inputClass(errors[`stops.${index}.stop_address`])}
                        />
                        <InputError message={errors[`stops.${index}.stop_address`]} />
                      </div>

                      {/* Latitude */}
                      <div>
                        <Label className="text-zinc-800 text-xs">Latitude</Label>
                        <Input
                          type="number"
                          step="0.0000001"
                          value={stop.latitude}
                          onChange={e => updateStop(index, 'latitude', e.target.value)}
                          placeholder="14.5995"
                          className={inputClass(errors[`stops.${index}.latitude`])}
                        />
                        <InputError message={errors[`stops.${index}.latitude`]} />
                      </div>

                      {/* Longitude */}
                      <div>
                        <Label className="text-zinc-800 text-xs">Longitude</Label>
                        <Input
                          type="number"
                          step="0.0000001"
                          value={stop.longitude}
                          onChange={e => updateStop(index, 'longitude', e.target.value)}
                          placeholder="120.9842"
                          className={inputClass(errors[`stops.${index}.longitude`])}
                        />
                        <InputError message={errors[`stops.${index}.longitude`]} />
                      </div>

                      {/* Estimated Time */}
                      <div>
                        <Label className="text-zinc-800 text-xs">Estimated Time</Label>
                        <Input
                          type="time"
                          value={stop.estimated_time}
                          onChange={e => updateStop(index, 'estimated_time', e.target.value)}
                          className={inputClass(errors[`stops.${index}.estimated_time`])}
                        />
                        <InputError message={errors[`stops.${index}.estimated_time`]} />
                      </div>

                      {/* Notes */}
                      <div>
                        <Label className="text-zinc-800 text-xs">Notes</Label>
                        <Input
                          type="text"
                          value={stop.notes}
                          onChange={e => updateStop(index, 'notes', e.target.value)}
                          placeholder="Optional notes"
                          className={inputClass(errors[`stops.${index}.notes`])}
                        />
                        <InputError message={errors[`stops.${index}.notes`]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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