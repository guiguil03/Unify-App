import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryCircleProps {
  imageUrl: string;
  username: string;
  onPress: () => void;
  seen?: boolean;
}

export function StoryCircle({ imageUrl, username, onPress, seen = false }: StoryCircleProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={seen ? ['#8e8e8e', '#8e8e8e'] : ['#833ab4', '#fd1d1d', '#fcb045']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
          />
        </View>
      </LinearGradient>
      <Text style={styles.username} numberOfLines={1}>
        {username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  gradientBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  username: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
});