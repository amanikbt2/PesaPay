import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme/colors';

interface ProcessingScreenProps {
  merchantName: string;
  amount: number;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  merchantName,
  amount,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerBox}>
        {/* Animated Spinner Ring */}
        <View style={styles.spinnerWrapper}>
          <Animated.View
            style={[
              styles.spinnerCircle,
              { transform: [{ rotate: spin }] },
            ]}
          />
        </View>

        <Text style={styles.title}>Processing Payment...</Text>
        <Text style={styles.subtitle}>
          Please wait while we confirm your payment of KSh {amount.toLocaleString()} to {merchantName}.
        </Text>

        <View style={styles.promptHintCard}>
          <Text style={styles.promptHintText}>
            📲 Check your phone screen for the Safaricom M-Pesa PIN prompt
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerBox: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
  },
  spinnerWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: 'rgba(0, 245, 155, 0.2)',
    borderTopColor: colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  promptHintCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  promptHintText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
