import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from "@expo/vector-icons/AntDesign";
import { fetchCollectionRequestDetails } from "@/services/requestService";

const RequestDetailModal = ({ visible, onClose, requestId }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && requestId) {
      loadRequestDetails();
    }
  }, [visible, requestId]);

  const loadRequestDetails = async () => {
    setLoading(true);
    const result = await fetchCollectionRequestDetails(requestId);
    if (result.success) {
      setRequest(result.data);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'assigned':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'in_progress':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: '🔥' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '⚠️' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '📌' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📋' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📄' };
    }
  };

  const formatRequestType = (type) => {
    const types = {
      regular: { label: 'Regular Collection', icon: 'trash-2' },
      special: { label: 'Special Collection', icon: 'star' },
      bulk: { label: 'Bulk Collection', icon: 'package' },
      emergency: { label: 'Emergency Collection', icon: 'alert-circle' }
    };
    return types[type?.toLowerCase()] || { label: type, icon: 'file' };
  };

  const formatWasteType = (type) => {
    return type?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Not set';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Not available';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = getStatusColor(request?.status);
  const priorityColors = getPriorityColor(request?.priority);
  const requestType = formatRequestType(request?.request_type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-5 pb-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Request Details</Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
            >
              <AntDesign name="close" size={18} color="#374151" />
            </Pressable>
          </View>

          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-500 mt-3">Loading details...</Text>
            </View>
          ) : request ? (
            <ScrollView 
              className="px-5"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Status Badge */}
              <View className="mt-5">
                <View className={`${statusColors.bg} ${statusColors.border} border-2 px-4 py-3 rounded-xl self-start`}>
                  <Text className={`${statusColors.text} text-base font-bold uppercase tracking-wide`}>
                    {request.status}
                  </Text>
                </View>
              </View>

              {/* Request Type & Priority */}
              <View className="mt-5 bg-gray-50 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <Feather name={requestType.icon} size={20} color="#16a34a" />
                  <Text className="ml-2 text-base font-semibold text-gray-800">
                    {requestType.label}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">{priorityColors.icon}</Text>
                  <View className={`${priorityColors.bg} px-3 py-1.5 rounded-lg`}>
                    <Text className={`${priorityColors.text} text-sm font-semibold uppercase`}>
                      {request.priority} Priority
                    </Text>
                  </View>
                </View>
              </View>

              {/* Waste Information */}
              <View className="mt-5">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Waste Information
                </Text>
                <View className="bg-white border border-gray-200 rounded-xl p-4">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                      <Feather name="trash-2" size={18} color="#16a34a" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-xs text-gray-500">Waste Type</Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {formatWasteType(request.waste_type)}
                      </Text>
                    </View>
                  </View>

                  {request.waste_bin && (
                    <View className="flex-row items-center pt-3 border-t border-gray-100">
                      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                        <Feather name="inbox" size={18} color="#2563eb" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-xs text-gray-500">Bin Location</Text>
                        <Text className="text-base font-semibold text-gray-800">
                          {request.waste_bin.location || 'No location specified'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Schedule */}
              <View className="mt-5">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Preferred Schedule
                </Text>
                <View className="bg-white border border-gray-200 rounded-xl p-4">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                      <Feather name="calendar" size={18} color="#9333ea" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-xs text-gray-500">Date</Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {formatDate(request.preferred_date)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center pt-3 border-t border-gray-100">
                    <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                      <Feather name="clock" size={18} color="#ea580c" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-xs text-gray-500">Time</Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {formatTime(request.preferred_time)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Description */}
              {request.description && (
                <View className="mt-5">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </Text>
                  <View className="bg-white border border-gray-200 rounded-xl p-4">
                    <Text className="text-gray-700 leading-6">
                      {request.description}
                    </Text>
                  </View>
                </View>
              )}

              {/* Image */}
              {request.image_url && (
                <View className="mt-5">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Attached Image
                  </Text>
                  <View className="bg-gray-100 rounded-xl p-3 flex-row items-center">
                    <Feather name="image" size={20} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-600 flex-1" numberOfLines={1}>
                      {request.image_url}
                    </Text>
                  </View>
                </View>
              )}

              {/* Metadata */}
              <View className="mt-5">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Request Information
                </Text>
                <View className="bg-white border border-gray-200 rounded-xl p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Request ID</Text>
                    <Text className="font-semibold text-gray-800">#{request.id}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Created</Text>
                    <Text className="font-semibold text-gray-800">
                      {formatDateTime(request.created_at)}
                    </Text>
                  </View>
                  {request.updated_at && request.updated_at !== request.created_at && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Last Updated</Text>
                      <Text className="font-semibold text-gray-800">
                        {formatDateTime(request.updated_at)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View className="py-20 items-center">
              <Feather name="alert-circle" size={40} color="#EF4444" />
              <Text className="text-gray-500 mt-3">Failed to load request details</Text>
            </View>
          )}

          {/* Footer Button */}
          {!loading && request && (
            <View className="px-5 py-4 border-t border-gray-200">
              <Pressable
                onPress={onClose}
                className="bg-green-600 py-3.5 rounded-xl active:bg-green-700"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Close
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default RequestDetailModal;