import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

type ParallaxScrollViewProps = {
  headerBackgroundColor?: { light?: string; dark?: string };
  headerImage?: React.ReactNode;
  children: React.ReactNode;
};

export default function ParallaxScrollView({
  headerImage,
  children,
}: ParallaxScrollViewProps) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {headerImage ? <View style={styles.header}>{headerImage}</View> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  header: { marginBottom: 16 },
  body: { paddingHorizontal: 16 },
});
