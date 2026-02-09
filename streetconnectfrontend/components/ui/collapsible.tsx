import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type CollapsibleProps = {
  title: string;
  children: React.ReactNode;
};

export function Collapsible({ title, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setOpen((o) => !o)} style={styles.header}>
        <Text style={styles.chevron}>{open ? '▼' : '▶'}</Text>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  chevron: { fontSize: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  content: { paddingLeft: 20 },
});
