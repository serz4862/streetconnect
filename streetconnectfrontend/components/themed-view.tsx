import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '../hooks/use-theme-color';

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ViewProps & {
  lightColor?: string;
  darkColor?: string;
}) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
