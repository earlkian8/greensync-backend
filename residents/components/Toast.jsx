import { View, Text, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import Feather from '@expo/vector-icons/Feather';

const Toast = ({ visible, message, type = "success", onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return '#16A34A';
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#EA580C';
      default:
        return '#2563EB';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-circle';
      default:
        return 'info';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={[styles.toast, { backgroundColor: getBgColor() }]}>
        <Feather name={getIcon()} size={20} color="white" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

export default Toast;
