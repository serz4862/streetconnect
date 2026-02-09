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
import { formatDistanceToNow } from 'date-fns';

interface DogCardProps {
  dog: Dog;
  onPress: (dog: Dog) => void;
}

const DogCard = memo<DogCardProps>(({ dog, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(dog);
  }, [dog, onPress]);

  const genderColor = dog.gender === 'male' ? colors.genderMale : 
                     dog.gender === 'female' ? colors.genderFemale : 
                     colors.genderUnknown;

  const healthColor = dog.health_status === 'healthy' ? colors.statusHealthy :
                     dog.health_status === 'sick' ? colors.statusSick :
                     dog.health_status === 'injured' ? colors.statusInjured :
                     colors.statusCritical;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: dog.image_url || 'https://via.placeholder.com/150' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{dog.name || 'Unnamed Dog'}</Text>
          {dog.last_seen_at && (
            <Text style={styles.lastSeen}>
              {formatDistanceToNow(new Date(dog.last_seen_at), { addSuffix: true })}
            </Text>
          )}
        </View>
        
        <View style={styles.tags}>
          {dog.color && (
            <View style={[styles.tag, styles.colorTag]}>
              <Text style={styles.tagText}>{dog.color}</Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: genderColor }]}>
            <Text style={styles.tagTextWhite}>{dog.gender}</Text>
          </View>
          {dog.is_sterilized && (
            <View style={[styles.tag, styles.sterilizedTag]}>
              <Text style={styles.tagText}>Sterilized</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
            <Text style={styles.healthText}>{dog.health_status}</Text>
          </View>
          {dog.last_fed_at && (
            <Text style={styles.fedText}>
              Fed {formatDistanceToNow(new Date(dog.last_fed_at), { addSuffix: true })}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

DogCard.displayName = 'DogCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  lastSeen: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  colorTag: {
    backgroundColor: colors.primaryLight,
  },
  sterilizedTag: {
    backgroundColor: colors.success + '20',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tagTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textTransform: 'capitalize',
  },
  fedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default DogCard;
