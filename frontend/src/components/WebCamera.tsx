import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface WebCameraProps {
  active: boolean;
  onScanSampleQr?: () => void;
}

export const WebCamera: React.FC<WebCameraProps> = ({ active, onScanSampleQr }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [showSimulated, setShowSimulated] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const startCamera = async () => {
    if (Platform.OS !== 'web') return;
    setErrorDetails(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorDetails('Browser mediaDevices not supported');
      return;
    }

    try {
      // Direct minimal constraint to maximize compatibility with laptop webcams
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setStreamActive(true);
        setShowSimulated(false);
      }
    } catch (err: any) {
      console.warn('Webcam start failed:', err);
      if (err.name === 'NotReadableError') {
        setErrorDetails(
          'Webcam is locked by Windows or privacy shutter. Check physical slider or close apps using camera (Teams/Zoom).'
        );
      } else if (err.name === 'NotAllowedError') {
        setErrorDetails(
          'Camera permission blocked in browser. Click the lock/camera icon in your address bar to allow.'
        );
      } else {
        setErrorDetails(
          err.message || 'Could not connect to laptop camera hardware.'
        );
      }
    }
  };

  useEffect(() => {
    if (!active) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setStreamActive(false);
      return;
    }

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [active]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      {/* HTML5 Video Element for Physical Webcam */}
      <video
        ref={videoRef as any}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          display: streamActive ? 'block' : 'none',
        }}
      />

      {/* Simulated Camera Feed (when laptop webcam is locked/unavailable) */}
      {showSimulated && (
        <View style={styles.simulatedCounter}>
          <View style={styles.simulatedCard}>
            <View style={styles.simulatedHeader}>
              <Text style={styles.simulatedLipaText}>LIPA NA M-PESA</Text>
            </View>
            <View style={styles.simulatedQrBox}>
              <Text style={styles.simulatedQrIcon}>🔳</Text>
              <Text style={styles.simulatedTillText}>TILL NO: 123456</Text>
              <Text style={styles.simulatedStoreText}>Campus Kiosk</Text>
            </View>
            {onScanSampleQr && (
              <TouchableOpacity
                style={styles.scanSimulatedBtn}
                onPress={onScanSampleQr}
                activeOpacity={0.8}
              >
                <Text style={styles.scanSimulatedBtnText}>Tap to Scan This QR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Hardware Diagnostic Notice when physical webcam is not streaming */}
      {!streamActive && !showSimulated && (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Laptop Webcam Notice</Text>
          <Text style={styles.noticeDesc}>
            {errorDetails ||
              'Your laptop camera reported "NotReadableError" (hardware device is locked by another app or a physical privacy shutter).'}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={startCamera}>
              <Text style={styles.retryBtnText}>Retry Webcam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simulatedBtn}
              onPress={() => setShowSimulated(true)}
            >
              <Text style={styles.simulatedBtnText}>Use Simulated Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070A11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeCard: {
    backgroundColor: 'rgba(21, 29, 47, 0.95)',
    padding: 20,
    borderRadius: 16,
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noticeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#0B0F19',
    fontSize: 13,
    fontWeight: '700',
  },
  simulatedBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  simulatedCounter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  simulatedCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  simulatedHeader: {
    backgroundColor: '#008543', // Safaricom green
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  simulatedLipaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simulatedQrBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  simulatedQrIcon: {
    fontSize: 72,
    lineHeight: 80,
  },
  simulatedTillText: {
    color: '#DC2626', // Safaricom red till text
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  simulatedStoreText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  scanSimulatedBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  scanSimulatedBtnText: {
    color: '#0B0F19',
    fontSize: 13,
    fontWeight: '700',
  },
});
