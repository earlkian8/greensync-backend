import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from "@expo/vector-icons/AntDesign";
import { MapPin } from "lucide-react-native";
import { fetchCollectionRequestDetails, deleteCollectionRequest } from "@/services/requestService";

const RequestDetailModal = ({ visible, onClose, requestId, onDelete }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible && requestId) {
      loadRequestDetails();
    }
  }, [visible, requestId]);

  const loadRequestDetails = async () => {
    setLoading(true);
    const result = await fetchCollectionRequestDetails(requestId);
    if (result.success) {
      setRequest(result.data);
    }
    setLoading(false);
  };

  // Capitalize helper
  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  // Format status - handle in_progress
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    const statusLower = status.toLowerCase();
    if (statusLower === 'in_progress') return 'In Progress';
    return capitalize(status);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: styles.statusPendingBg, text: styles.statusPendingText, border: styles.statusPendingBorder };
      case 'assigned':
        return { bg: styles.statusAssignedBg, text: styles.statusAssignedText, border: styles.statusAssignedBorder };
      case 'in_progress':
      case 'in progress':
        return { bg: styles.statusInProgressBg, text: styles.statusInProgressText, border: styles.statusInProgressBorder };
      case 'completed':
        return { bg: styles.statusCompletedBg, text: styles.statusCompletedText, border: styles.statusCompletedBorder };
      case 'cancelled':
        return { bg: styles.statusCancelledBg, text: styles.statusCancelledText, border: styles.statusCancelledBorder };
      default:
        return { bg: styles.statusDefaultBg, text: styles.statusDefaultText, border: styles.statusDefaultBorder };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { bg: styles.priorityUrgentBg, text: styles.priorityUrgentText };
      case 'high':
        return { bg: styles.priorityHighBg, text: styles.priorityHighText };
      case 'medium':
        return { bg: styles.priorityMediumBg, text: styles.priorityMediumText };
      case 'low':
        return { bg: styles.priorityLowBg, text: styles.priorityLowText };
      default:
        return { bg: styles.priorityDefaultBg, text: styles.priorityDefaultText };
    }
  };

  // Check if request can be deleted
  const canDelete = () => {
    if (!request) return false;
    const status = request.status?.toLowerCase();
    return ['pending', 'cancelled', 'completed'].includes(status);
  };

  const handleDelete = () => {
    if (!request) return;
    
    Alert.alert(
      "Delete Request",
      `Are you sure you want to delete this ${formatStatus(request.status).toLowerCase()} request? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteCollectionRequest(request.id);
              if (result.success) {
                if (onDelete) {
                  onDelete(request.id);
                }
                onClose();
              } else {
                Alert.alert("Error", result.error || "Failed to delete request");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete request");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const formatRequestType = (type) => {
    const types = {
      regular: { label: 'Regular Collection', icon: 'trash-2' },
      special: { label: 'Special Collection', icon: 'star' },
      bulk: { label: 'Bulk Collection', icon: 'package' },
      emergency: { label: 'Emergency Collection', icon: 'alert-circle' }
    };
    return types[type?.toLowerCase()] || { label: type, icon: 'file' };
  };

  const formatWasteType = (type) => {
    return type?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Not set';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Not available';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusStyles = getStatusStyle(request?.status);
  const priorityStyles = getPriorityStyle(request?.priority);
  const requestType = formatRequestType(request?.request_type);

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
            <Text style={styles.headerTitle}>Request Details</Text>
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
          ) : request ? (
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Status Badge */}
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, statusStyles.bg, statusStyles.border]}>
                  <Text style={[styles.statusText, statusStyles.text]}>
                    {formatStatus(request.status)}
                  </Text>
                </View>
              </View>

              {/* Request Type & Priority */}
              <View style={styles.requestTypeCard}>
                <View style={styles.requestTypeRow}>
                  <Feather name={requestType.icon} size={20} color="#16a34a" />
                  <Text style={styles.requestTypeLabel}>
                    {capitalize(requestType.label)}
                  </Text>
                </View>
                
                <View style={styles.priorityRow}>
                  <MapPin size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <View style={[styles.priorityBadge, priorityStyles.bg]}>
                    <Text style={[styles.priorityText, priorityStyles.text]}>
                      {capitalize(request.priority)} Priority
                    </Text>
                  </View>
                </View>
              </View>

              {/* Waste Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Waste Information
                </Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, styles.infoIconGreen]}>
                      <Feather name="trash-2" size={18} color="#16a34a" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Waste Type</Text>
                      <Text style={styles.infoValue}>
                        {capitalize(formatWasteType(request.waste_type))}
                      </Text>
                    </View>
                  </View>

                  {request.waste_bin && (
                    <View style={[styles.infoRow, styles.infoRowBorder]}>
                      <View style={[styles.infoIcon, styles.infoIconBlue]}>
                        <Feather name="inbox" size={18} color="#2563eb" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Bin Location</Text>
                        <Text style={styles.infoValue}>
                          {request.waste_bin.location || 'No location specified'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Schedule */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Preferred Schedule
                </Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, styles.infoIconPurple]}>
                      <Feather name="calendar" size={18} color="#9333ea" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(request.preferred_date)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={[styles.infoIcon, styles.infoIconOrange]}>
                      <Feather name="clock" size={18} color="#ea580c" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>
                        {formatTime(request.preferred_time)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Description */}
              {request.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Description
                  </Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.descriptionText}>
                      {request.description}
                    </Text>
                  </View>
                </View>
              )}

              {/* Image */}
              {request.image_url && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Attached Image
                  </Text>
                  <View style={styles.imageContainer}>
                    <Feather name="image" size={20} color="#6B7280" />
                    <Text style={styles.imageText} numberOfLines={1}>
                      {request.image_url}
                    </Text>
                  </View>
                </View>
              )}

              {/* Metadata */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Request Information
                </Text>
                <View style={styles.infoCard}>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Request ID</Text>
                    <Text style={styles.metadataValue}>#{request.id}</Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Created</Text>
                    <Text style={styles.metadataValue}>
                      {formatDateTime(request.created_at)}
                    </Text>
                  </View>
                  {request.updated_at && request.updated_at !== request.created_at && (
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataLabel}>Last Updated</Text>
                      <Text style={styles.metadataValue}>
                        {formatDateTime(request.updated_at)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorStateContainer}>
              <Feather name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.errorStateText}>Failed to load request details</Text>
            </View>
          )}

          {/* Footer Buttons */}
          {!loading && request && (
            <View style={styles.footer}>
              {canDelete() && (
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleting ? 'Deleting...' : 'Delete Request'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={[styles.closeFooterButton, canDelete() && styles.closeFooterButtonWithDelete]}
              >
                <Text style={styles.closeFooterButtonText}>
                  Close
                </Text>
              </Pressable>
            </View>
          )}
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
  statusContainer: {
    marginTop: 20,
  },
  statusBadge: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPendingBg: { backgroundColor: '#FEF3C7' },
  statusPendingText: { color: '#92400E' },
  statusPendingBorder: { borderColor: '#FDE68A' },
  statusAssignedBg: { backgroundColor: '#DBEAFE' },
  statusAssignedText: { color: '#1E40AF' },
  statusAssignedBorder: { borderColor: '#BFDBFE' },
  statusInProgressBg: { backgroundColor: '#E9D5FF' },
  statusInProgressText: { color: '#6B21A8' },
  statusInProgressBorder: { borderColor: '#DDD6FE' },
  statusCompletedBg: { backgroundColor: '#D1FAE5' },
  statusCompletedText: { color: '#065F46' },
  statusCompletedBorder: { borderColor: '#A7F3D0' },
  statusCancelledBg: { backgroundColor: '#FEE2E2' },
  statusCancelledText: { color: '#991B1B' },
  statusCancelledBorder: { borderColor: '#FECACA' },
  statusDefaultBg: { backgroundColor: '#F3F4F6' },
  statusDefaultText: { color: '#374151' },
  statusDefaultBorder: { borderColor: '#E5E7EB' },
  requestTypeCard: {
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  requestTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTypeLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityUrgentBg: { backgroundColor: '#FEE2E2' },
  priorityUrgentText: { color: '#991B1B' },
  priorityHighBg: { backgroundColor: '#FED7AA' },
  priorityHighText: { color: '#9A3412' },
  priorityMediumBg: { backgroundColor: '#FEF3C7' },
  priorityMediumText: { color: '#92400E' },
  priorityLowBg: { backgroundColor: '#DBEAFE' },
  priorityLowText: { color: '#1E40AF' },
  priorityDefaultBg: { backgroundColor: '#F3F4F6' },
  priorityDefaultText: { color: '#374151' },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRowBorder: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 0,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIconGreen: { backgroundColor: '#D1FAE5' },
  infoIconBlue: { backgroundColor: '#DBEAFE' },
  infoIconPurple: { backgroundColor: '#E9D5FF' },
  infoIconOrange: { backgroundColor: '#FED7AA' },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  descriptionText: {
    color: '#374151',
    lineHeight: 24,
  },
  imageContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataLabel: {
    color: '#6B7280',
  },
  metadataValue: {
    fontWeight: '600',
    color: '#1F2937',
  },
  errorStateContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  errorStateText: {
    color: '#6B7280',
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32, // Extra padding to avoid bottom navigation
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeFooterButtonWithDelete: {
    flex: 1,
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RequestDetailModal;
