import React, { memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Dog } from '../../types';
import { colors } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import { proxyImageUrl } from '../../services/imageProxy';

const IMG = 72;

interface Props {
  dog: Dog;
  onPress: (dog: Dog) => void;
  onReportLost?: (dog: Dog) => void;
  onReportIssue?: (dog: Dog) => void;
}

function formatLastSeen(dog: Dog): string {
  const at = dog.last_seen_at || dog.updated_at;
  if (!at) return '—';
  const d = new Date(at);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  return `${Math.floor(diff / 7)}w ago`;
}

/** True if the dog has an active health issue */
function hasIssue(dog: Dog): boolean {
  return ['sick', 'injured', 'critical'].includes(dog.health_status);
}

const SwipeableDogCard = memo<Props>(({ dog, onPress, onReportLost, onReportIssue }) => {
  const swipeRef = useRef<Swipeable>(null);
  const close = () => swipeRef.current?.close();

  const handlePress = useCallback(() => onPress(dog), [dog, onPress]);

  // ── Right actions: Report Issue (orange) ──────────────────────
  const renderRightActions = useCallback(
    (_prog: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0.7], extrapolate: 'clamp' });
      return (
        <Animated.View style={[styles.sideAction, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.issueBtn]}
            onPress={() => { close(); onReportIssue?.(dog); }}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={22} color="#fff" />
            <Text style={styles.actionLabel}>Report{'\n'}Issue</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [dog, onReportIssue],
  );

  // ── Left actions: Report Lost / Found Safe (red / green) ──────
  const renderLeftActions = useCallback(
    (_prog: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({ inputRange: [0, 100], outputRange: [0.7, 1], extrapolate: 'clamp' });
      const isLost = dog.is_lost;
      return (
        <Animated.View style={[styles.sideAction, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[styles.actionBtn, isLost ? styles.foundBtn : styles.lostBtn]}
            onPress={() => { close(); onReportLost?.(dog); }}
            activeOpacity={0.8}
          >
            <Ionicons name={isLost ? 'checkmark-circle' : 'alert-circle'} size={22} color="#fff" />
            <Text style={styles.actionLabel}>
              {isLost ? 'Found\nSafe' : 'Report\nLost'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [dog, onReportLost],
  );

  const issue = hasIssue(dog);
  const containerStyle = [
    styles.container,
    dog.is_lost && styles.borderLost,
    issue && !dog.is_lost && styles.borderIssue,
  ];

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={50}
      leftThreshold={50}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
    >
      <TouchableOpacity style={containerStyle} onPress={handlePress} activeOpacity={0.75}>
        {/* Image */}
        <View style={styles.imgWrap}>
          {dog.image_url ? (
            <Image source={{ uri: proxyImageUrl(dog.image_url) }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgPlaceholder]}>
              <Text style={{ fontSize: 32 }}>🐕</Text>
            </View>
          )}
          {dog.is_lost && (
            <View style={styles.lostBadge}>
              <Text style={styles.lostBadgeText}>LOST</Text>
            </View>
          )}
          {issue && !dog.is_lost && (
            <View style={styles.issueBadge}>
              <Text style={styles.issueBadgeText}>{dog.health_status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{dog.name || 'Unnamed Dog'}</Text>
            <Text style={styles.lastSeen}>{formatLastSeen(dog)}</Text>
          </View>

          <View style={styles.tags}>
            {dog.color && (
              <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.tagText}>{dog.color}</Text>
              </View>
            )}
            {dog.gender && dog.gender !== 'unknown' && (
              <View style={[styles.tag, dog.gender === 'male' ? { backgroundColor: '#DBEAFE' } : { backgroundColor: '#FCE7F3' }]}>
                <Text style={styles.tagText}>{dog.gender === 'male' ? 'Male' : 'Female'}</Text>
              </View>
            )}
            {dog.is_sterilized && (
              <View style={[styles.tag, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.tagText}>Sterilized</Text>
              </View>
            )}
          </View>

          {/* Swipe hint */}
          <View style={styles.hintRow}>
            <Ionicons name="arrow-back" size={10} color={colors.textLight} />
            <Text style={styles.hint}> Lost  ·  Issue </Text>
            <Ionicons name="arrow-forward" size={10} color={colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

SwipeableDogCard.displayName = 'SwipeableDogCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  // Status borders
  borderLost: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  borderIssue: {
    borderColor: '#FF9500',
    backgroundColor: '#FFFBF5',
  },

  imgWrap: { marginRight: 12, position: 'relative' },
  img: { width: IMG, height: IMG, borderRadius: 14, backgroundColor: colors.surface },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  lostBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FF3B30',
    paddingVertical: 2, borderRadius: 6, alignItems: 'center',
  },
  lostBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  issueBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FF9500',
    paddingVertical: 2, borderRadius: 6, alignItems: 'center',
  },
  issueBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  content: { flex: 1, minHeight: IMG, justifyContent: 'center' },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 6 },
  lastSeen: { fontSize: 11, color: colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.text },
  hintRow: { flexDirection: 'row', alignItems: 'center' },
  hint: { fontSize: 10, color: colors.textLight },

  // Action buttons
  sideAction: {
    justifyContent: 'center',
    marginVertical: 5,
  },
  actionBtn: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 4,
    marginHorizontal: 4,
    minHeight: 96,
  },
  lostBtn: { backgroundColor: '#FF3B30' },
  foundBtn: { backgroundColor: '#34C759' },
  issueBtn: { backgroundColor: '#FF9500' },
  actionLabel: {
    fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center',
  },
});

export default SwipeableDogCard;
