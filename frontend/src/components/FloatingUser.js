import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme, getShadow, getTextShadow } from '../utils/theme';

// Safer hashCode version
const getHashCode = (str) => {
    if (!str || typeof str !== 'string') return 0;
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const FUNKY_THOUGHTS = [
    "Wishing I had a samosa... 🥟",
    "Assignment is eating me alive 💀",
    "Did I leave the fan on? 🤨",
    "Need coffee. NOW. ☕",
    "Vibing to Lo-Fi beats 🎧",
    "Who wants to play Valorant? 🎮",
    "Waiting for a sign... or a sandwich 🥪",
    "Manifesting an A+ ✨",
    "Current mood: Low battery 🪫",
    "Just here for the lore 📚"
];

export default function FloatingUser({ user, onAction, containerWidth, containerHeight }) {
  const anim = useRef(new Animated.ValueXY({
    x: Math.random() * (containerWidth - 100),
    y: Math.random() * (containerHeight - 150)
  })).current;

  const opacity = useRef(new Animated.Value(0)).current;
  const thoughtScale = useRef(new Animated.Value(0)).current;

  // Stable thought selection based on user.id
  const thought = (user?.id) 
    ? FUNKY_THOUGHTS[Math.abs(getHashCode(user.id.toString()) % FUNKY_THOUGHTS.length)]
    : "Vibing in the lobby... 🫧";

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: false }).start();

    // Thought bubble pop in
    Animated.spring(thoughtScale, { toValue: 1, friction: 3, delay: 1000, useNativeDriver: false }).start();

    // Floating bubble drift animation loop
    const move = () => {
      Animated.timing(anim, {
        toValue: {
          x: Math.random() * (containerWidth - 100),
          y: Math.random() * (containerHeight - 150)
        },
        duration: 10000 + Math.random() * 5000,
        useNativeDriver: false
      }).start(() => move());
    };
    move();
  }, []);

  const color = (user?.id) ? COLORS[Math.abs(getHashCode(user.id.toString()) % COLORS.length)] : '#94A3B8';

  return (
    <Animated.View style={[styles.avatarWrap, { opacity, transform: anim.getTranslateTransform() }]}>
      {/* Thought Bubble */}
      <Animated.View style={[styles.thoughtWrap, { transform: [{ scale: thoughtScale }] }]}>
          <View style={styles.thoughtBubble}>
              <Text style={styles.thoughtText}>{thought}</Text>
          </View>
          <View style={styles.thoughtTail} />
      </Animated.View>

      <TouchableOpacity 
        style={[styles.avatar, { backgroundColor: color }]} 
        onPress={() => onAction(user)}
      >
        <Text style={styles.initials}>{user?.name?.charAt(0).toUpperCase() || '?'}</Text>
        <View style={styles.onlineDot} />
      </TouchableOpacity>
      <Text style={styles.name} numberOfLines={1}>{user?.name || 'Anonymous'}</Text>
    </Animated.View>
  );
}



const styles = StyleSheet.create({
  avatarWrap: { position: 'absolute', alignItems: 'center', width: 120 },
  avatar: { 
      width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center',
      ...getShadow('#000', { width: 0, height: 10 }, 0.4, 15, 15),
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)'
  },
  initials: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  name: { color: '#CBD5E1', fontSize: 12, fontWeight: '900', marginTop: 8, textAlign: 'center', ...getTextShadow('rgba(0,0,0,0.5)', { width: 1, height: 1 }, 2) },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#0A0F1E' },

  thoughtWrap: { position: 'absolute', top: -50, width: 150, alignItems: 'center' },
  thoughtBubble: {
      backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15,
      ...getShadow('#000', { width: 0, height: 4 }, 0.2, 5, 5)
  },
  thoughtText: { color: '#1E293B', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  thoughtTail: {
      width: 0, height: 0, 
      borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFF',
      marginTop: -1
  }
});
