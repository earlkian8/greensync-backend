import { View, Text, Pressable, StyleSheet } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const RequestCard = ({ request, onViewDetails }) => {
  // Capitalize helper function
  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  // Format status - handle in_progress
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    const statusLower = status.toLowerCase();
    if (statusLower === 'in_progress') return 'In Progress';
    return capitalize(status);
  };

  // Format time to AM/PM
  const formatTime = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: styles.statusPendingBg, text: styles.statusPendingText };
      case 'assigned':
        return { bg: styles.statusAssignedBg, text: styles.statusAssignedText };
      case 'in_progress':
      case 'in progress':
        return { bg: styles.statusInProgressBg, text: styles.statusInProgressText };
      case 'completed':
        return { bg: styles.statusCompletedBg, text: styles.statusCompletedText };
      case 'cancelled':
        return { bg: styles.statusCancelledBg, text: styles.statusCancelledText };
      default:
        return { bg: styles.statusDefaultBg, text: styles.statusDefaultText };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: styles.priorityHighBg, text: styles.priorityHighText };
      case 'medium':
        return { bg: styles.priorityMediumBg, text: styles.priorityMediumText };
      case 'low':
        return { bg: styles.priorityLowBg, text: styles.priorityLowText };
      default:
        return { bg: styles.priorityDefaultBg, text: styles.priorityDefaultText };
    }
  };

  const statusColors = getStatusColor(request.status);
  const priorityColors = getPriorityColor(request.priority);

  const formattedDate = request.preferred_date
    ? new Date(request.preferred_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No date set';

  const formattedTime = formatTime(request.preferred_time);

  return (
    <Pressable
      onPress={() => onViewDetails(request.id)}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.requestType} numberOfLines={1}>
          {capitalize(request.request_type || 'Unnamed Request')}
        </Text>
        <View style={[styles.statusBadge, statusColors.bg]}>
          <Text style={[styles.statusText, statusColors.text]}>
            {formatStatus(request.status)}
          </Text>
        </View>
      </View>

      {/* Waste Type & Priority */}
      <View style={styles.infoRow}>
        <Text style={styles.wasteType}>{capitalize(request.waste_type?.replace(/-/g, ' ') || 'N/A')}</Text>
        <View style={[styles.priorityBadge, priorityColors.bg]}>
          <Text style={[styles.priorityText, priorityColors.text]}>
            {capitalize(request.priority || 'Normal')}
          </Text>
        </View>
      </View>

      {/* Date & Time */}
      <View style={styles.dateTimeRow}>
        <Feather name="calendar" size={14} color="#6B7280" />
        <Text style={styles.dateTimeText}>
          {formattedDate}
        </Text>
        <Feather name="clock" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
        <Text style={styles.dateTimeText}>{formattedTime}</Text>
      </View>

      {/* Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onViewDetails(request.id);
        }}
        style={styles.viewButton}
      >
        <Text style={styles.viewButtonText}>
          View Details
        </Text>
      </Pressable>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPendingBg: { backgroundColor: '#FEF3C7' },
  statusPendingText: { color: '#92400E' },
  statusAssignedBg: { backgroundColor: '#DBEAFE' },
  statusAssignedText: { color: '#1E40AF' },
  statusInProgressBg: { backgroundColor: '#E9D5FF' },
  statusInProgressText: { color: '#6B21A8' },
  statusCompletedBg: { backgroundColor: '#D1FAE5' },
  statusCompletedText: { color: '#065F46' },
  statusCancelledBg: { backgroundColor: '#FEE2E2' },
  statusCancelledText: { color: '#991B1B' },
  statusDefaultBg: { backgroundColor: '#F3F4F6' },
  statusDefaultText: { color: '#374151' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wasteType: {
    fontSize: 14,
    color: '#4B5563',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityHighBg: { backgroundColor: '#FEE2E2' },
  priorityHighText: { color: '#991B1B' },
  priorityMediumBg: { backgroundColor: '#FED7AA' },
  priorityMediumText: { color: '#9A3412' },
  priorityLowBg: { backgroundColor: '#DBEAFE' },
  priorityLowText: { color: '#1E40AF' },
  priorityDefaultBg: { backgroundColor: '#F3F4F6' },
  priorityDefaultText: { color: '#374151' },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  viewButton: {
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 10,
  },
  viewButtonText: {
    color: '#16A34A',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default RequestCard;
