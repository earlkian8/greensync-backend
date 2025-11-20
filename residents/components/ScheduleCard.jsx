import { View, Text, Pressable } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const ScheduleCard = ({ schedule }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'Cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
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
      className="bg-white rounded-xl p-4 mb-3 shadow-sm active:bg-gray-50"
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-gray-800">
          {schedule.waste_type}
        </Text>
        <View className={`${statusColors.bg} px-3 py-1 rounded-full`}>
          <Text className={`${statusColors.text} text-xs font-medium`}>
            {schedule.status}
          </Text>
        </View>
      </View>

      {/* Date and Time */}
      <View className="flex-row items-center mb-2">
        <Feather name="calendar" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 ml-2">{formattedDate}</Text>
        <Feather name="clock" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
        <Text className="text-sm text-gray-600 ml-2">{formattedTime}</Text>
      </View>

      {/* Location */}
      <View className="flex-row items-center">
        <Feather name="map-pin" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 ml-2">{schedule.bin_location}</Text>
      </View>
    </Pressable>
  );
};

export default ScheduleCard;