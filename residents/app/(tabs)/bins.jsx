import { View, Text, ScrollView, KeyboardAvoidingView, TextInput, Pressable, ActivityIndicator } from "react-native";
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
                style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
              />
              <TextInput
                placeholder="Search bins..."
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
              <Text className="text-gray-500 mt-3">Loading bins...</Text>
            </View>
          ) : filteredBins.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-20">
              <Feather name="inbox" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3">No bins found.</Text>
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

export default Bins;