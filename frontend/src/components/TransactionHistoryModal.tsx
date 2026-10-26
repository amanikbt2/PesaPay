import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { apiClient } from '../api/client';
import { PaymentDTO } from '../shared';
import { SecondaryButton } from './SecondaryButton';

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 540;
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PaymentDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getHistory();
      setHistory(data);
    } catch {
      setError('Unable to load history. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: PaymentDTO }) => {
    const isSuccess = item.status === 'SUCCEEDED';
    const dateStr = new Date(item.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTopRow}>
          <Text style={styles.merchantTitle}>{item.merchantName}</Text>
          <Text style={[styles.amountText, isSuccess && styles.amountSuccess]}>
            KSh {item.amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.itemBottomRow}>
          <Text style={styles.dateText}>{dateStr} • Till {item.tillNumber}</Text>
          <View
            style={[
              styles.statusPill,
              isSuccess ? styles.statusSuccess : styles.statusOther,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isSuccess ? styles.statusTextSuccess : styles.statusTextOther,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {item.receiptNumber && (
          <Text style={styles.receiptText}>Receipt: {item.receiptNumber}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isDesktop && styles.backdropDesktop]}>
        <View style={[styles.card, isDesktop && styles.cardDesktop]}>
          <View style={styles.header}>
            <Text style={styles.title}>Transaction History</Text>
            <TouchableOpacity onPress={loadHistory} style={styles.refreshBtn}>
              <Text style={styles.refreshIcon}>↻</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadHistory} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed QR payments will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}

          <SecondaryButton
            title="Close"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      </View>
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
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 20,
    maxHeight: '85%',
    minHeight: 380,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  cardDesktop: {
    borderRadius: 28,
    maxWidth: 540,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)' } as any)
      : {}),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  refreshBtn: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 20,
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  merchantTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amountSuccess: {
    color: colors.primary,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusOther: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: colors.primary,
  },
  statusTextOther: {
    color: colors.error,
  },
  receiptText: {
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
  },
});
