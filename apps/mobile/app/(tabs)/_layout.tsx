import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCamera = route.name === 'camera';

          const iconMap: Record<string, string> = {
            index: 'home',
            journal: 'book',
            camera: 'camera',
            goals: 'trending-up',
            community: 'people',
          };
          const iconName = (isFocused && !isCamera
            ? iconMap[route.name]
            : `${iconMap[route.name]}-outline`) as any;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCamera) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.cameraTabOuter}>
                <View style={[styles.cameraTab, Theme.glow.primary]}>
                  <Ionicons name="camera" size={26} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? '#FFFFFF' : Colors.textMuted}
              />
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="community" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBarBg,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  cameraTabOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  cameraTab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
