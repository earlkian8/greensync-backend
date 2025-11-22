import { View, Text, Modal, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';

const BinModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    qr_code: "",
    bin_type: "",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate QR code automatically when bin type is selected
  useEffect(() => {
    if (formData.bin_type) {
      const prefix = formData.bin_type.split(' ')[0].substring(0, 2).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const generatedQR = `${prefix}-BIN-${timestamp}${randomNum}`;
      setFormData(prev => ({ ...prev, qr_code: generatedQR }));
    }
  }, [formData.bin_type]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Bin name is required";
    }
    
    if (!formData.bin_type) {
      newErrors.bin_type = "Please select a bin type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Find backend value
      const selectedType = binTypes.find(t => t.value === formData.bin_type);
      const backendType = selectedType ? selectedType.backend : null;

      const payload = {
        name: formData.name.trim(),
        qr_code: formData.qr_code,
        bin_type: backendType,
        status: formData.status,
      };

      const success = await onSubmit(payload);

      // Only reset form and close modal if submission was successful
      if (success) {
        setFormData({
          name: "",
          qr_code: "",
          bin_type: "",
          status: "active",
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        qr_code: "",
        bin_type: "",
        status: "active",
      });
      setErrors({});
      onClose();
    }
  };

  // Map frontend bin types to backend values
  const binTypes = [
    { label: "Organic", value: "Organic", backend: "biodegradable" },
    { label: "General Waste", value: "General Waste", backend: "non-biodegradable" },
    { label: "Recyclable", value: "Recyclable", backend: "recyclable" },
    { label: "Hazardous", value: "Hazardous", backend: "hazardous" }
  ];

  const statuses = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Full", value: "full" },
    { label: "Damaged", value: "damaged" }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Register New Bin</Text>
            <Pressable 
              onPress={handleClose} 
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Bin Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Bin Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="e.g., Kitchen Organic Bin"
                style={[
                  styles.input,
                  errors.name && styles.inputError
                ]}
                placeholderTextColor="#9CA3AF"
                editable={!isSubmitting}
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
              <Text style={styles.helperText}>
                Give your bin a recognizable name
              </Text>
            </View>

            {/* Bin Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Bin Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {binTypes.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => handleChange("bin_type", type.value)}
                    disabled={isSubmitting}
                    style={[
                      styles.optionButton,
                      formData.bin_type === type.value && styles.optionButtonSelected,
                      errors.bin_type && formData.bin_type !== type.value && styles.optionButtonError
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.bin_type === type.value && styles.optionTextSelected
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
              <Text style={styles.helperText}>
                Select the type of waste this bin will collect
              </Text>
            </View>

            {/* Status */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Status <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {statuses.map((status) => (
                  <Pressable
                    key={status.value}
                    onPress={() => handleChange("status", status.value)}
                    disabled={isSubmitting}
                    style={[
                      styles.optionButton,
                      formData.status === status.value && styles.optionButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.status === status.value && styles.optionTextSelected
                    ]}>
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Auto-generated QR Code */}
            {formData.qr_code && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Generated QR Code
                </Text>
                <View style={styles.qrContainer}>
                  <View style={styles.qrContent}>
                    <Feather name="check-circle" size={18} color="#16A34A" />
                    <Text style={styles.qrText}>
                      {formData.qr_code}
                    </Text>
                  </View>
                  <Text style={styles.qrHelperText}>
                    This QR code will be automatically assigned to the bin
                  </Text>
                </View>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxContent}>
                <Feather name="info" size={16} color="#3B82F6" style={{ marginTop: 2 }} />
                <Text style={styles.infoBoxText}>
                  Make sure to print and attach the QR code to your bin after registration
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Registering...' : 'Register Bin'}
              </Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  optionButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  optionButtonError: {
    borderColor: '#FCA5A5',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  qrContainer: {
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
  },
  qrContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrText: {
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 8,
  },
  qrHelperText: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
  },
  infoBoxContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
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

export default BinModal;
