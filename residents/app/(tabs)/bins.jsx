import { View, Text, ScrollView, KeyboardAvoidingView, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import BinsCard from "@/components/BinsCard";
import Feather from '@expo/vector-icons/Feather';
import BinModal from "@/components/BinModal";
import BinDetailModal from "@/components/BinDetailModal";
import Toast from "react-native-toast-message";
import { fetchBins, createBin, updateBin, deleteBin, formatBinData } from '@/services/binsService';

const Bins = () => {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // === Fetch bins ===
  const loadBins = useCallback(async () => {
    setLoading(true);
    const result = await fetchBins();
    if (result.success) {
      const formattedBins = result.data.map(bin => formatBinData(bin));
      setBins(formattedBins || []);
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to load bins",
        text2: result.error,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBins();
  }, [loadBins]);

  // === Handle add bin ===
  const handleAddBin = async (formData) => {
    const result = await createBin(formData);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Bin Registered",
        text2: "Your waste bin has been registered successfully.",
      });
      setModalVisible(false);
      const formattedBin = formatBinData(result.data);
      setBins(prev => [formattedBin, ...prev]);
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to register bin",
        text2: typeof result.error === "string" ? result.error : "Please try again.",
      });
    }
  };

  // === Handle update bin ===
  const handleUpdateBin = async (binId, updatedData) => {
    const result = await updateBin(binId, updatedData);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Bin Updated",
        text2: "Bin information has been updated successfully.",
      });
      // Update bin in local state
      setBins(bins.map(bin => 
        bin.id === binId 
          ? formatBinData(result.data)
          : bin
      ));
      return true;
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to update bin",
        text2: typeof result.error === "string" ? result.error : "Please try again.",
      });
      return false;
    }
  };

  // === Handle delete bin ===
  const handleDeleteBin = async (binId) => {
    const result = await deleteBin(binId);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Bin Deleted",
        text2: "Bin has been deleted successfully.",
      });
      // Remove bin from local state
      setBins(bins.filter(bin => bin.id !== binId));
      setDetailModalVisible(false);
      return true;
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to delete bin",
        text2: typeof result.error === "string" ? result.error : "Please try again.",
      });
      return false;
    }
  };

  const filteredBins = bins.filter(bin => 
    bin.name.toLowerCase().includes(search.toLowerCase()) ||
    bin.qrCode.toLowerCase().includes(search.toLowerCase()) ||
    bin.binType.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (binId) => {
    setSelectedBinId(binId);
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
                placeholder="Search bins..."
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
              <Text style={styles.loadingText}>Loading bins...</Text>
            </View>
          ) : filteredBins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No bins found.</Text>
            </View>
          ) : (
            filteredBins.map((bin) => (
              <BinsCard
                key={bin.id}
                bin={bin}
                onPress={() => handleViewDetails(bin.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Modal */}
        <BinModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleAddBin}
        />
        <BinDetailModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          binId={selectedBinId}
          onUpdate={handleUpdateBin}
          onDelete={handleDeleteBin}
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

export default Bins;