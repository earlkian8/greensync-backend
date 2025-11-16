import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from '@/Components/ui/separator';
import { 
  Mail, 
  Bell, 
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';

const ShowNotification = ({ setShowViewModal, notification }) => {
  const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className={`text-sm ${highlight ? 'font-semibold text-zinc-900' : 'text-zinc-900'}`}>
          {value || '---'}
        </p>
      </div>
    </div>
  );

  const getRecipientDisplay = () => {
    if (notification.recipient_type === 'all_residents') {
      return 'All Residents';
    } else if (notification.recipient_type === 'all_collectors') {
      return 'All Collectors';
    } else if (notification.recipient_type === 'specific' && notification.recipient) {
      return `${notification.recipient.name} (${notification.recipient.email})`;
    } else {
      return notification.recipient_type;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeColor = (type) => {
    const colors = {
      schedule: 'bg-purple-100 text-purple-800 border-purple-200',
      alert: 'bg-red-100 text-red-800 border-red-200',
      announcement: 'bg-blue-100 text-blue-800 border-blue-200',
      request_update: 'bg-green-100 text-green-800 border-green-200',
      route_assignment: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return AlertCircle;
    }
    return Bell;
  };

  const PriorityIcon = getPriorityIcon(notification.priority);

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Notification Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this notification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Priority & Status Section */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Status & Priority</h3>
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-4 ${getPriorityColor(notification.priority)}`}>
                <PriorityIcon className="h-10 w-10" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 text-center uppercase">
                {notification.priority}
              </h2>
              <p className="text-sm text-zinc-600 text-center mt-1">Priority Level</p>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notification.is_read 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {notification.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.notification_type)}`}>
                    {notification.notification_type.replace('_', ' ')}
                  </span>
                </div>
                {notification.is_read && notification.read_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-600">Read At:</span>
                    <span className="text-sm text-zinc-900">
                      {new Date(notification.read_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Notification Information</h3>
            
            {/* Title */}
            <div className="mb-4">
              <h4 className="text-lg font-bold text-zinc-900 mb-2">{notification.title}</h4>
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Message</h4>
              <div className="bg-zinc-50 p-4 rounded-md">
                <p className="text-sm text-zinc-900 whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Recipient Details</h4>
              <InfoRow 
                icon={User} 
                label="Recipient Type" 
                value={notification.recipient_type.replace('_', ' ')} 
              />
              <InfoRow 
                icon={Mail} 
                label="Recipient" 
                value={getRecipientDisplay()} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Additional Information</h4>
              {notification.sender && (
                <InfoRow 
                  icon={User} 
                  label="Sent By" 
                  value={`${notification.sender.name} (${notification.sender.email})`} 
                />
              )}
              <InfoRow 
                icon={Calendar} 
                label="Created At" 
                value={new Date(notification.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} 
              />
              {notification.action_url && (
                <InfoRow 
                  icon={LinkIcon} 
                  label="Action URL" 
                  value={notification.action_url} 
                  highlight={true}
                />
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Notification Created</p>
                  <p className="text-xs text-zinc-600">
                    {new Date(notification.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {notification.is_read && notification.read_at && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">Notification Read</p>
                    <p className="text-xs text-zinc-600">
                      {new Date(notification.read_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowNotification;