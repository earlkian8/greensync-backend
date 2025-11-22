import { View, Text, Pressable, StyleSheet } from "react-native";
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
      style={[
        styles.card,
        !notification.is_read && styles.cardUnread
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                !notification.is_read && styles.titleUnread
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            <Text style={styles.date}>
              {formattedDate}
            </Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            {notification.message}
          </Text>

          {/* Mark as Read Button */}
          {!notification.is_read && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onMarkAsRead(notification.id);
              }}
              style={styles.markReadButton}
            >
              <Text style={styles.markReadText}>
                Mark as read
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Unread Indicator Dot */}
      {!notification.is_read && (
        <View style={styles.unreadDot} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardUnread: {
    backgroundColor: '#F0FDF4',
  },
  content: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
    color: '#1F2937',
  },
  titleUnread: {
    color: '#15803D',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  markReadButton: {
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 9999,
  },
});

export default NotificationItem;
