import { View, Text, Animated } from "react-native";
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

  const bgColor = type === "success" 
    ? "bg-green-600" 
    : type === "error" 
    ? "bg-red-600" 
    : type === "warning"
    ? "bg-orange-600"
    : "bg-blue-600";

  const icon = type === "success" 
    ? "check-circle" 
    : type === "error" 
    ? "x-circle" 
    : type === "warning"
    ? "alert-circle"
    : "info";

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
      }}
    >
      <View className={`${bgColor} rounded-xl p-4 flex-row items-center shadow-lg`}>
        <Feather name={icon} size={20} color="white" />
        <Text className="text-white font-semibold ml-3 flex-1">{message}</Text>
      </View>
    </Animated.View>
  );
};

export default Toast;