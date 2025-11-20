import { View, Text, Modal, Pressable, TextInput, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import * as Location from "expo-location";
import { fetchBins } from "@/services/binsService"; // 👈 Make sure you have this
import { fetchResidentProfile } from "@/services/profileService";
import { geocodeAddress } from "@/services/geocodingService";

const getInitialFormState = () => ({
  request_type: "",
  description: "",
  preferred_date: new Date(),
  preferred_time: new Date(),
  waste_type: "",
  priority: "Medium",
});

const initialGeocodeMeta = {
  loading: false,
  error: null,
  lastUpdated: null,
};

const initialDeviceLocationMeta = {
  loading: false,
  error: null,
  permissionStatus: null,
  lastUpdated: null,
};

const RequestModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(getInitialFormState);

  const [errors, setErrors] = useState({});
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [binsLoading, setBinsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressInfo, setAddressInfo] = useState({ fullAddress: "", isComplete: false });
  const [addressError, setAddressError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [geocodeMeta, setGeocodeMeta] = useState(initialGeocodeMeta);
  const [deviceLocationMeta, setDeviceLocationMeta] = useState(initialDeviceLocationMeta);
  const [coordinatesSource, setCoordinatesSource] = useState(null);

  const resetModalState = () => {
    setFormData(getInitialFormState());
    setSelectedBin(null);
    setErrors({});
    setCoordinates(null);
    setCoordinatesSource(null);
    setAddressInfo({ fullAddress: "", isComplete: false });
    setAddressError(null);
    setGeocodeMeta(initialGeocodeMeta);
    setDeviceLocationMeta(initialDeviceLocationMeta);
    setAddressLoading(false);
  };

  const buildFullAddress = (resident) => {
    if (!resident) return "";
    if (resident.full_address && resident.full_address.trim()) {
      return resident.full_address.trim();
    }

    const barangayName =
      resident?.barangay_relation?.name ||
      resident?.barangayRelation?.name ||
      resident?.barangay ||
      "";
    const cityName =
      resident?.city_relation?.name ||
      resident?.cityRelation?.name ||
      resident?.city ||
      "";
    const provinceName =
      resident?.province_relation?.name ||
      resident?.provinceRelation?.name ||
      resident?.province ||
      "";

    const parts = [
      resident?.house_no,
      resident?.street,
      barangayName,
      cityName,
      provinceName,
      resident?.postal_code,
      resident?.country || "Philippines",
    ];

    const filtered = parts.filter((part) => part && part.toString().trim().length > 0);
    return filtered.join(", ");
  };

  const geocodeResidentLocation = async (fullAddress) => {
    if (!fullAddress) return;

    setGeocodeMeta({ loading: true, error: null, lastUpdated: null });
    const result = await geocodeAddress(fullAddress);

    if (result.success) {
      setCoordinates(result.data);
      setCoordinatesSource("address");
      setGeocodeMeta({ loading: false, error: null, lastUpdated: new Date() });
      setDeviceLocationMeta(initialDeviceLocationMeta);
      setErrors((prev) => ({ ...prev, coordinates: null }));
    } else {
      setGeocodeMeta({ loading: false, error: result.error, lastUpdated: null });
      setDeviceLocationMeta((prev) => ({ ...prev, error: null }));
      setCoordinates((prevCoords) => (coordinatesSource === "address" ? null : prevCoords));
      if (coordinatesSource === "address") {
        setCoordinatesSource(null);
      }
    }
  };

  const loadResidentAddress = async () => {
    setAddressLoading(true);
    setAddressError(null);
    try {
      const profile = await fetchResidentProfile();
      if (!profile.success || !profile.data) {
        const errorMessage = profile.error || "Failed to load your profile address.";
        setAddressError(errorMessage);
        Toast.show(errorMessage, {
          duration: Toast.durations.SHORT,
          backgroundColor: "#DC2626",
          textColor: "white",
          position: Toast.positions.BOTTOM,
        });
        return;
      }

      const fullAddress = buildFullAddress(profile.data);
      const isComplete = Boolean(fullAddress);

      setAddressInfo({ fullAddress, isComplete });

      if (!isComplete) {
        const message = "Please complete your profile address before requesting a pickup.";
        setAddressError(message);
        setCoordinates(null);
        Toast.show(message, {
          duration: Toast.durations.SHORT,
          backgroundColor: "#DC2626",
          textColor: "white",
          position: Toast.positions.BOTTOM,
        });
        return;
      }

      await geocodeResidentLocation(fullAddress);
    } catch (error) {
      console.error("Error loading resident address:", error);
      const message = "Unable to load your address right now. Please try again.";
      setAddressError(message);
      Toast.show(message, {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
    } finally {
      setAddressLoading(false);
    }
  };

  // === Fetch Bins & Address on Modal Open ===
  useEffect(() => {
    if (visible) {
      loadBins();
      loadResidentAddress();
    } else {
      resetModalState();
    }
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

  const handleUseCurrentLocation = async () => {
    setDeviceLocationMeta({ loading: true, error: null, permissionStatus: null, lastUpdated: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const message = "Location permission is required to use your current position.";
        setDeviceLocationMeta({ loading: false, error: message, permissionStatus: status, lastUpdated: null });
        Toast.show(message, {
          duration: Toast.durations.SHORT,
          backgroundColor: "#DC2626",
          textColor: "white",
          position: Toast.positions.BOTTOM,
        });
        if (addressInfo.isComplete && !coordinates) {
          await geocodeResidentLocation(addressInfo.fullAddress);
        }
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });
      setCoordinatesSource("device");
      setDeviceLocationMeta({
        loading: false,
        error: null,
        permissionStatus: status,
        lastUpdated: new Date(),
      });
      setErrors((prev) => ({ ...prev, coordinates: null }));
      setGeocodeMeta((prev) => ({ ...prev, error: null, lastUpdated: prev.lastUpdated }));
    } catch (error) {
      console.error("Error getting device location:", error);
      const message = "Unable to fetch your current location. Please try again.";
      setDeviceLocationMeta({ loading: false, error: message, permissionStatus: "granted", lastUpdated: null });
      Toast.show(message, {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
      if (addressInfo.isComplete && !coordinates) {
        await geocodeResidentLocation(addressInfo.fullAddress);
      }
    }
  };

  const handleRefreshCoordinates = () => {
    if (!addressInfo.fullAddress) {
      const message = "Cannot lookup location. Please complete your profile address first.";
      setAddressError(message);
      Toast.show(message, {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
      return;
    }
    geocodeResidentLocation(addressInfo.fullAddress);
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
    if (!coordinates) newErrors.coordinates = "We couldn't verify your address location yet.";
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

    if (!coordinates) {
      const message = "We still need to confirm your pickup location. Please refresh coordinates.";
      setErrors((prev) => ({ ...prev, coordinates: message }));
      Toast.show(message, {
        duration: Toast.durations.SHORT,
        backgroundColor: "#DC2626",
        textColor: "white",
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        bin_id: selectedBin.id,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
      await onSubmit(payload);

      // Reset form
      setFormData(getInitialFormState());
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

            {/* Pickup Address */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Pickup Address
              </Text>

              {addressLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text className="text-gray-500 text-sm">Loading your address…</Text>
                </View>
              ) : addressInfo.fullAddress ? (
                <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Text className="text-gray-800 text-sm leading-5">{addressInfo.fullAddress}</Text>
                </View>
              ) : (
                <Text className="text-xs text-gray-500">
                  We couldn’t find your address. Please update your profile details.
                </Text>
              )}

              {addressError && <Text className="text-xs text-red-500 mt-1">{addressError}</Text>}
            </View>

            {/* Coordinates */}
            <View className="mb-4">
              <View className="flex-row items-start justify-between gap-2 mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700">
                    Detected Coordinates <Text className="text-red-500">*</Text>
                  </Text>
                  {coordinatesSource && (
                    <Text className="text-[11px] text-gray-500 mt-1">
                      {coordinatesSource === "device" ? "Using your current location" : "Based on your profile address"}
                    </Text>
                  )}
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleRefreshCoordinates}
                    disabled={geocodeMeta.loading || !addressInfo.isComplete}
                    className={`px-3 py-1.5 rounded-lg border ${
                      geocodeMeta.loading || !addressInfo.isComplete
                        ? "border-gray-200 bg-gray-100"
                        : "border-green-600 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        geocodeMeta.loading || !addressInfo.isComplete ? "text-gray-400" : "text-green-600"
                      }`}
                    >
                      {geocodeMeta.loading ? "Locating..." : "Refresh"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUseCurrentLocation}
                    disabled={deviceLocationMeta.loading}
                    className={`px-3 py-1.5 rounded-lg border ${
                      deviceLocationMeta.loading ? "border-gray-200 bg-gray-100" : "border-green-600 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        deviceLocationMeta.loading ? "text-gray-400" : "text-green-600"
                      }`}
                    >
                      {deviceLocationMeta.loading ? "Getting..." : "Use My Location"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {(geocodeMeta.loading || addressLoading) && !deviceLocationMeta.loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text className="text-gray-500 text-sm">Retrieving coordinates…</Text>
                </View>
              ) : deviceLocationMeta.loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text className="text-gray-500 text-sm">Capturing your current location…</Text>
                </View>
              ) : coordinates ? (
                <View className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <Text className="text-green-900 text-sm font-semibold">
                    Latitude: <Text className="font-normal">{coordinates.latitude.toFixed(6)}</Text>
                  </Text>
                  <Text className="text-green-900 text-sm font-semibold mt-1">
                    Longitude: <Text className="font-normal">{coordinates.longitude.toFixed(6)}</Text>
                  </Text>
                  {(coordinatesSource === "device"
                    ? deviceLocationMeta.lastUpdated
                    : geocodeMeta.lastUpdated) && (
                    <Text className="text-[11px] text-green-700 mt-2">
                      Updated{" "}
                      {(coordinatesSource === "device"
                        ? deviceLocationMeta.lastUpdated
                        : geocodeMeta.lastUpdated
                      )?.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              ) : (
                <Text className="text-xs text-gray-500">
                  Coordinates unavailable. Please refresh once your address is complete.
                </Text>
              )}

              {(errors.coordinates || geocodeMeta.error || deviceLocationMeta.error) && (
                <Text className="text-xs text-red-500 mt-1">
                  {errors.coordinates || geocodeMeta.error || deviceLocationMeta.error}
                </Text>
              )}
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
