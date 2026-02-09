import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

type IconSymbolProps = {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
};

export function IconSymbol({ name, size = 24, color = '#000', style }: IconSymbolProps) {
  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      <Text style={[styles.fallback, { fontSize: size * 0.6, color }]}>•</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  fallback: {},
});
