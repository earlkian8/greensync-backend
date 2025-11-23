import { View, Text, ScrollView, KeyboardAvoidingView, TextInput, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from '@expo/vector-icons/Feather';
import RequestCard from "@/components/RequestCard";
import RequestModal from "@/components/RequestModal";
import Toast from "react-native-toast-message";
import { fetchCollectionRequests, createCollectionRequest, deleteCollectionRequest } from "@/services/requestService";
import RequestDetailModal from "@/components/RequestDetailModal";

const Request = () => {
  const insets = useSafeAreaInsets();
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

  const handleDeleteRequest = (requestId) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setDetailModalVisible(false);
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
        {/* Content Section */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={async () => {
                setRefreshing(true);
                await loadRequests();
                setRefreshing(false);
              }} 
            />
          }
        >
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
            </View>
          </View>
          <View style={styles.contentContainer}>
            {loading && !refreshing ? (
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
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </View>
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
          onDelete={handleDeleteRequest}
        />
      </KeyboardAvoidingView>

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { bottom: insets.bottom + 0 }]}
      >
        <AntDesign name="plus" size={24} color="white" />
      </Pressable>

      {/* Toast Container */}
      <Toast position="bottom" visibilityTime={2500} />
    </View>
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
    paddingTop: 16,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
