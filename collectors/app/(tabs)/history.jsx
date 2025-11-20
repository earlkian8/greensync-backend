import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock Data
const mockCollectionHistory = [
  {
    id: 1,
    qr_code: "QR-001-2024",
    waste_type: "Biodegradable",
    waste_weight: 5.2,
    collection_timestamp: "2024-11-08T09:30:00",
    collection_status: "completed",
    is_verified: true,
  },
  {
    id: 2,
    qr_code: "QR-002-2024",
    waste_type: "Non-Biodegradable",
    waste_weight: 3.8,
    collection_timestamp: "2024-11-08T10:15:00",
    collection_status: "completed",
    is_verified: true,
  },
  {
    id: 3,
    qr_code: "QR-003-2024",
    waste_type: "Recyclable",
    waste_weight: 7.5,
    collection_timestamp: "2024-11-08T11:00:00",
    collection_status: "pending",
    is_verified: false,
  },
  {
    id: 4,
    qr_code: "QR-004-2024",
    waste_type: "Biodegradable",
    waste_weight: 4.3,
    collection_timestamp: "2024-11-07T14:20:00",
    collection_status: "completed",
    is_verified: true,
  },
  {
    id: 5,
    qr_code: "QR-005-2024",
    waste_type: "Special Waste",
    waste_weight: 2.1,
    collection_timestamp: "2024-11-07T15:45:00",
    collection_status: "skipped",
    is_verified: false,
  },
  {
    id: 6,
    qr_code: "QR-006-2024",
    waste_type: "Recyclable",
    waste_weight: 6.9,
    collection_timestamp: "2024-11-06T08:30:00",
    collection_status: "completed",
    is_verified: true,
  },
];

export default function History() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCollections(mockCollectionHistory);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const filteredCollections = collections
    .filter(collection =>
      (filterStatus === 'all' || collection.collection_status === filterStatus) &&
      (collection.waste_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
       collection.qr_code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.collection_timestamp).getTime() - new Date(a.collection_timestamp).getTime());

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'skipped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">

        {/* Search and Filter */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search by waste type or QR code..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-2 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-row items-center mt-4">
            <View className="flex-row items-center mr-2">
              <Ionicons name="filter-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-1">Filter:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
              <TouchableOpacity
                className={`px-3 py-1 rounded-full mr-2 ${
                  filterStatus === 'all' ? 'bg-green-100' : 'bg-gray-100'
                }`}
                onPress={() => setFilterStatus('all')}
              >
                <Text className={`text-sm ${
                  filterStatus === 'all' ? 'text-green-700 font-medium' : 'text-gray-600'
                }`}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full mr-2 ${
                  filterStatus === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                }`}
                onPress={() => setFilterStatus('completed')}
              >
                <Text className={`text-sm ${
                  filterStatus === 'completed' ? 'text-green-700 font-medium' : 'text-gray-600'
                }`}>
                  Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full mr-2 ${
                  filterStatus === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}
                onPress={() => setFilterStatus('pending')}
              >
                <Text className={`text-sm ${
                  filterStatus === 'pending' ? 'text-yellow-700 font-medium' : 'text-gray-600'
                }`}>
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full ${
                  filterStatus === 'skipped' ? 'bg-red-100' : 'bg-gray-100'
                }`}
                onPress={() => setFilterStatus('skipped')}
              >
                <Text className={`text-sm ${
                  filterStatus === 'skipped' ? 'text-red-700 font-medium' : 'text-gray-600'
                }`}>
                  Skipped
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Collections List */}
        <View className="p-4">
          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : filteredCollections.length === 0 ? (
            <View className="items-center py-12 bg-white rounded-lg border border-gray-200">
              <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3 text-base">No collection history found</Text>
            </View>
          ) : (
            <View>
              {filteredCollections.map((collection, index) => (
                <View
                  key={collection.id}
                  className={`bg-white border border-gray-200 rounded-lg p-4 ${
                    index > 0 ? 'mt-3' : ''
                  }`}
                >
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <View className="p-2 rounded-full bg-green-100">
                          <Ionicons name="trash-outline" size={18} color="#16A34A" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="font-semibold text-gray-900 text-base">
                            {collection.waste_type}
                          </Text>
                          <Text className="text-sm text-gray-600 mt-0.5">
                            QR: {collection.qr_code}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row mt-3 gap-4">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                          <Text className="text-sm text-gray-500 ml-1">
                            {formatDate(collection.collection_timestamp)}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                          <Text className="text-sm text-gray-500 ml-1">
                            {formatTime(collection.collection_timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="items-end ml-2">
                      <View className={`px-3 py-1 rounded-full ${getStatusStyle(collection.collection_status)}`}>
                        <Text className="text-xs font-semibold uppercase">
                          {collection.collection_status}
                        </Text>
                      </View>
                      
                      <Text className="text-sm text-gray-700 mt-2 font-medium">
                        {collection.waste_weight} kg
                      </Text>

                      <View className="mt-2">
                        {collection.is_verified ? (
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                            <Text className="text-xs text-green-600 ml-1">Verified</Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">Pending</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}