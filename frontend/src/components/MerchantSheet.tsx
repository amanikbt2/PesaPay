import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { MerchantDTO, APP_CONFIG } from '../shared';

interface MerchantSheetProps {
  visible: boolean;
  merchant: MerchantDTO | null;
  onClose: () => void;
  onProceedToConfirm: (amount: number) => void;
}

export const MerchantSheet: React.FC<MerchantSheetProps> = ({
  visible,
  merchant,
  onClose,
  onProceedToConfirm,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 540;
  const [amountStr, setAmountStr] = useState<string>('150'); // Default demo amount matching mockup

  if (!merchant) return null;

  const numericAmount = parseInt(amountStr, 10);
  const isValidAmount =
    !isNaN(numericAmount) &&
    numericAmount >= APP_CONFIG.MIN_AMOUNT_KES &&
    numericAmount <= APP_CONFIG.MAX_AMOUNT_KES;

  const handleChipPress = (value: number) => {
    setAmountStr(String(value));
  };

  const handleClear = () => {
    setAmountStr('');
  };

  const handleSubmit = () => {
    if (isValidAmount) {
      onProceedToConfirm(numericAmount);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.backdrop,
          isDesktop && styles.backdropDesktop,
        ]}
      >
        <View style={[
          styles.sheet,
          isDesktop && styles.sheetDesktop,
        ]}>
          {/* Header Bar */}
          <View style={styles.sheetHeader}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeIcon}>✓</Text>
              <Text style={styles.statusBadgeText}>QR Recognized</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Merchant Info Card */}
          <View style={styles.merchantContainer}>
            <View style={styles.storeIconCircle}>
              <Text style={styles.storeIcon}>🏪</Text>
            </View>
            <Text style={styles.merchantName}>{merchant.displayName}</Text>
            <Text style={styles.tillNumber}>TILL NO: {merchant.tillNumber}</Text>
          </View>

          {/* Amount Entry Section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Enter Amount</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>KSh</Text>
              <TextInput
                style={styles.input}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                autoFocus={false}
              />
              {amountStr.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Amount Chips */}
            <View style={styles.chipRow}>
              {APP_CONFIG.DEFAULT_QUICK_AMOUNTS.map((amt) => {
                const isSelected = amountStr === String(amt);
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleChipPress(amt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextActive]}
                    >
                      {amt.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Button */}
          <PrimaryButton
            title="Continue"
            onPress={handleSubmit}
            disabled={!isValidAmount}
            style={styles.actionButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetDesktop: {
    borderRadius: 28,
    paddingBottom: 28,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)' } as any)
      : {}),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  sheetHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
  },
  statusBadgeIcon: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  merchantContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  storeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
  },
  storeIcon: {
    fontSize: 28,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tillNumber: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  amountSection: {
    width: '100%',
    marginVertical: 18,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 18,
    height: 60,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    borderWidth: 0,
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          borderStyle: 'none',
        } as any)
      : {}),
  },
  clearButton: {
    padding: 6,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
  actionButton: {
    marginTop: 10,
  },
});
