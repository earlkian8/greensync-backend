import { View, Text, Pressable, StyleSheet } from "react-native";
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

    const binTypeIcon = getBinTypeIcon(bin.binType);
    
    const getStatusStyle = (status) => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case 'active':
                return { bg: styles.statusActiveBg, text: styles.statusActiveText, dot: styles.statusActiveDot };
            case 'inactive':
                return { bg: styles.statusInactiveBg, text: styles.statusInactiveText, dot: styles.statusInactiveDot };
            case 'full':
                return { bg: styles.statusFullBg, text: styles.statusFullText, dot: styles.statusFullDot };
            case 'damaged':
                return { bg: styles.statusDamagedBg, text: styles.statusDamagedText, dot: styles.statusDamagedDot };
            case 'maintenance':
                return { bg: styles.statusMaintenanceBg, text: styles.statusMaintenanceText, dot: styles.statusMaintenanceDot };
            default:
                return { bg: styles.statusDefaultBg, text: styles.statusDefaultText, dot: styles.statusDefaultDot };
        }
    };

    const statusStyle = getStatusStyle(bin.status);

    return (
        <Pressable 
            onPress={() => onPress(bin)}
            style={styles.card}
        >
            <View style={styles.cardContent}>
                {/* Icon */}
                <View 
                    style={[styles.iconContainer, { backgroundColor: binTypeIcon.color + '15' }]}
                >
                    <MaterialCommunityIcons 
                        name={binTypeIcon.name} 
                        size={24} 
                        color={binTypeIcon.color} 
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Bin Name */}
                    <Text style={styles.binName}>
                        {bin.name}
                    </Text>

                    {/* Bin Type Badge */}
                    <View style={styles.binTypeContainer}>
                        <View style={styles.binTypeBadge}>
                            <Text style={styles.binTypeText}>
                                {bin.binType}
                            </Text>
                        </View>
                    </View>

                    {/* QR Code & Status Row */}
                    <View style={styles.infoRow}>
                        {/* QR Code */}
                        <View style={styles.qrContainer}>
                            <Feather name="maximize-2" size={12} color="#9CA3AF" />
                            <Text style={styles.qrText} numberOfLines={1}>
                                {bin.qrCode}
                            </Text>
                        </View>

                        {/* Status */}
                        <View style={[styles.statusContainer, statusStyle.bg]}>
                            <View style={[styles.statusDot, statusStyle.dot]} />
                            <Text style={[styles.statusText, statusStyle.text]}>
                                {bin.status}
                            </Text>
                        </View>
                    </View>

                    {/* Last Collected */}
                    {bin.lastCollected !== 'Never' && (
                        <View style={styles.lastCollectedContainer}>
                            <Feather name="calendar" size={12} color="#9CA3AF" />
                            <Text style={styles.lastCollectedText}>
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

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    binName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    binTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    binTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#EFF6FF',
    },
    binTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E40AF',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    qrContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    qrText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        marginLeft: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 9999,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    statusActiveBg: { backgroundColor: '#D1FAE5' },
    statusActiveText: { color: '#065F46' },
    statusActiveDot: { backgroundColor: '#10B981' },
    statusInactiveBg: { backgroundColor: '#F3F4F6' },
    statusInactiveText: { color: '#374151' },
    statusInactiveDot: { backgroundColor: '#6B7280' },
    statusFullBg: { backgroundColor: '#FED7AA' },
    statusFullText: { color: '#9A3412' },
    statusFullDot: { backgroundColor: '#F97316' },
    statusDamagedBg: { backgroundColor: '#FEE2E2' },
    statusDamagedText: { color: '#991B1B' },
    statusDamagedDot: { backgroundColor: '#EF4444' },
    statusMaintenanceBg: { backgroundColor: '#FED7AA' },
    statusMaintenanceText: { color: '#9A3412' },
    statusMaintenanceDot: { backgroundColor: '#F97316' },
    statusDefaultBg: { backgroundColor: '#F3F4F6' },
    statusDefaultText: { color: '#374151' },
    statusDefaultDot: { backgroundColor: '#6B7280' },
    lastCollectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    lastCollectedText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
});

export default BinsCard;