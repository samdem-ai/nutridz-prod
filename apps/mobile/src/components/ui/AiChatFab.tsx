import { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const HIDE_ON_PATHS = ['/chat', '/barcode', '/(tabs)/camera', '/camera'];

export default function AiChatFab() {
  const router = useRouter();
  const pathname = usePathname();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
  }, []);

  if (HIDE_ON_PATHS.some((p) => pathname?.startsWith(p))) return null;

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <TouchableOpacity
        onPress={() => router.push('/chat' as any)}
        activeOpacity={0.85}
        style={styles.touch}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.label}>IA</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 105,
    left: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  touch: { borderRadius: 32 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: -1,
    letterSpacing: 0.5,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
