import { View, Text, Pressable, StyleSheet } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const ScheduleCard = ({ schedule }) => {
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'scheduled':
      case 'assigned':
        return { bg: styles.statusScheduledBg, text: styles.statusScheduledText, border: styles.statusScheduledBorder };
      case 'completed':
        return { bg: styles.statusCompletedBg, text: styles.statusCompletedText, border: styles.statusCompletedBorder };
      case 'cancelled':
        return { bg: styles.statusCancelledBg, text: styles.statusCancelledText, border: styles.statusCancelledBorder };
      case 'in_progress':
      case 'in progress':
        return { bg: styles.statusInProgressBg, text: styles.statusInProgressText, border: styles.statusInProgressBorder };
      case 'pending':
        return { bg: styles.statusPendingBg, text: styles.statusPendingText, border: styles.statusPendingBorder };
      default:
        return { bg: styles.statusDefaultBg, text: styles.statusDefaultText, border: styles.statusDefaultBorder };
    }
  };

  const statusColors = getStatusColor(schedule.status);

  const formattedDate = new Date(schedule.collection_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = schedule.collection_time ? schedule.collection_time.substring(0, 5) : '--:--';

  // Capitalize function
  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <Pressable
      onPress={() => console.log("Schedule details:", schedule.id)}
      style={[styles.card, statusColors.border && { borderLeftWidth: 4, borderLeftColor: statusColors.border.borderLeftColor }]}
    >
      {/* Date and Time - Prominent */}
      <View style={styles.dateTimeSection}>
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={18} color="#16A34A" />
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <View style={styles.timeRow}>
              <Feather name="clock" size={16} color="#16A34A" />
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, statusColors.bg]}>
          <Text style={[styles.statusText, statusColors.text]}>
            {capitalize(schedule.status)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Request Type and Bin Name */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Feather name="tag" size={14} color="#6B7280" />
          <Text style={styles.infoLabel}>Request Type:</Text>
          <Text style={styles.infoValue}>{capitalize(schedule.request_type || 'Collection')}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Feather name="trash-2" size={14} color="#6B7280" />
          <Text style={styles.infoLabel}>Bin:</Text>
          <Text style={styles.infoValue}>{capitalize(schedule.bin_name || 'N/A')}</Text>
        </View>
      </View>

      {/* Route Assigned */}
      {schedule.route_name && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="map" size={14} color="#6B7280" />
            <Text style={styles.infoLabel}>Route:</Text>
            <Text style={styles.infoValue}>{schedule.route_name}</Text>
          </View>
        </View>
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
    borderColor: '#E5E7EB',
    borderWidth: 1,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  dateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTimeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusScheduledBg: { backgroundColor: '#DBEAFE' },
  statusScheduledText: { color: '#1E40AF' },
  statusScheduledBorder: { borderLeftColor: '#3B82F6' },
  statusInProgressBg: { backgroundColor: '#FEF3C7' },
  statusInProgressText: { color: '#D97706' },
  statusInProgressBorder: { borderLeftColor: '#F59E0B' },
  statusPendingBg: { backgroundColor: '#E0E7FF' },
  statusPendingText: { color: '#6366F1' },
  statusPendingBorder: { borderLeftColor: '#6366F1' },
  statusCompletedBg: { backgroundColor: '#D1FAE5' },
  statusCompletedText: { color: '#065F46' },
  statusCompletedBorder: { borderLeftColor: '#10B981' },
  statusCancelledBg: { backgroundColor: '#FEE2E2' },
  statusCancelledText: { color: '#991B1B' },
  statusCancelledBorder: { borderLeftColor: '#EF4444' },
  statusDefaultBg: { backgroundColor: '#F3F4F6' },
  statusDefaultText: { color: '#374151' },
  statusDefaultBorder: { borderLeftColor: '#9CA3AF' },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
});

export default ScheduleCard;
