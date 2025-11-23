import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const getStatusStyle = (status) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'active':
        return { bg: styles.statusActiveBg, text: styles.statusActiveText };
      case 'inactive':
        return { bg: styles.statusInactiveBg, text: styles.statusInactiveText };
      case 'full':
        return { bg: styles.statusFullBg, text: styles.statusFullText };
      case 'damaged':
        return { bg: styles.statusDamagedBg, text: styles.statusDamagedText };
      default:
        return { bg: styles.statusDefaultBg, text: styles.statusDefaultText };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView edges={['bottom']} style={styles.safeAreaContainer}>
          <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bin Details</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={18} color="#374151" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          ) : bin ? (
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Edit Button */}
              {!isEditing && (
                <View style={styles.editButtonContainer}>
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    <View style={styles.editButtonContent}>
                      <Feather name="edit-2" size={16} color="#16a34a" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            {/* QR Code Display */}
            <View style={styles.qrSection}>
              <View style={styles.qrCard}>
                <QRCode
                  value={bin.qrCode}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Text style={styles.qrCodeText}>{bin.qrCode}</Text>
              <Text style={styles.qrHelperText}>Scan to access bin</Text>
            </View>

            {/* Bin Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Bin Name {isEditing && <Text style={styles.required}>*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <TextInput
                    value={editedBin.name}
                    onChangeText={(value) => handleChange("name", value)}
                    placeholder="Enter bin name"
                    style={[
                      styles.inputLarge,
                      errors.name && styles.inputError
                    ]}
                    placeholderTextColor="#9CA3AF"
                    editable={!isUpdating}
                  />
                  {errors.name && (
                    <View style={styles.errorContainer}>
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.name}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.binNameDisplay}>{bin.name}</Text>
              )}
            </View>

            {/* Bin Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Bin Type {isEditing && <Text style={styles.required}>*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <View style={styles.optionsContainer}>
                    {binTypes.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() => handleChange("bin_type", type.value)}
                        disabled={isUpdating}
                        style={[
                          styles.optionButtonLarge,
                          editedBin.bin_type === type.value && styles.optionButtonSelected,
                          errors.bin_type && editedBin.bin_type !== type.value && styles.optionButtonError
                        ]}
                      >
                        <Text style={[
                          styles.optionTextLarge,
                          editedBin.bin_type === type.value && styles.optionTextSelected
                        ]}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {errors.bin_type && (
                    <View style={styles.errorContainer}>
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.bin_type}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.binTypeBadge}>
                  <Text style={styles.binTypeText}>
                    {bin.binType}
                  </Text>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Status {isEditing && <Text style={styles.required}>*</Text>}
              </Text>
              {isEditing ? (
                <>
                  <View style={styles.optionsContainer}>
                    {statuses.map((status) => (
                      <Pressable
                        key={status.value}
                        onPress={() => handleChange("status", status.value)}
                        disabled={isUpdating}
                        style={[
                          styles.optionButtonLarge,
                          editedBin.status === status.value && styles.optionButtonSelected,
                          errors.status && editedBin.status !== status.value && styles.optionButtonError
                        ]}
                      >
                        <Text style={[
                          styles.optionTextLarge,
                          editedBin.status === status.value && styles.optionTextSelected
                        ]}>
                          {status.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {errors.status && (
                    <View style={styles.errorContainer}>
                      <Feather name="alert-circle" size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.status}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.statusBadge, getStatusStyle(bin.status).bg]}>
                  <Text style={[styles.statusText, getStatusStyle(bin.status).text]}>
                    {bin.status}
                  </Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Feather name="calendar" size={18} color="#16A34A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Collected</Text>
                  <Text style={styles.infoValue}>
                    {bin.lastCollected || 'Never'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <AntDesign name="clockcircleo" size={18} color="#16A34A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Registered</Text>
                  <Text style={styles.infoValue}>
                    {bin.registeredAt}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdate}
                  disabled={isUpdating}
                  style={[
                    styles.saveButton,
                    isUpdating && styles.saveButtonDisabled
                  ]}
                >
                  <Text style={styles.saveButtonText}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            )}

              {/* Delete Button */}
              {!isEditing && (
                <Pressable
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  <View style={styles.deleteButtonContent}>
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete Bin</Text>
                  </View>
                </Pressable>
              )}
            </ScrollView>
          ) : (
            <View style={styles.errorStateContainer}>
              <Feather name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.errorStateText}>Failed to load bin details</Text>
            </View>
          )}

          {/* Footer Button */}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeAreaContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  editButtonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 8,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 24,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  qrCodeText: {
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 16,
    fontSize: 16,
  },
  qrHelperText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputLarge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  binNameDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButtonLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionButtonError: {
    borderColor: '#FCA5A5',
  },
  optionTextLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  binTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
  },
  binTypeText: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusActiveBg: { backgroundColor: '#D1FAE5' },
  statusActiveText: { color: '#065F46' },
  statusInactiveBg: { backgroundColor: '#F3F4F6' },
  statusInactiveText: { color: '#374151' },
  statusFullBg: { backgroundColor: '#FED7AA' },
  statusFullText: { color: '#9A3412' },
  statusDamagedBg: { backgroundColor: '#FEE2E2' },
  statusDamagedText: { color: '#991B1B' },
  statusDefaultBg: { backgroundColor: '#F3F4F6' },
  statusDefaultText: { color: '#374151' },
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#16A34A',
  },
  saveButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginLeft: 4,
  },
  errorStateContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  errorStateText: {
    color: '#6B7280',
    marginTop: 12,
  },
});

export default BinDetailModal;
