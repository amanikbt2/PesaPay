import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { PaymentDTO } from '../shared';

interface SuccessScreenProps {
  payment: PaymentDTO;
  onDone: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  payment,
  onDone,
}) => {
  const formattedDate = new Date(payment.completedAt || payment.createdAt).toLocaleString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon Badge */}
        <View style={styles.iconCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.amount}>
          KSh {payment.amount.toLocaleString()}
        </Text>

        {/* Receipt Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Merchant</Text>
            <Text style={styles.value}>{payment.merchantName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Till No.</Text>
            <Text style={styles.value}>{payment.tillNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.value}>
              {payment.receiptNumber || payment.id.slice(0, 10).toUpperCase()}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date &amp; Time</Text>
            <Text style={styles.value}>{formattedDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Done" onPress={onDone} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIcon: {
    color: '#0B0F19',
    fontSize: 48,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
