import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ChevronProps {
  side: 'left' | 'right';
  height?: number;
  width?: number;
}

/**
 * HP-signature angular blue chevron slash.
 * Derived from the HP wordmark's parallel slashes — sharp 0-radius.
 */
export default function Chevron({ side, height = 260, width = 36 }: ChevronProps) {
  return (
    <View
      style={[
        styles.chevron,
        { height, width },
        side === 'left' ? styles.left : styles.right,
      ]}
    >
      <View style={[styles.slash, { height: height * 1.4, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  chevron: {
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  left: { left: 0 },
  right: { right: 0 },
  slash: {
    backgroundColor: colors.primary,
    transform: [{ skewX: '-12deg' }, { translateX: -8 }],
    position: 'absolute',
    top: -40,
  },
});
