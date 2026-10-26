import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { MerchantDTO } from '../shared';

interface ConfirmScreenProps {
  merchant: MerchantDTO;
  amount: number;
  loading: boolean;
  onBack: () => void;
  onConfirmAndPay: () => void;
}

export const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  merchant,
  amount,
  loading,
  onBack,
  onConfirmAndPay,
}) => {
  return (
    <View style={styles.container}>
      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Merchant Avatar */}
        <View style={styles.merchantHeader}>
          <View style={styles.storeIconCircle}>
            <Text style={styles.storeIcon}>🏪</Text>
          </View>
          <Text style={styles.merchantName}>{merchant.displayName}</Text>
          <Text style={styles.tillNumber}>TILL NO: {merchant.tillNumber}</Text>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>KSh {amount.toLocaleString()}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>{merchant.displayName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Till Number</Text>
            <Text style={styles.detailValue}>{merchant.tillNumber}</Text>
          </View>
        </View>

        {/* M-Pesa PIN Security Notice */}
        <View style={styles.securityNotice}>
          <View style={styles.securityBadge}>
            <Text style={styles.securityMpesaText}>M-PESA</Text>
          </View>
          <Text style={styles.securityText}>
            You will enter your M-Pesa PIN only on the official Safaricom payment prompt. PesaPay never asks for or stores your PIN.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Pay Now"
          onPress={onConfirmAndPay}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 16 : 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  merchantHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  storeIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
  },
  storeIcon: {
    fontSize: 32,
  },
  merchantName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tillNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginVertical: 16,
  },
  amountLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  securityNotice: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginVertical: 8,
  },
  securityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  securityMpesaText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  securityText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
});
