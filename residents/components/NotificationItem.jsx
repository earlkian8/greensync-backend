import { View, Text, Pressable } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'reminder':
        return <Feather name="bell" size={20} color="#EAB308" />;
      case 'completion':
        return <MaterialIcons name="check-circle" size={20} color="#22C55E" />;
      case 'update':
        return <Feather name="alert-circle" size={20} color="#3B82F6" />;
      default:
        return <Feather name="info" size={20} color="#6B7280" />;
    }
  };

  const formattedDate = new Date(notification.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <Pressable
      onPress={() => !notification.is_read && onMarkAsRead(notification.id)}
      className={`${
        !notification.is_read ? 'bg-green-50' : 'bg-white'
      } rounded-xl p-4 mb-3 shadow-sm active:opacity-90`}
    >
      <View className="flex-row">
        {/* Icon */}
        <View className="mr-3 mt-1">
          {getIcon()}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-1">
            <Text
              className={`flex-1 font-semibold text-base mr-2 ${
                !notification.is_read ? 'text-green-700' : 'text-gray-800'
              }`}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            <Text className="text-xs text-gray-500">
              {formattedDate}
            </Text>
          </View>

          {/* Message */}
          <Text className="text-sm text-gray-600 leading-5 mb-2">
            {notification.message}
          </Text>

          {/* Mark as Read Button */}
          {!notification.is_read && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onMarkAsRead(notification.id);
              }}
              className="self-start active:opacity-70"
            >
              <Text className="text-sm text-green-600 font-medium">
                Mark as read
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Unread Indicator Dot */}
      {!notification.is_read && (
        <View className="absolute top-4 right-4 w-2 h-2 bg-green-600 rounded-full" />
      )}
    </Pressable>
  );
};

export default NotificationItem;