import { View, Text, Modal, Pressable, TextInput, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import { fetchBins } from "@/services/binsService"; // 👈 Make sure you have this

const RequestModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    request_type: "",
    description: "",
    preferred_date: new Date(),
    preferred_time: new Date(),
    waste_type: "",
    priority: "Medium",
  });

  const [errors, setErrors] = useState({});
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [binsLoading, setBinsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // === Fetch Bins on Modal Open ===
  useEffect(() => {
    if (visible) loadBins();
  }, [visible]);

  const loadBins = async () => {
    setBinsLoading(true);
    const result = await fetchBins();
    if (result.success) setBins(result.data);
    else {
      Toast.show("Failed to load bins.", {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
    }
    setBinsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!selectedBin) newErrors.bin_id = "Select a bin.";
    if (!formData.request_type) newErrors.request_type = "Select a request type.";
    if (!formData.waste_type) newErrors.waste_type = "Select a waste type.";
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show("Please fill in all required fields.", {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, bin_id: selectedBin.id };
      await onSubmit(payload);

      // Reset form
      setFormData({
        request_type: "",
        description: "",
        preferred_date: new Date(),
        preferred_time: new Date(),
        waste_type: "",
        priority: "Medium",
      });
      setSelectedBin(null);

      Toast.show("Request submitted successfully!", {
        duration: Toast.durations.SHORT,
        backgroundColor: "#16A34A",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
      onClose();
    } catch (error) {
      Toast.show("Failed to submit request. Try again later.", {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setLoading(false);
    }
  };

  const requestTypes = ["Regular", "Special", "Bulk", "Emergency"];
  const wasteTypes = ["Biodegradable", "Non-biodegradable", "Recyclable", "Hazardous", "Mixed"];
  const priorities = ["Low", "Medium", "High", "Urgent"];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Create Collection Request</Text>
            <Pressable onPress={onClose} className="p-2 active:bg-gray-100 rounded-full">
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>

            {/* Bin Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Select Bin <Text className="text-red-500">*</Text>
              </Text>

              {binsLoading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : bins.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {bins.map((bin) => (
                    <Pressable
                      key={bin.id}
                      onPress={() => setSelectedBin(bin)}
                      className={`px-4 py-3 rounded-xl border ${
                        selectedBin?.id === bin.id
                          ? "bg-green-600 border-green-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedBin?.id === bin.id ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {bin.qr_code || "Bin"} - {bin.bin_type}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text className="text-xs text-gray-500 mt-1">No bins available.</Text>
              )}

              {errors.bin_id && <Text className="text-xs text-red-500 mt-1">{errors.bin_id}</Text>}
            </View>

            {/* Request Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Request Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {requestTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleChange("request_type", type.toLowerCase())}
                    className={`px-4 py-2 rounded-lg border ${
                      formData.request_type === type.toLowerCase()
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        formData.request_type === type.toLowerCase() ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.request_type && <Text className="text-xs text-red-500 mt-1">{errors.request_type}</Text>}
            </View>

            {/* Waste Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Waste Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {wasteTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleChange("waste_type", type.toLowerCase().replace(" ", "-"))}
                    className={`px-4 py-2 rounded-lg border ${
                      formData.waste_type === type.toLowerCase().replace(" ", "-")
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        formData.waste_type === type.toLowerCase().replace(" ", "-")
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.waste_type && <Text className="text-xs text-red-500 mt-1">{errors.waste_type}</Text>}
            </View>

            {/* Priority */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Priority</Text>
              <View className="flex-row gap-2">
                {priorities.map((priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => handleChange("priority", priority.toLowerCase())}
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      formData.priority === priority.toLowerCase()
                        ? "bg-green-600 border-green-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium text-center ${
                        formData.priority === priority.toLowerCase() ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {priority}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date & Time */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Preferred Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
              >
                <Text className="text-gray-800">
                  {formData.preferred_date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Feather name="calendar" size={18} color="#6B7280" />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.preferred_date}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) handleChange("preferred_date", selectedDate);
                  }}
                />
              )}
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Preferred Time</Text>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
              >
                <Text className="text-gray-800">
                  {formData.preferred_time.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Feather name="clock" size={18} color="#6B7280" />
              </Pressable>
              {showTimePicker && (
                <DateTimePicker
                  value={formData.preferred_time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(Platform.OS === "ios");
                    if (selectedTime) handleChange("preferred_time", selectedTime);
                  }}
                />
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description (Optional)</Text>
              <TextInput
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                placeholder="Add any additional details..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-gray-200 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-xl py-3 active:bg-gray-50"
              disabled={loading}
            >
              <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              className={`flex-1 rounded-xl py-3 ${
                loading ? "bg-green-400" : "bg-green-600 active:bg-green-700"
              }`}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold">Submit Request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RequestModal;
