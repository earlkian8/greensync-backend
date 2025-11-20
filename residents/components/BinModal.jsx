import { View, Text, Modal, Pressable, TextInput, ScrollView } from "react-native";
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
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Register New Bin</Text>
            <Pressable 
              onPress={handleClose} 
              className="p-2 active:bg-gray-100 rounded-full"
              disabled={isSubmitting}
            >
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView 
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
          >
            {/* Bin Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Bin Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="e.g., Kitchen Organic Bin"
                className={`border rounded-xl px-4 py-3 bg-gray-50 text-gray-800 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholderTextColor="#9CA3AF"
                editable={!isSubmitting}
              />
              {errors.name && (
                <View className="flex-row items-center mt-1.5">
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text className="text-red-500 text-xs ml-1">{errors.name}</Text>
                </View>
              )}
              <Text className="text-xs text-gray-500 mt-2">
                Give your bin a recognizable name
              </Text>
            </View>

            {/* Bin Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Bin Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {binTypes.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => handleChange("bin_type", type.value)}
                    disabled={isSubmitting}
                    className={`px-4 py-2.5 rounded-lg border ${
                      formData.bin_type === type.value
                        ? 'bg-green-600 border-green-600'
                        : errors.bin_type
                        ? 'bg-white border-red-300'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      formData.bin_type === type.value ? 'text-white' : 'text-gray-700'
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
              <Text className="text-xs text-gray-500 mt-2">
                Select the type of waste this bin will collect
              </Text>
            </View>

            {/* Status */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Status <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statuses.map((status) => (
                  <Pressable
                    key={status.value}
                    onPress={() => handleChange("status", status.value)}
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-lg border ${
                      formData.status === status.value
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      formData.status === status.value ? 'text-white' : 'text-gray-700'
                    }`}>
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Auto-generated QR Code */}
            {formData.qr_code && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Generated QR Code
                </Text>
                <View className="border border-green-300 rounded-xl px-4 py-3 bg-green-50">
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#16A34A" />
                    <Text className="text-green-700 font-semibold ml-2">
                      {formData.qr_code}
                    </Text>
                  </View>
                  <Text className="text-xs text-green-600 mt-1">
                    This QR code will be automatically assigned to the bin
                  </Text>
                </View>
              </View>
            )}

            {/* Info Box */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <View className="flex-row items-start">
                <Feather name="info" size={16} color="#3B82F6" style={{ marginTop: 2 }} />
                <Text className="text-xs text-blue-700 ml-2 flex-1">
                  Make sure to print and attach the QR code to your bin after registration
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-5 py-4 border-t border-gray-200 flex-row gap-3">
            <Pressable
              onPress={handleClose}
              disabled={isSubmitting}
              className="flex-1 border border-gray-300 rounded-xl py-3 active:bg-gray-50"
            >
              <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 rounded-xl py-3 ${
                isSubmitting ? 'bg-green-400' : 'bg-green-600 active:bg-green-700'
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isSubmitting ? 'Registering...' : 'Register Bin'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BinModal;