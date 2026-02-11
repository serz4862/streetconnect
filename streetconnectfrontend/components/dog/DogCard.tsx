import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Dog } from '../../types';
import { colors } from '../../constants';

const CARD_IMAGE_SIZE = 76;

interface DogCardProps {
  dog: Dog;
  onPress: (dog: Dog) => void;
}

function formatLastSeen(dog: Dog): string {
  const at = dog.last_seen_at || dog.updated_at;
  if (!at) return '—';
  const d = new Date(at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

const DogCard = memo<DogCardProps>(({ dog, onPress }) => {
  const handlePress = useCallback(() => onPress(dog), [dog, onPress]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageWrap}>
        {dog.image_url ? (
          <Image
            source={{ uri: dog.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🐕</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{dog.name || 'Unnamed Dog'}</Text>
          <Text style={styles.lastSeen}>Last seen {formatLastSeen(dog)}</Text>
        </View>
        <View style={styles.tags}>
          {dog.color && (
            <View style={[styles.tag, styles.tagColor]}>
              <Text style={styles.tagText}>{dog.color}</Text>
            </View>
          )}
          {dog.gender && dog.gender !== 'unknown' && (
            <View style={[styles.tag, styles.tagGender]}>
              <Text style={styles.tagText}>{dog.gender === 'male' ? 'Male' : 'Female'}</Text>
            </View>
          )}
          {dog.is_sterilized && (
            <View style={[styles.tag, styles.tagSterilized]}>
              <Text style={styles.tagText}>Sterilized</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

DogCard.displayName = 'DogCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  imageWrap: {
    marginRight: 14,
  },
  image: {
    width: CARD_IMAGE_SIZE,
    height: CARD_IMAGE_SIZE,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  content: {
    flex: 1,
    minHeight: CARD_IMAGE_SIZE,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  lastSeen: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagColor: {
    backgroundColor: '#FEF3C7',
  },
  tagGender: {
    backgroundColor: '#D1FAE5',
  },
  tagSterilized: {
    backgroundColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});

export default DogCard;
