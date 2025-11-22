import { View, Text, Modal, Pressable, TextInput, ScrollView, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import * as Location from "expo-location";
import { fetchBins } from "@/services/binsService";
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Collection Request</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

            {/* Bin Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Select Bin <Text style={styles.required}>*</Text>
              </Text>

              {binsLoading ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : bins.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.binsScrollView}>
                  {bins.map((bin) => (
                    <Pressable
                      key={bin.id}
                      onPress={() => setSelectedBin(bin)}
                      style={[
                        styles.binOption,
                        selectedBin?.id === bin.id && styles.binOptionSelected
                      ]}
                    >
                      <Text style={[
                        styles.binOptionText,
                        selectedBin?.id === bin.id && styles.binOptionTextSelected
                      ]}>
                        {bin.qr_code || "Bin"} - {bin.bin_type}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.helperText}>No bins available.</Text>
              )}

              {errors.bin_id && <Text style={styles.errorText}>{errors.bin_id}</Text>}
            </View>

            {/* Pickup Address */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Pickup Address
              </Text>

              {addressLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={styles.loadingText}>Loading your address…</Text>
                </View>
              ) : addressInfo.fullAddress ? (
                <View style={styles.addressBox}>
                  <Text style={styles.addressText}>{addressInfo.fullAddress}</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>
                  We couldn't find your address. Please update your profile details.
                </Text>
              )}

              {addressError && <Text style={styles.errorText}>{addressError}</Text>}
            </View>

            {/* Coordinates */}
            <View style={styles.fieldContainer}>
              <View style={styles.coordinatesHeader}>
                <View style={styles.coordinatesHeaderLeft}>
                  <Text style={styles.label}>
                    Detected Coordinates <Text style={styles.required}>*</Text>
                  </Text>
                  {coordinatesSource && (
                    <Text style={styles.coordinatesSourceText}>
                      {coordinatesSource === "device" ? "Using your current location" : "Based on your profile address"}
                    </Text>
                  )}
                </View>
                <View style={styles.coordinateButtons}>
                  <Pressable
                    onPress={handleRefreshCoordinates}
                    disabled={geocodeMeta.loading || !addressInfo.isComplete}
                    style={[
                      styles.coordinateButton,
                      (geocodeMeta.loading || !addressInfo.isComplete) && styles.coordinateButtonDisabled
                    ]}
                  >
                    <Text style={[
                      styles.coordinateButtonText,
                      (geocodeMeta.loading || !addressInfo.isComplete) && styles.coordinateButtonTextDisabled
                    ]}>
                      {geocodeMeta.loading ? "Locating..." : "Refresh"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUseCurrentLocation}
                    disabled={deviceLocationMeta.loading}
                    style={[
                      styles.coordinateButton,
                      deviceLocationMeta.loading && styles.coordinateButtonDisabled
                    ]}
                  >
                    <Text style={[
                      styles.coordinateButtonText,
                      deviceLocationMeta.loading && styles.coordinateButtonTextDisabled
                    ]}>
                      {deviceLocationMeta.loading ? "Getting..." : "Use My Location"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {(geocodeMeta.loading || addressLoading) && !deviceLocationMeta.loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={styles.loadingText}>Retrieving coordinates…</Text>
                </View>
              ) : deviceLocationMeta.loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={styles.loadingText}>Capturing your current location…</Text>
                </View>
              ) : coordinates ? (
                <View style={styles.coordinatesBox}>
                  <Text style={styles.coordinatesLabel}>
                    Latitude: <Text style={styles.coordinatesValue}>{coordinates.latitude.toFixed(6)}</Text>
                  </Text>
                  <Text style={styles.coordinatesLabel}>
                    Longitude: <Text style={styles.coordinatesValue}>{coordinates.longitude.toFixed(6)}</Text>
                  </Text>
                  {(coordinatesSource === "device"
                    ? deviceLocationMeta.lastUpdated
                    : geocodeMeta.lastUpdated) && (
                    <Text style={styles.coordinatesTimestamp}>
                      Updated{" "}
                      {(coordinatesSource === "device"
                        ? deviceLocationMeta.lastUpdated
                        : geocodeMeta.lastUpdated
                      )?.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.helperText}>
                  Coordinates unavailable. Please refresh once your address is complete.
                </Text>
              )}

              {(errors.coordinates || geocodeMeta.error || deviceLocationMeta.error) && (
                <Text style={styles.errorText}>
                  {errors.coordinates || geocodeMeta.error || deviceLocationMeta.error}
                </Text>
              )}
            </View>

            {/* Request Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Request Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {requestTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleChange("request_type", type.toLowerCase())}
                    style={[
                      styles.optionButton,
                      formData.request_type === type.toLowerCase() && styles.optionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.request_type === type.toLowerCase() && styles.optionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.request_type && <Text style={styles.errorText}>{errors.request_type}</Text>}
            </View>

            {/* Waste Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Waste Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {wasteTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleChange("waste_type", type.toLowerCase().replace(" ", "-"))}
                    style={[
                      styles.optionButton,
                      formData.waste_type === type.toLowerCase().replace(" ", "-") && styles.optionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.waste_type === type.toLowerCase().replace(" ", "-") && styles.optionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.waste_type && <Text style={styles.errorText}>{errors.waste_type}</Text>}
            </View>

            {/* Priority */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => handleChange("priority", priority.toLowerCase())}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority.toLowerCase() && styles.priorityButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.priorityText,
                      formData.priority === priority.toLowerCase() && styles.priorityTextSelected
                    ]}>
                      {priority}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Preferred Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={styles.dateTimeButton}
              >
                <Text style={styles.dateTimeText}>
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

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Preferred Time</Text>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={styles.dateTimeButton}
              >
                <Text style={styles.dateTimeText}>
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
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                placeholder="Add any additional details..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.descriptionInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  binsScrollView: {
    flexDirection: 'row',
    gap: 8,
  },
  binOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  binOptionSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  binOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  binOptionTextSelected: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  addressBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addressText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
  },
  coordinatesHeader: {
    marginBottom: 8,
  },
  coordinatesHeaderLeft: {
    flex: 1,
  },
  coordinatesSourceText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  coordinateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  coordinateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },
  coordinateButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  coordinateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  coordinateButtonTextDisabled: {
    color: '#9CA3AF',
  },
  coordinatesBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  coordinatesLabel: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesValue: {
    fontWeight: '400',
  },
  coordinatesTimestamp: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  optionButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  priorityButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#374151',
  },
  priorityTextSelected: {
    color: '#FFFFFF',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeText: {
    color: '#1F2937',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#16A34A',
  },
  submitButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default RequestModal;
