import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ManualQrModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPayload: (payload: string) => void;
}

export const ManualQrModal: React.FC<ManualQrModalProps> = ({
  visible,
  onClose,
  onSelectPayload,
}) => {
  const [customText, setCustomText] = useState('');

  const PRESETS = [
    {
      label: 'Mess Hall (Till: 78901)',
      payload: 'pesapay://pay?till=78901&ref=MESS_HALL&name=Mess+Hall',
    },
    {
      label: 'Bookshop (Till: 55432)',
      payload: 'pesapay://pay?till=55432&ref=CAMPUS_BOOKSHOP&name=Bookshop',
    },
    {
      label: 'Campus Kiosk (Till: 123456)',
      payload: 'pesapay://pay?till=123456&ref=CAMPUS_KIOSK&name=Campus+Kiosk',
    },
    {
      label: 'Science Cafeteria (Till: 567890)',
      payload: 'pesapay://pay?till=567890&ref=CAMPUS_CAFE&name=Science+Cafeteria',
    },
    {
      label: 'Student Bookshop (Till: 882211)',
      payload: 'MPESA:TILL:882211',
    },
    {
      label: 'Unverified Shop (Till: 999000 - Test Reject)',
      payload: 'pesapay://pay?till=999000&ref=UNVERIFIED_SHOP',
    },
    {
      label: 'Suspended Canteen (Till: 999111 - Test Reject)',
      payload: 'pesapay://pay?till=999111&ref=SUSPENDED_CANTEEN',
    },
  ];

  const handleApplyCustom = () => {
    if (customText.trim()) {
      onSelectPayload(customText.trim());
      setCustomText('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Simulate QR Scan</Text>
          <Text style={styles.subtitle}>
            Select a verified campus merchant or enter custom QR payload for testing:
          </Text>

          <ScrollView style={styles.presetsList}>
            {PRESETS.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => {
                  onSelectPayload(preset.payload);
                  onClose();
                }}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.customSection}>
            <TextInput
              style={styles.input}
              placeholder="Or paste raw QR payload..."
              placeholderTextColor={colors.textMuted}
              value={customText}
              onChangeText={setCustomText}
            />
            <PrimaryButton
              title="Submit QR"
              onPress={handleApplyCustom}
              disabled={!customText.trim()}
              style={styles.submitBtn}
            />
          </View>

          <SecondaryButton
            title="Cancel"
            onPress={onClose}
            style={styles.cancelBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  presetsList: {
    maxHeight: 220,
  },
  presetButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  presetText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  customSection: {
    marginTop: 12,
    gap: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
    height: 44,
    color: colors.textPrimary,
    fontSize: 13,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          borderStyle: 'none',
        } as any)
      : {}),
  },
  submitBtn: {
    height: 44,
    borderRadius: 22,
  },
  cancelBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 22,
  },
});
