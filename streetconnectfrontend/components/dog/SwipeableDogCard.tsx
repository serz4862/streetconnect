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

function hasIssue(dog: Dog): boolean {
  return ['sick', 'injured', 'critical'].includes(dog.health_status);
}

const SwipeableDogCard = memo<Props>(({ dog, onPress, onReportLost, onReportIssue }) => {
  const swipeRef = useRef<Swipeable>(null);

  /**
   * All mutable values are stored in refs so that:
   * 1. Action button callbacks have zero deps (stable functions, no re-registration)
   * 2. They always read the LATEST dog/callback values when a gesture fires
   */
  const dogRef = useRef(dog);
  const onPressRef = useRef(onPress);
  const onReportLostRef = useRef(onReportLost);
  const onReportIssueRef = useRef(onReportIssue);

  // Update refs synchronously on every render so they're always current
  dogRef.current = dog;
  onPressRef.current = onPress;
  onReportLostRef.current = onReportLost;
  onReportIssueRef.current = onReportIssue;

  // Stable close helper
  const close = useCallback(() => swipeRef.current?.close(), []);

  // Stable press handler
  const handlePress = useCallback(() => {
    onPressRef.current(dogRef.current);
  }, []);

  // ── Right: Report Issue (swipe LEFT to reveal) ────────────────
  const renderRightActions = useCallback(
    (_prog: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({ inputRange: [-120, 0], outputRange: [1, 0.75], extrapolate: 'clamp' });
      return (
        <Animated.View style={[styles.sideAction, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.issueBtn]}
            onPress={() => {
              swipeRef.current?.close();
              onReportIssueRef.current?.(dogRef.current);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={22} color="#fff" />
            <Text style={styles.actionLabel}>Report{'\n'}Issue</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [], // Stable — reads latest values via refs at gesture time
  );

  // ── Left: Report Lost / Found Safe (swipe RIGHT to reveal) ───
  const renderLeftActions = useCallback(
    (_prog: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({ inputRange: [0, 120], outputRange: [0.75, 1], extrapolate: 'clamp' });
      const isLost = dogRef.current.is_lost;
      return (
        <Animated.View style={[styles.sideAction, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={[styles.actionBtn, isLost ? styles.foundBtn : styles.lostBtn]}
            onPress={() => {
              swipeRef.current?.close();
              onReportLostRef.current?.(dogRef.current);
            }}
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
    [], // Stable — reads latest values via refs at gesture time
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
      rightThreshold={40}
      leftThreshold={40}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity style={containerStyle} onPress={handlePress} activeOpacity={0.75}>
        {/* Image */}
        <View style={styles.imgWrap}>
          {dog.image_url ? (
            <Image
              source={{ uri: proxyImageUrl(dog.image_url) }}
              style={styles.img}
              resizeMode="cover"
            />
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
            <Ionicons name="chevron-back" size={11} color={colors.textLight} />
            <Text style={styles.hint}> Lost  ·  Issue </Text>
            <Ionicons name="chevron-forward" size={11} color={colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

SwipeableDogCard.displayName = 'SwipeableDogCard';

const styles = StyleSheet.create({
  swipeContainer: {
    marginHorizontal: 16,
    marginVertical: 5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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

  sideAction: {
    justifyContent: 'center',
  },
  actionBtn: {
    width: 80,
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
