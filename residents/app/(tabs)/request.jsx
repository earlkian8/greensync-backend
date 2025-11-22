import { View, Text, ScrollView, KeyboardAvoidingView, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={18}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search requests..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Add Button */}
            <Pressable
              onPress={() => setModalVisible(true)}
              style={styles.addButton}
            >
              <AntDesign name="plus" size={18} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Content Section */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          refreshControl={
            <></> // (You can replace with <RefreshControl> if you want pull-to-refresh)
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No collection requests found.</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 12,
  },
});

export default Request;
