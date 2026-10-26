import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../shared';

export interface ConnectivityResult {
  isOnline: boolean;
  reason?: 'NO_NETWORK' | 'NO_INTERNET' | 'BACKEND_UNAVAILABLE';
  providerMode?: 'mock' | 'daraja';
  darajaConfigured?: boolean;
}

export const networkService = {
  /**
   * Performs an authoritative, real-time connectivity and backend reachability check
   */
  async checkRealTimeConnectivity(backendBaseUrl: string): Promise<ConnectivityResult> {
    try {
      // 1. Check network interface
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          return { isOnline: false, reason: 'NO_NETWORK' };
        }
      } else {
        const netState = await NetInfo.fetch();
        if (netState.isConnected === false) {
          return { isOnline: false, reason: 'NO_NETWORK' };
        }
      }

      // 2. Perform lightweight backend ping to confirm actual reachability
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        APP_CONFIG.CONNECTIVITY_CHECK_TIMEOUT_MS
      );

      try {
        const res = await fetch(`${backendBaseUrl}/connectivity`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const body = await res.json();
          return {
            isOnline: true,
            providerMode: body?.data?.providerMode || 'mock',
            darajaConfigured: Boolean(body?.data?.darajaConfigured),
          };
        } else {
          return { isOnline: false, reason: 'BACKEND_UNAVAILABLE' };
        }
      } catch {
        clearTimeout(timeoutId);
        return { isOnline: false, reason: 'BACKEND_UNAVAILABLE' };
      }
    } catch {
      return { isOnline: false, reason: 'NO_NETWORK' };
    }
  },
};
