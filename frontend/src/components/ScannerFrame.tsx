import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface ScannerFrameProps {
  torchOn: boolean;
  onToggleTorch: () => void;
  onOpenManualInput?: () => void;
  onOpenHistory?: () => void;
  onOpenProfile?: () => void;
  onSelectRecentMerchant?: (payload: string) => void;
  brandName?: string;
}

export const ScannerFrame: React.FC<ScannerFrameProps> = ({
  torchOn,
  onToggleTorch,
  onOpenManualInput,
  onOpenHistory,
  onOpenProfile,
  onSelectRecentMerchant,
  brandName = 'CampusPay',
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive screen calculations
  const availableHeight = height - insets.top - insets.bottom;
  const isCompact = availableHeight < 680;
  const isVeryCompact = availableHeight < 560;
  const isWide = width > 520;

  // Proportional frame sizing: scales gracefully across small, medium, and large devices
  const maxByHeight = Math.floor(
    availableHeight * (isVeryCompact ? 0.28 : isCompact ? 0.32 : 0.36)
  );
  const maxByWidth = Math.floor(width * (isWide ? 0.45 : 0.70));
  const frameSize = Math.max(170, Math.min(maxByHeight, maxByWidth, 280));

  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    lineAnim.setValue(0);
    const isWeb = Platform.OS === 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: frameSize - 8,
          duration: 2200,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: !isWeb,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [frameSize, lineAnim]);

  return (
    <View style={styles.container}>
      {/* 1. Protected Top Header Bar with Glassmorphic Scrim */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: Platform.OS === 'web' ? 4 : Math.max(insets.top, 6),
            paddingHorizontal: isWide ? 20 : 12,
          },
        ]}
      >
        <View style={styles.headerGlassCard}>
          {/* Brand Group */}
          <View style={styles.brandGroup}>
            <View style={styles.logoHalo}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>{brandName}</Text>
              {!isVeryCompact && (
                <Text style={styles.tagline}>SCAN. PAY. DONE.</Text>
              )}
            </View>
          </View>

          {/* Action Buttons: History (Clock) & Profile (User) */}
          <View style={styles.headerActions}>
            {onOpenHistory && (
              <TouchableOpacity
                style={styles.actionCircleButton}
                onPress={onOpenHistory}
                activeOpacity={0.7}
                accessibilityLabel="Transaction History"
              >
                {/* Vector Clock */}
                <View style={styles.clockCircle}>
                  <View style={styles.clockHourHand} />
                  <View style={styles.clockMinuteHand} />
                </View>
              </TouchableOpacity>
            )}

            {onOpenProfile && (
              <TouchableOpacity
                style={styles.actionCircleButton}
                onPress={onOpenProfile}
                activeOpacity={0.7}
                accessibilityLabel="User Profile"
              >
                {/* Vector Profile */}
                <View style={styles.profileIconWrap}>
                  <View style={styles.profileHead} />
                  <View style={styles.profileShoulders} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 2. Responsive Center Viewfinder Area */}
      <View style={styles.centerSection}>
        {/* Dynamic Frame Container */}
        <View
          style={[
            styles.frameContainer,
            {
              width: frameSize,
              height: frameSize,
              borderRadius: Math.min(28, frameSize * 0.1),
            },
          ]}
        >
          {/* 4 Glowing Neon Mint Corner Brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Center Target Aiming Dot */}
          <View style={styles.aimingDotWrapper}>
            <View style={styles.aimingDotHalo} />
            <View style={styles.aimingDot} />
          </View>

          {/* Animated Neon Mint Scanning Laser Beam */}
          <Animated.View
            style={[
              styles.laserWrapper,
              { transform: [{ translateY: lineAnim }] },
            ]}
          >
            <View style={styles.laserLine} />
            <View style={styles.laserBeamGlow} />
          </Animated.View>
        </View>

        {/* Floating Instruction Badge */}
        <View
          style={[
            styles.instructionBadge,
            { marginTop: isCompact ? 8 : 12 },
          ]}
        >
          <View style={styles.miniQrIcon}>
            <View style={styles.miniQrDot} />
          </View>
          <Text style={styles.scanInstruction}>
            Point camera at Safaricom Till QR code
          </Text>
        </View>
      </View>

      {/* 3. Protected Bottom Controls Deck with Glassmorphic Scrim */}
      <View
        style={[
          styles.bottomDeck,
          {
            paddingBottom: Math.max(insets.bottom, 12) + (isCompact ? 4 : 8),
            paddingHorizontal: isWide ? 24 : 16,
          },
        ]}
      >
        {/* Action Controls: Torch + Enter Till Manually */}
        <View style={styles.actionRow}>
          {/* Flashlight / Torch squircle button */}
          <TouchableOpacity
            style={[
              styles.torchButton,
              torchOn && styles.torchButtonActive,
            ]}
            onPress={onToggleTorch}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Flashlight"
          >
            <Text style={[styles.torchIcon, torchOn && styles.torchIconActive]}>
              🔦
            </Text>
          </TouchableOpacity>

          {/* Primary High-Contrast Neon "Enter Till Manually" button */}
          {onOpenManualInput && (
            <TouchableOpacity
              style={styles.manualCodeButton}
              onPress={onOpenManualInput}
              activeOpacity={0.8}
            >
              <Text style={styles.keyboardGlyph}>⌨</Text>
              <Text style={styles.manualCodeText}>Enter Till Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },

  // 1. Top Header Glass Deck
  headerContainer: {
    width: '100%',
    zIndex: 12,
  },
  headerGlassCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    backgroundColor: 'rgba(9, 16, 26, 0.78)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 4,
        }),
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoHalo: {
    ...(Platform.OS === 'web'
      ? ({ filter: 'drop-shadow(0 0 8px rgba(0, 245, 155, 0.5))' } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.55,
          shadowRadius: 8,
        }),
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 245, 155, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 245, 155, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '900',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 32, 48, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Clock vector icon
  clockCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockHourHand: {
    position: 'absolute',
    width: 1.5,
    height: 4.5,
    backgroundColor: '#CBD5E1',
    top: 2.5,
    left: 6.75,
  },
  clockMinuteHand: {
    position: 'absolute',
    width: 3.5,
    height: 1.5,
    backgroundColor: '#CBD5E1',
    top: 6.75,
    left: 6.75,
  },

  // Profile vector icon
  profileIconWrap: {
    width: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHead: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 1,
  },
  profileShoulders: {
    width: 13,
    height: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#CBD5E1',
  },

  // 2. Responsive Center Section
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    zIndex: 11,
  },
  frameContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.22)',
    backgroundColor: 'rgba(8, 14, 22, 0.52)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 0 36px rgba(0, 245, 155, 0.2), inset 0 0 24px rgba(0, 245, 155, 0.05)',
        } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 20,
          elevation: 6,
        }),
  },

  // 4 Corner Brackets
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    ...(Platform.OS === 'web'
      ? ({ filter: 'drop-shadow(0 0 6px #00F59B)' } as any)
      : {}),
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },

  // Aiming Dot
  aimingDotWrapper: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  aimingDotHalo: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 245, 155, 0.22)',
  },
  aimingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 10px #00F59B' } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
        }),
  },

  // Laser beam
  laserWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  laserLine: {
    height: 2.5,
    width: '100%',
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 12px #00F59B' } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
          elevation: 5,
        }),
  },
  laserBeamGlow: {
    height: 28,
    width: '100%',
    backgroundColor: 'rgba(0, 245, 155, 0.08)',
  },

  // Instruction Badge
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(12, 22, 34, 0.88)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.22)',
    maxWidth: '92%',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(12px)' } as any)
      : {}),
  },
  miniQrIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniQrDot: {
    width: 5,
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  scanInstruction: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // 3. Bottom Controls Deck
  bottomDeck: {
    width: '100%',
    backgroundColor: 'rgba(9, 16, 26, 0.88)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    zIndex: 12,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.5)',
        } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 6,
        }),
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  torchButton: {
    width: 54,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 28, 40, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  torchButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 16px rgba(0, 245, 155, 0.5)' } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 10,
        }),
  },
  torchIcon: {
    fontSize: 20,
  },
  torchIconActive: {
    // Torch icon active
  },
  manualCodeButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 6px 20px rgba(0, 245, 155, 0.42)' } as any)
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.55,
          shadowRadius: 14,
          elevation: 6,
        }),
  },
  keyboardGlyph: {
    fontSize: 16,
    color: colors.textDark,
  },
  manualCodeText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
