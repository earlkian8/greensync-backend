import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import QRCode from 'react-native-qrcode-svg';
import { fetchBinDetails, formatBinData } from "@/services/binsService";

const BinDetailModal = ({ visible, onClose, binId, onUpdate, onDelete }) => {
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBin, setEditedBin] = useState({
    name: "",
    bin_type: "",
    status: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && binId) {
      loadBinDetails();
    }
  }, [visible, binId]);

  const loadBinDetails = async () => {
    setLoading(true);
    const result = await fetchBinDetails(binId);
    if (result.success) {
      const formattedBin = formatBinData(result.data);
      setBin(formattedBin);
      setEditedBin({
        name: formattedBin.name || "",
        bin_type: formattedBin.binType || "",
        status: formattedBin.status || "Active",
      });
      setErrors({});
      setIsEditing(false);
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setEditedBin(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedBin.name.trim()) {
      newErrors.name = "Bin name is required";
    }
    
    if (!editedBin.bin_type) {
      newErrors.bin_type = "Please select a bin type";
    }
    
    if (!editedBin.status) {
      newErrors.status = "Please select a status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      // Map frontend bin type to backend value
      const selectedType = binTypes.find(t => t.value === editedBin.bin_type);
      const backendType = selectedType ? selectedType.backend : editedBin.bin_type;

      const payload = {
        name: editedBin.name.trim(),
        bin_type: backendType,
        status: editedBin.status.toLowerCase(),
      };

      const success = await onUpdate(bin.id, payload);
      
      if (success) {
        setIsEditing(false);
        setErrors({});
        // Reload bin details to get updated data
        await loadBinDetails();
      }
    } catch (error) {
      console.error('Error updating bin:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (bin) {
      setEditedBin({
        name: bin.name || "",
        bin_type: bin.binType || "",
        status: bin.status || "Active",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!bin) return;
    
    Alert.alert(
      "Delete Bin",
      `Are you sure you want to delete "${bin.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await onDelete(bin.id);
            if (success) {
              onClose();
            }
          }
        }
      ]
    );
  };

  // Map frontend to backend bin types
  const binTypes = [
    { label: "Organic", value: "Organic", backend: "biodegradable" },
    { label: "General Waste", value: "General Waste", backend: "non-biodegradable" },
    { label: "Recyclable", value: "Recyclable", backend: "recyclable" },
    { label: "Hazardous", value: "Hazardous", backend: "hazardous" }
  ];

  const statuses = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
    { label: "Full", value: "Full" },
    { label: "Damaged", value: "Damaged" }
  ];

  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'full':
        return { bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'damaged':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

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
            <Text className="text-xl font-bold text-gray-800">Bin Details</Text>
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
          ) : bin ? (
            <ScrollView 
              className="px-5"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Edit Button */}
              {!isEditing && (
                <View className="mt-5 flex-row justify-end">
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    className="px-4 py-2 bg-green-100 rounded-lg active:bg-green-200"
                  >
                    <View className="flex-row items-center">
                      <Feather name="edit-2" size={16} color="#16a34a" />
                      <Text className="text-green-700 font-semibold ml-2">Edit</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            {/* QR Code Display */}
            <View className="items-center py-6 bg-gray-50 rounded-2xl mb-6">
              <View className="bg-white p-4 rounded-xl shadow-sm">
                <QRCode
                  value={bin.qrCode}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Text className="text-gray-600 font-semibold mt-4 text-base">{bin.qrCode}</Text>
              <Text className="text-gray-500 text-sm mt-1">Scan to access bin</Text>
            </View>

            {/* Bin Name */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 mb-2">
                Bin Name {isEditing && <Text className="text-red-500">*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <TextInput
                    value={editedBin.name}
                    onChangeText={(value) => handleChange("name", value)}
                    placeholder="Enter bin name"
                    className={`border rounded-xl px-4 py-3 bg-gray-50 text-gray-800 text-lg font-semibold ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholderTextColor="#9CA3AF"
                    editable={!isUpdating}
                  />
                  {errors.name && (
                    <View className="flex-row items-center mt-1.5">
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text className="text-red-500 text-xs ml-1">{errors.name}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text className="text-2xl font-bold text-gray-800">{bin.name}</Text>
              )}
            </View>

            {/* Bin Type */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 mb-3">
                Bin Type {isEditing && <Text className="text-red-500">*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {binTypes.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() => handleChange("bin_type", type.value)}
                        disabled={isUpdating}
                        className={`px-4 py-2.5 rounded-lg border-2 ${
                          editedBin.bin_type === type.value
                            ? 'bg-green-600 border-green-600'
                            : errors.bin_type
                            ? 'bg-white border-red-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text className={`text-sm font-semibold ${
                          editedBin.bin_type === type.value ? 'text-white' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {errors.bin_type && (
                    <View className="flex-row items-center mt-1.5">
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text className="text-red-500 text-xs ml-1">{errors.bin_type}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View className="inline-flex self-start px-4 py-2.5 rounded-xl bg-blue-100">
                  <Text className="font-semibold text-blue-700">
                    {bin.binType}
                  </Text>
                </View>
              )}
            </View>

            {/* Status */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 mb-3">
                Status {isEditing && <Text className="text-red-500">*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Pressable
                        key={status.value}
                        onPress={() => handleChange("status", status.value)}
                        disabled={isUpdating}
                        className={`px-4 py-3 rounded-xl border-2 ${
                          editedBin.status === status.value
                            ? 'bg-green-600 border-green-600'
                            : errors.status
                            ? 'bg-white border-red-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text className={`text-sm font-semibold ${
                          editedBin.status === status.value ? 'text-white' : 'text-gray-700'
                        }`}>
                          {status.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {errors.status && (
                    <View className="flex-row items-center mt-1.5">
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text className="text-red-500 text-xs ml-1">{errors.status}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View className={`inline-flex self-start px-4 py-2.5 rounded-xl ${getStatusColor(bin.status).bg}`}>
                  <Text className={`font-semibold capitalize ${getStatusColor(bin.status).text}`}>
                    {bin.status}
                  </Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <View className="bg-white p-2 rounded-lg mr-3">
                  <Feather name="calendar" size={18} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Last Collected</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {bin.lastCollected || 'Never'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="bg-white p-2 rounded-lg mr-3">
                  <AntDesign name="clockcircleo" size={18} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">Registered</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {bin.registeredAt}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 border-2 border-gray-300 rounded-xl py-3 active:bg-gray-50"
                >
                  <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdate}
                  disabled={isUpdating}
                  className={`flex-1 rounded-xl py-3 ${
                    isUpdating ? 'bg-green-400' : 'bg-green-600 active:bg-green-700'
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            )}

              {/* Delete Button */}
              {!isEditing && (
                <Pressable
                  onPress={handleDelete}
                  className="border-2 border-red-500 rounded-xl py-3 active:bg-red-50 mb-4"
                >
                  <View className="flex-row items-center justify-center">
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <Text className="text-red-500 font-semibold ml-2">Delete Bin</Text>
                  </View>
                </Pressable>
              )}
            </ScrollView>
          ) : (
            <View className="py-20 items-center">
              <Feather name="alert-circle" size={40} color="#EF4444" />
              <Text className="text-gray-500 mt-3">Failed to load bin details</Text>
            </View>
          )}

          {/* Footer Button */}
        </View>
      </View>
    </Modal>
  );
};

export default BinDetailModal;