import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  showLabel?: boolean;
}

/**
 * App brand logo (CSS-only placeholder matching Canva concept).
 *
 * To swap in a real PNG:
 *   1. Drop logo file at `apps/mobile/assets/logo.png` (1024×1024, transparent bg)
 *   2. Replace this whole component body with:
 *
 *      return (
 *        <Image source={require('../../../assets/logo.png')}
 *               style={{ width: size, height: size }} resizeMode="contain" />
 *      );
 */
export default function BrandLogo({ size = 140, showLabel = true }: Props) {
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.ring,
          {
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: (size * 0.86) / 2,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
            },
          ]}
        >
          <Text style={[styles.bowl, { fontSize: size * 0.34 }]}>🥗</Text>
        </View>
      </View>
      {showLabel ? (
        <Text style={[styles.label, { fontSize: size * 0.08 }]}>
          NUTRIDZ & HEALTH
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#1F6E3A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  ring: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: '#C4E58B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowl: { fontSize: 40 },
  label: {
    position: 'absolute',
    color: '#FFFFFF',
    fontWeight: '900',
    bottom: 10,
    letterSpacing: 1.5,
  },
});
