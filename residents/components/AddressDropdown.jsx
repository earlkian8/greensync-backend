import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <Pressable
        onPress={() => !disabled && !loading && setIsOpen(true)}
        disabled={disabled || loading}
        style={[
          styles.pressable,
          error && styles.pressableError,
          (disabled || loading) && styles.pressableDisabled
        ]}
      >
        <View style={styles.pressableContent}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#6B7280" />
              <Text style={styles.loadingText}>Loading...</Text>
            </>
          ) : (
            <Text style={[styles.pressableText, selectedOption && styles.pressableTextSelected]}>
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{label}</Text>
                <Pressable onPress={() => setIsOpen(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>
            
            {options.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>
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
                    style={[
                      styles.optionItem,
                      value === item.id && styles.optionItemSelected
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionText,
                        value === item.id && styles.optionTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      {value === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                      )}
                    </View>
                  </Pressable>
                )}
                style={styles.flatList}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  required: {
    color: '#EF4444',
  },
  pressable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    width: '100%',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  pressableError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  pressableDisabled: {
    backgroundColor: '#F3F4F6',
  },
  pressableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressableText: {
    fontSize: 16,
    color: '#6B7280',
  },
  pressableTextSelected: {
    color: '#111827',
  },
  loadingText: {
    color: '#6B7280',
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  optionItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
  optionTextSelected: {
    color: '#15803D',
    fontWeight: '600',
  },
  flatList: {
    maxHeight: 384,
  },
});

export default AddressDropdown;

