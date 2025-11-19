import { View, Text, Pressable } from "react-native";
import Feather from '@expo/vector-icons/Feather';

const RequestCard = ({ request, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'assigned':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      case 'medium':
        return { bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
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

  const formattedTime = request.preferred_time
    ? request.preferred_time.substring(0, 5)
    : '--:--';

  return (
    <Pressable
      onPress={() => onViewDetails(request.id)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm active:bg-gray-50"
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-gray-800 flex-1">
          {request.request_type || 'Unnamed Request'}
        </Text>
        <View className={`${statusColors.bg} px-3 py-1 rounded-full`}>
          <Text className={`${statusColors.text} text-xs font-medium`}>
            {request.status || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Waste Type & Priority */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-gray-600">{request.waste_type || 'N/A'}</Text>
        <View className={`${priorityColors.bg} px-3 py-1 rounded-full`}>
          <Text className={`${priorityColors.text} text-xs font-medium`}>
            {request.priority || 'Normal'}
          </Text>
        </View>
      </View>

      {/* Date & Time */}
      <View className="flex-row items-center mb-3">
        <Feather name="calendar" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 ml-1.5">
          {formattedDate}
        </Text>
        <Feather name="clock" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
        <Text className="text-sm text-gray-600 ml-1.5">{formattedTime}</Text>
      </View>

      {/* Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onViewDetails(request.id);
        }}
        className="border border-green-600 rounded-lg py-2.5 active:bg-green-50"
      >
        <Text className="text-green-600 text-center font-medium text-sm">
          View Details
        </Text>
      </Pressable>
    </Pressable>
  );
};

export default RequestCard;
