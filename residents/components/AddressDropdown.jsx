import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AddressDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select...",
  error,
  loading = false,
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <View className="mb-4">
      <Text className="text-gray-700 mb-1 font-medium">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <Pressable
        onPress={() => !disabled && !loading && setIsOpen(true)}
        disabled={disabled || loading}
        className={`border ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } w-full rounded-lg p-3 flex-row items-center justify-between ${
          disabled || loading ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        <View className="flex-1 flex-row items-center">
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#6B7280" />
              <Text className="text-gray-500 ml-2 text-base">Loading...</Text>
            </>
          ) : (
            <Text className={`text-base ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedOption ? selectedOption.name : placeholder}
            </Text>
          )}
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </Pressable>

      {error && (
        <View className="flex-row items-center mt-1 bg-red-50 p-2 rounded">
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text className="text-red-600 text-xs flex-1">{error}</Text>
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable 
            className="bg-white rounded-t-3xl max-h-[80%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-800">{label}</Text>
                <Pressable onPress={() => setIsOpen(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            {options.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">
                  {loading ? 'Loading options...' : 'No options available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelect(item.id);
                      setIsOpen(false);
                    }}
                    className={`p-4 border-b border-gray-100 ${
                      value === item.id ? 'bg-green-50' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-base ${
                        value === item.id ? 'text-green-700 font-semibold' : 'text-gray-900'
                      }`}>
                        {item.name}
                      </Text>
                      {value === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                      )}
                    </View>
                  </Pressable>
                )}
                className="max-h-96"
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default AddressDropdown;

