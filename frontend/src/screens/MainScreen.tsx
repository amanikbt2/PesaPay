import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../theme/colors';
import { apiClient } from '../api/client';
import { MerchantDTO, PaymentDTO } from '../shared';
import { ScannerFrame } from '../components/ScannerFrame';
import { OfflineOverlay } from '../components/OfflineOverlay';
import { MerchantSheet } from '../components/MerchantSheet';
import { ConfirmScreen } from '../components/ConfirmScreen';
import { ProcessingScreen } from '../components/ProcessingScreen';
import { SuccessScreen } from '../components/SuccessScreen';
import { FailureScreen } from '../components/FailureScreen';
import { ManualQrModal } from '../components/ManualQrModal';
import { TransactionHistoryModal } from '../components/TransactionHistoryModal';
import { ProfileModal } from '../components/ProfileModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { WebCamera } from '../components/WebCamera';

type AppStep =
  | 'SCANNER'
  | 'MERCHANT_SHEET'
  | 'CONFIRM'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILURE';

export const MainScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [webPermissionGranted, setWebPermissionGranted] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<AppStep>('SCANNER');

  // Scanner Lock to prevent duplicate processing of the same QR code frame
  const isLockedRef = useRef<boolean>(false);

  // Merchant & Payment Workflow State
  const [activeMerchant, setActiveMerchant] = useState<MerchantDTO | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(150);
  const [activePayment, setActivePayment] = useState<PaymentDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>('');

  // Modals
  const [offlineVisible, setOfflineVisible] = useState<boolean>(false);
  const [offlineReason, setOfflineReason] = useState<'NO_NETWORK' | 'NO_INTERNET' | 'BACKEND_UNAVAILABLE'>('NO_NETWORK');
  const [manualQrVisible, setManualQrVisible] = useState<boolean>(false);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [profileVisible, setProfileVisible] = useState<boolean>(false);

  // Initialize API client session on mount
  useEffect(() => {
    apiClient.init();
  }, []);

  /**
   * Safe Scanner Reset
   */
  const resetScanner = useCallback(() => {
    isLockedRef.current = false;
    setCurrentStep('SCANNER');
    setActiveMerchant(null);
    setActivePayment(null);
    setFailureReason('');
  }, []);

  /**
   * CRITICAL OFFLINE SECURITY REQUIREMENT IMPLEMENTATION:
   * 1. Lock further scan events.
   * 2. Read latest available connection state & verify reachability.
   * 3. If offline: Show overlay, DISCARD QR result, do NOT display merchant info,
   *    do NOT enable payment, reset scanner.
   * 4. If online: Validate and resolve QR.
   */
  const handleQrPayloadDetected = useCallback(
    async (rawPayload: string) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true; // Lock duplicate scans

      // 1. Authoritative real-time connectivity check
      const conn = await apiClient.checkConnectivity();

      if (!conn.isOnline) {
        // Critical requirement: Discard QR result and show clean offline overlay
        isLockedRef.current = false;
        setOfflineReason(conn.reason || 'NO_NETWORK');
        setOfflineVisible(true);
        // Payload is discarded by NOT setting activeMerchant and leaving workflow
        return;
      }

      // 2. Online: Validate and resolve merchant with backend
      try {
        const merchant = await apiClient.resolveMerchantQr(rawPayload);
        setActiveMerchant(merchant);
        setCurrentStep('MERCHANT_SHEET');
      } catch (err: any) {
        isLockedRef.current = false;
        Alert.alert(
          'Verification Failed',
          err.message || 'We could not verify this merchant QR code.',
          [{ text: 'OK', onPress: resetScanner }]
        );
      }
    },
    [resetScanner]
  );

  /**
   * Handle barcode scanned from Camera
   */
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isLockedRef.current && currentStep === 'SCANNER') {
      handleQrPayloadDetected(data);
    }
  };

  /**
   * Dismiss offline overlay and unlock scanner safely
   */
  const handleDismissOffline = () => {
    setOfflineVisible(false);
    resetScanner();
  };

  /**
   * Proceed from Merchant Sheet to Confirmation Screen
   */
  const handleProceedToConfirm = (amount: number) => {
    setPaymentAmount(amount);
    setCurrentStep('CONFIRM');
  };

  /**
   * Client-side UUID generator for Idempotency
   */
  const generateIdempotencyKey = (): string => {
    return 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  };

  /**
   * Submit Payment and Initiate STK Push
   */
  const handleConfirmAndPay = async () => {
    if (!activeMerchant) return;
    setIsSubmitting(true);

    // Re-check connectivity before sending payment
    const conn = await apiClient.checkConnectivity();
    if (!conn.isOnline) {
      setIsSubmitting(false);
      setOfflineReason(conn.reason || 'NO_NETWORK');
      setOfflineVisible(true);
      return;
    }

    try {
      const idempotencyKey = generateIdempotencyKey();
      const payment = await apiClient.initiatePayment({
        tillNumber: activeMerchant.tillNumber,
        merchantReference: activeMerchant.merchantReference,
        amount: paymentAmount,
        idempotencyKey,
      });

      setActivePayment(payment);
      setCurrentStep('PROCESSING');
      setIsSubmitting(false);

      // Start Bounded Polling for transaction confirmation
      startPaymentPolling(payment.id);
    } catch (err: any) {
      setIsSubmitting(false);
      setFailureReason(err.message || 'Payment initiation failed. Please try again.');
      setCurrentStep('FAILURE');
    }
  };

  /**
   * Bounded Polling with Backoff
   */
  const startPaymentPolling = (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3000ms = 60 seconds
    const interval = 3000;

    const pollTimer = setInterval(async () => {
      attempts++;
      try {
        const updated = await apiClient.getPaymentStatus(paymentId);
        setActivePayment(updated);

        if (updated.status === 'SUCCEEDED') {
          clearInterval(pollTimer);
          setCurrentStep('SUCCESS');
        } else if (
          updated.status === 'FAILED' ||
          updated.status === 'CANCELLED' ||
          updated.status === 'EXPIRED'
        ) {
          clearInterval(pollTimer);
          setFailureReason(
            updated.resultDescription ||
              (updated.status === 'CANCELLED'
                ? 'Payment cancelled on phone.'
                : 'Payment was not completed.')
          );
          setCurrentStep('FAILURE');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollTimer);
          setFailureReason(
            'We have not received payment confirmation yet. Please check your transaction history before trying again.'
          );
          setCurrentStep('FAILURE');
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(pollTimer);
          setFailureReason('Network timeout while checking payment status.');
          setCurrentStep('FAILURE');
        }
      }
    }, interval);
  };

  /**
   * Universal camera permission requester (Web & Native)
   */
  const handleRequestCameraPermission = async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          setWebPermissionGranted(true);
        } catch {
          // If browser webcam is declined or unavailable, still open the scanner view
          setWebPermissionGranted(true);
        }
      } else {
        setWebPermissionGranted(true);
      }
    } else {
      await requestPermission();
    }
  };

  const isCameraPermitted = Platform.OS === 'web' ? webPermissionGranted : permission?.granted;

  // Render Permission Request if camera access not granted
  if (Platform.OS !== 'web' && !permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isCameraPermitted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            {Platform.OS === 'web'
              ? 'Click Enable Camera to use your webcam, or use Manual Input to simulate scanning.'
              : 'PesaPay needs camera access to scan merchant Till QR codes.'}
          </Text>
          <PrimaryButton
            title="Enable Camera"
            onPress={handleRequestCameraPermission}
            style={styles.permissionButton}
          />
          <PrimaryButton
            title="Use Manual Code Input"
            onPress={() => {
              if (Platform.OS === 'web') setWebPermissionGranted(true);
              setManualQrVisible(true);
            }}
            style={[styles.permissionButton, { marginTop: 10, backgroundColor: colors.surfaceElevated }]}
            textStyle={{ color: colors.textPrimary }}
          />
        </View>

        <ManualQrModal
          visible={manualQrVisible}
          onClose={() => setManualQrVisible(false)}
          onSelectPayload={handleQrPayloadDetected}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Direct Camera Scanner Preview (Native or Web) */}
      {Platform.OS !== 'web' ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={
            currentStep === 'SCANNER' && !isLockedRef.current
              ? handleBarcodeScanned
              : undefined
          }
        />
      ) : (
        <WebCamera
          active={currentStep === 'SCANNER'}
          onScanSampleQr={() =>
            handleQrPayloadDetected(
              'pesapay://pay?till=123456&ref=CAMPUS_KIOSK&name=Campus+Kiosk'
            )
          }
        />
      )}

      {/* Viewfinder Overlay Frame */}
      {currentStep === 'SCANNER' && (
        <ScannerFrame
          torchOn={torchOn}
          onToggleTorch={() => setTorchOn((prev) => !prev)}
          onOpenManualInput={() => setManualQrVisible(true)}
          onOpenHistory={() => setHistoryVisible(true)}
          onOpenProfile={() => setProfileVisible(true)}
          onSelectRecentMerchant={(payload) => handleQrPayloadDetected(payload)}
          brandName="CampusPay"
        />
      )}

      {/* Step 2 & 3: Merchant Sheet and Amount Entry */}
      <MerchantSheet
        visible={currentStep === 'MERCHANT_SHEET'}
        merchant={activeMerchant}
        onClose={resetScanner}
        onProceedToConfirm={handleProceedToConfirm}
      />

      {/* Step 4: Confirm Payment Screen */}
      {currentStep === 'CONFIRM' && activeMerchant && (
        <ConfirmScreen
          merchant={activeMerchant}
          amount={paymentAmount}
          loading={isSubmitting}
          onBack={() => setCurrentStep('MERCHANT_SHEET')}
          onConfirmAndPay={handleConfirmAndPay}
        />
      )}

      {/* Step 6: Processing Payment Screen */}
      {currentStep === 'PROCESSING' && (
        <ProcessingScreen
          merchantName={activeMerchant?.displayName || 'Merchant'}
          amount={paymentAmount}
        />
      )}

      {/* Step 7: Payment Successful Screen */}
      {currentStep === 'SUCCESS' && activePayment && (
        <SuccessScreen payment={activePayment} onDone={resetScanner} />
      )}

      {/* Step 8: Payment Failed Screen */}
      {currentStep === 'FAILURE' && (
        <FailureScreen
          message={failureReason}
          onRetry={() => {
            if (activeMerchant) {
              setCurrentStep('CONFIRM');
            } else {
              resetScanner();
            }
          }}
          onBackToScan={resetScanner}
        />
      )}

      {/* Mandatory Offline Overlay */}
      <OfflineOverlay
        visible={offlineVisible}
        onDismiss={handleDismissOffline}
        reason={offlineReason}
      />

      {/* Manual / Emulator QR Preset Modal */}
      <ManualQrModal
        visible={manualQrVisible}
        onClose={() => setManualQrVisible(false)}
        onSelectPayload={(payload) => {
          setManualQrVisible(false);
          isLockedRef.current = false;
          handleQrPayloadDetected(payload);
        }}
      />

      {/* Secondary Transaction History Modal */}
      <TransactionHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />

      {/* User Profile Modal */}
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 32,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 10,
        }),
  },
  cameraIcon: {
    fontSize: 44,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    height: 48,
    borderRadius: 24,
  },
  webSimulatedCamera: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webSimulatedText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
