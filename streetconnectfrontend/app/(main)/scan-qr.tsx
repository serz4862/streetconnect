import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet,  TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDogs } from '../../hooks/useDogs';
import Button from '../../components/common/Button';
import { colors } from '../../constants';

export default function ScanQrScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { useScanQR } = useDogs();
  const scanQR = useScanQR();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);
    try {
      const res: any = await scanQR.mutateAsync(data);
      if (res?.dog) {
        router.replace(`/(main)/dog/${res.dog.id}`);
      }
    } catch (err: any) {
      if (err?.error === 'Invalid QR code' || err?.message?.includes('not found')) {
        router.push({ pathname: '/(main)/add-dog', params: { qr_data: data } });
      } else {
        setError(err?.error || err?.message || 'Scan failed');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>Camera permission is required to scan QR codes.</Text>
          <Button title="Grant Permission" variant="primary" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
      </View>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : (e) => handleBarCodeScanned({ data: e.data })}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <View style={styles.footer}>
        <Button title="Take Photo" variant="outline" onPress={() => router.push('/(main)/add-dog')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cameraWrap: { flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden' },
  camera: { flex: 1, width: '100%' },
  errorText: { color: colors.error, textAlign: 'center', padding: 16 },
  loadingWrap: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' },
  footer: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center' },
});
