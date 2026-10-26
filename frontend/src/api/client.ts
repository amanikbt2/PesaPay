import {
  ApiResponse,
  MerchantDTO,
  PaymentDTO,
  InitiatePaymentRequest,
} from '../shared';
import { storageService } from '../services/storage.service';
import { networkService, ConnectivityResult } from '../services/network.service';

const SESSION_TOKEN_KEY = 'pesapay_session_token';
const CUSTOM_URL_KEY = 'pesapay_custom_api_url';

// Default development backend URL
const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  async init(): Promise<void> {
    const savedUrl = await storageService.getItem(CUSTOM_URL_KEY);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    this.token = await storageService.getItem(SESSION_TOKEN_KEY);
    if (!this.token) {
      await this.bootstrapSession();
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async setBaseUrl(url: string): Promise<void> {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    await storageService.setItem(CUSTOM_URL_KEY, this.baseUrl);
  }

  async bootstrapSession(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Campus Student',
          phoneNumber: '254712345678',
        }),
      });

      if (res.ok) {
        const body: ApiResponse<{ token: string }> = await res.json();
        if (body.data?.token) {
          this.token = body.data.token;
          await storageService.setItem(SESSION_TOKEN_KEY, this.token);
        }
      }
    } catch {
      // Backend not yet reachable on startup, will retry on demand
    }
  }

  async checkConnectivity(): Promise<ConnectivityResult> {
    return networkService.checkRealTimeConnectivity(this.baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, { ...options, headers });
    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
      const message = json.error?.message || `Request failed with status ${res.status}`;
      const code = json.error?.code || 'UNKNOWN_ERROR';
      throw { code, message, statusCode: res.status };
    }

    return json.data as T;
  }

  async resolveMerchantQr(rawPayload: string): Promise<MerchantDTO> {
    return this.request<MerchantDTO>('/merchants/resolve-qr', {
      method: 'POST',
      body: JSON.stringify({ rawPayload }),
    });
  }

  async initiatePayment(params: InitiatePaymentRequest): Promise<PaymentDTO> {
    return this.request<PaymentDTO>('/payments/stk-push', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentDTO> {
    return this.request<PaymentDTO>(`/payments/${paymentId}`, {
      method: 'GET',
    });
  }

  async getHistory(): Promise<PaymentDTO[]> {
    return this.request<PaymentDTO[]>('/transactions', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
