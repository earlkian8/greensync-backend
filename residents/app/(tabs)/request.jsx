import { View, Text, ScrollView, KeyboardAvoidingView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from '@expo/vector-icons/Feather';
import RequestCard from "@/components/RequestCard";
import RequestModal from "@/components/RequestModal";
import Toast from "react-native-toast-message";
import { fetchCollectionRequests, createCollectionRequest } from "@/services/requestService";
import RequestDetailModal from "@/components/RequestDetailModal";

const Request = () => {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  // === Fetch collection requests ===
  const loadRequests = useCallback(async () => {
    setLoading(true);
    const result = await fetchCollectionRequests();
    if (result.success) {
      setRequests(result.data || []);
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to load requests",
        text2: result.error,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // === Handle add request ===
  const handleAddRequest = async (formData) => {
    const payload = {
      bin_id: formData.bin_id,
      request_type: formData.request_type,
      waste_type: formData.waste_type,
      description: formData.description,
      preferred_date: formData.preferred_date,
      preferred_time: formData.preferred_time,
      priority: formData.priority,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    const result = await createCollectionRequest(payload);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Request Created",
        text2: "Your collection request has been submitted.",
      });
      setModalVisible(false);
      setRequests(prev => [result.data, ...prev]);
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to create request",
        text2: typeof result.error === "string" ? result.error : "Please try again.",
      });
    }
  };

  const filteredRequests = requests.filter((req) =>
    req.request_type.toLowerCase().includes(search.toLowerCase()) ||
    req.waste_type.toLowerCase().includes(search.toLowerCase()) ||
    req.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (requestId) => {
  setSelectedRequestId(requestId);
  setDetailModalVisible(true);
};

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {/* Header Section */}
        <View className="bg-white px-5 pt-5 pb-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            {/* Search Input */}
            <View className="flex-1 relative">
              <Feather
                name="search"
                size={18}
                color="#9CA3AF"
                style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
              />
              <TextInput
                placeholder="Search requests..."
                value={search}
                onChangeText={setSearch}
                className="border border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-gray-50 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Add Button */}
            <Pressable
              onPress={() => setModalVisible(true)}
              className="bg-green-600 px-4 py-3 rounded-xl flex-row items-center shadow-sm active:bg-green-700"
            >
              <AntDesign name="plus" size={18} color="white" />
              <Text className="text-white ml-1.5 font-semibold">Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Content Section */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          refreshControl={
            <></> // (You can replace with <RefreshControl> if you want pull-to-refresh)
          }
        >
          {loading ? (
            <View className="flex-1 justify-center items-center mt-10">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-500 mt-3">Loading requests...</Text>
            </View>
          ) : filteredRequests.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-20">
              <Feather name="inbox" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3">No collection requests found.</Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}  // Updated handler
              />
            ))
          )}
        </ScrollView>

        {/* Modal */}
        <RequestModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleAddRequest}
        />
        <RequestDetailModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          requestId={selectedRequestId}
        />
      </KeyboardAvoidingView>

      {/* Toast Container */}
      <Toast position="bottom" visibilityTime={2500} />
    </SafeAreaView>
  );
};

export default Request;
