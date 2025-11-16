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
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from 'react';

const EditNotification = ({ notification, setShowEditModal, users }) => {
  const { data, setData, post, errors, processing } = useForm({
    recipient_type: notification?.recipient_type || 'specific',
    recipient_id: notification?.recipient_id?.toString() || '',
    title: notification?.title || '',
    message: notification?.message || '',
    notification_type: notification?.notification_type || 'alert',
    priority: notification?.priority || 'medium',
    action_url: notification?.action_url || '',
    _method: 'PUT'
  });

  useEffect(() => {
    if (notification) {
      setData({
        recipient_type: notification.recipient_type || 'specific',
        recipient_id: notification.recipient_id?.toString() || '',
        title: notification.title || '',
        message: notification.message || '',
        notification_type: notification.notification_type || 'alert',
        priority: notification.priority || 'medium',
        action_url: notification.action_url || '',
        _method: 'PUT'
      });
    }
  }, [notification]);

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.notification-management.update', notification.id), {
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
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Edit Notification</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Update the notification details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Title */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Title</Label>
            <Input
              type="text"
              value={data.title}
              onChange={e => setData('title', e.target.value)}
              placeholder="Notification Title"
              className={inputClass(errors.title)}
            />
            <InputError message={errors.title} />
          </div>

          {/* Message */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Message</Label>
            <Textarea
              value={data.message}
              onChange={e => setData('message', e.target.value)}
              placeholder="Enter notification message..."
              className={inputClass(errors.message)}
              rows={4}
            />
            <InputError message={errors.message} />
          </div>

          {/* Recipient Type */}
          <div>
            <Label className="text-zinc-800">Recipient Type</Label>
            <Select 
              value={data.recipient_type} 
              onValueChange={(value) => {
                setData('recipient_type', value);
                // Clear recipient_id if not specific
                if (value !== 'specific') {
                  setData('recipient_id', '');
                }
              }}
            >
              <SelectTrigger className={inputClass(errors.recipient_type)}>
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific">Specific User</SelectItem>
                <SelectItem value="resident">Resident Role</SelectItem>
                <SelectItem value="collector">Collector Role</SelectItem>
                <SelectItem value="all_residents">All Residents</SelectItem>
                <SelectItem value="all_collectors">All Collectors</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.recipient_type} />
          </div>

          {/* Recipient (only show if specific) */}
          {data.recipient_type === 'specific' && (
            <div>
              <Label className="text-zinc-800">Recipient</Label>
              <Select 
                value={data.recipient_id} 
                onValueChange={(value) => setData('recipient_id', value)}
              >
                <SelectTrigger className={inputClass(errors.recipient_id)}>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError message={errors.recipient_id} />
            </div>
          )}

          {/* Notification Type */}
          <div>
            <Label className="text-zinc-800">Notification Type</Label>
            <Select 
              value={data.notification_type} 
              onValueChange={(value) => setData('notification_type', value)}
            >
              <SelectTrigger className={inputClass(errors.notification_type)}>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="request_update">Request Update</SelectItem>
                <SelectItem value="route_assignment">Route Assignment</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.notification_type} />
          </div>

          {/* Priority */}
          <div>
            <Label className="text-zinc-800">Priority</Label>
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

          {/* Action URL (Optional) */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Action URL (Optional)</Label>
            <Input
              type="text"
              value={data.action_url}
              onChange={e => setData('action_url', e.target.value)}
              placeholder="/dashboard/collection-requests"
              className={inputClass(errors.action_url)}
            />
            <InputError message={errors.action_url} />
            <p className="text-xs text-zinc-500 mt-1">
              Optional URL for users to navigate when clicking the notification
            </p>
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
              Update Notification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditNotification;