import { View, Text, Pressable } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const BinsCard = ({ bin, onPress }) => {
    // Guard clause to prevent undefined errors
    if (!bin) return null;
    
    const getBinTypeIcon = (type) => {
        const lowerType = type.toLowerCase();
        switch (lowerType) {
            case 'organic':
                return { name: 'leaf', color: '#16A34A' };
            case 'general waste':
                return { name: 'trash-can', color: '#6B7280' };
            case 'recyclable':
                return { name: 'recycle', color: '#3B82F6' };
            case 'hazardous':
                return { name: 'biohazard', color: '#EF4444' };
            default:
                return { name: 'trash-can', color: '#6B7280' };
        }
    };

    const getStatusColor = (status) => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case 'active':
                return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
            case 'inactive':
                return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
            case 'full':
                return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
            case 'damaged':
                return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
            case 'maintenance':
                return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
        }
    };

    const binTypeIcon = getBinTypeIcon(bin.binType);
    const statusColor = getStatusColor(bin.status);
    
    return (
        <Pressable 
            onPress={() => onPress(bin)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden active:bg-gray-50"
        >
            <View className="flex-row items-start p-4">
                {/* Icon */}
                <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: binTypeIcon.color + '15' }}
                >
                    <MaterialCommunityIcons 
                        name={binTypeIcon.name} 
                        size={24} 
                        color={binTypeIcon.color} 
                    />
                </View>

                {/* Content */}
                <View className="flex-1">
                    {/* Bin Name */}
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                        {bin.name}
                    </Text>

                    {/* Bin Type Badge */}
                    <View className="flex-row items-center mb-2">
                        <View className="px-2.5 py-1 rounded-md bg-blue-50">
                            <Text className="text-xs font-semibold text-blue-700">
                                {bin.binType}
                            </Text>
                        </View>
                    </View>

                    {/* QR Code & Status Row */}
                    <View className="flex-row items-center justify-between">
                        {/* QR Code */}
                        <View className="flex-row items-center flex-1">
                            <Feather name="maximize-2" size={12} color="#9CA3AF" />
                            <Text className="text-xs text-gray-500 ml-1.5" numberOfLines={1}>
                                {bin.qrCode}
                            </Text>
                        </View>

                        {/* Status */}
                        <View className={`flex-row items-center px-2.5 py-1 rounded-full ${statusColor.bg} ml-2`}>
                            <View className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} mr-1.5`} />
                            <Text className={`text-xs font-medium capitalize ${statusColor.text}`}>
                                {bin.status}
                            </Text>
                        </View>
                    </View>

                    {/* Last Collected */}
                    {bin.lastCollected !== 'Never' && (
                        <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                            <Feather name="calendar" size={12} color="#9CA3AF" />
                            <Text className="text-xs text-gray-500 ml-1.5">
                                Last collected: {bin.lastCollected}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Arrow */}
                <Feather name="chevron-right" size={20} color="#D1D5DB" style={{ marginLeft: 8 }} />
            </View>
        </Pressable>
    );
}

export default BinsCard;