import { View, Text, Pressable, StyleSheet } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const ScheduleCard = ({ schedule }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return { bg: styles.statusScheduledBg, text: styles.statusScheduledText, border: styles.statusScheduledBorder };
      case 'Completed':
        return { bg: styles.statusCompletedBg, text: styles.statusCompletedText, border: styles.statusCompletedBorder };
      case 'Cancelled':
        return { bg: styles.statusCancelledBg, text: styles.statusCancelledText, border: styles.statusCancelledBorder };
      default:
        return { bg: styles.statusDefaultBg, text: styles.statusDefaultText, border: styles.statusDefaultBorder };
    }
  };

  const statusColors = getStatusColor(schedule.status);

  const formattedDate = new Date(schedule.collection_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = schedule.collection_time.substring(0, 5);

  return (
    <Pressable
      onPress={() => console.log("Schedule details:", schedule.id)}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wasteType}>
          {schedule.waste_type}
        </Text>
        <View style={[styles.statusBadge, statusColors.bg]}>
          <Text style={[styles.statusText, statusColors.text]}>
            {schedule.status}
          </Text>
        </View>
      </View>

      {/* Date and Time */}
      <View style={styles.dateTimeRow}>
        <Feather name="calendar" size={14} color="#6B7280" />
        <Text style={styles.dateTimeText}>{formattedDate}</Text>
        <Feather name="clock" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
        <Text style={styles.dateTimeText}>{formattedTime}</Text>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Feather name="map-pin" size={14} color="#6B7280" />
        <Text style={styles.locationText}>{schedule.bin_location}</Text>
      </View>
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
  wasteType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  statusScheduledBg: { backgroundColor: '#DBEAFE' },
  statusScheduledText: { color: '#1E40AF' },
  statusScheduledBorder: { borderColor: '#BFDBFE' },
  statusCompletedBg: { backgroundColor: '#D1FAE5' },
  statusCompletedText: { color: '#065F46' },
  statusCompletedBorder: { borderColor: '#A7F3D0' },
  statusCancelledBg: { backgroundColor: '#FEE2E2' },
  statusCancelledText: { color: '#991B1B' },
  statusCancelledBorder: { borderColor: '#FECACA' },
  statusDefaultBg: { backgroundColor: '#F3F4F6' },
  statusDefaultText: { color: '#374151' },
  statusDefaultBorder: { borderColor: '#E5E7EB' },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
});

export default ScheduleCard;
