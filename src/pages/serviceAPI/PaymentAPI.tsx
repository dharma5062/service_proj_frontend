import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

// ==========================================
// Types
// ==========================================

export interface PublicInvoiceData {
  invoice_id: number;
  invoice_number: string;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shop_name: string;
  device_name: string;
  payments?: any[];
}

export interface VerifyTokenResponse {
  status: boolean;
  message?: string;
  already_paid?: boolean;
  data: PublicInvoiceData;
}

export interface InitiatePaymentPayload {
  token: string;
  gateway: 'razorpay' | 'cashfree' | 'cash_in_hand';
}

export interface InitiateRazorpayResponse {
  status: boolean;
  gateway: 'razorpay';
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
}

export interface InitiateCashfreeResponse {
  status: boolean;
  gateway: 'cashfree';
  payment_session_id: string;
  order_id: string;
  env: 'sandbox' | 'production';
}

export interface InitiateCashInHandResponse {
  status: boolean;
  gateway: 'cash_in_hand';
  message: string;
}

export type InitiatePaymentResponse =
  | InitiateRazorpayResponse
  | InitiateCashfreeResponse
  | InitiateCashInHandResponse;

export interface VerifyPaymentPayload {
  token: string;
  gateway: 'razorpay' | 'cashfree' | 'cash_in_hand';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cashfree_order_id?: string;
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
}

// OTP types
export interface SendCashOtpResponse {
  status: boolean;
  message: string;
  email_sent: boolean;
  email_error?: string | null;
  expires_at?: string;
  otp?: string;
}

export interface VerifyCashOtpPayload {
  invoiceId: number;
  otp: string;
}

export interface VerifyCashOtpResponse {
  status: boolean;
  message: string;
}

export interface ConfirmManualPaymentPayload {
  invoiceId: number;
  type: 'cash' | 'upi';
}

export interface ConfirmManualPaymentResponse {
  status: boolean;
  message: string;
}

// ==========================================
// API Calls
// ==========================================

export const verifyPayToken = async (token: string): Promise<VerifyTokenResponse> => {
  const response = await axiosInstance.get(`/pay/verify-token/${token}`);
  return response.data;
};

export const initiatePayment = async (payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
  const response = await axiosInstance.post('/pay/initiate', payload);
  return response.data;
};

export const verifyPayment = async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
  const response = await axiosInstance.post('/pay/verify', payload);
  return response.data;
};

export const sendCashOtp = async (invoiceId: number): Promise<SendCashOtpResponse> => {
  const response = await axiosInstance.post(`/invoice/${invoiceId}/send-cash-otp`);
  return response.data;
};

export const verifyCashOtp = async ({ invoiceId, otp }: VerifyCashOtpPayload): Promise<VerifyCashOtpResponse> => {
  const response = await axiosInstance.post(`/invoice/${invoiceId}/verify-cash-otp`, { otp });
  return response.data;
};

export const confirmManualPayment = async ({ invoiceId, type }: ConfirmManualPaymentPayload): Promise<ConfirmManualPaymentResponse> => {
  const response = await axiosInstance.post(`/invoice/${invoiceId}/confirm-manual`, { type });
  return response.data;
};

// @deprecated — use OTP flow instead
export const approveCashPayment = async (invoiceId: number): Promise<{ status: boolean; message: string }> => {
  const response = await axiosInstance.post(`/invoice/${invoiceId}/approve-cash`);
  return response.data;
};

// ==========================================
// Hooks
// ==========================================

export const useVerifyPayToken = (token: string) => {
  return useQuery({
    queryKey: ['payToken', token],
    queryFn: () => verifyPayToken(token),
    retry: false,
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: initiatePayment,
  });
};

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: verifyPayment,
  });
};

export const useSendCashOtp = (invoiceId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sendCashOtp(invoiceId!),
    onSuccess: () => {
      // Refresh invoice data so payment record is up to date
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });
};

export const useVerifyCashOtp = (invoiceId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otp: string) => verifyCashOtp({ invoiceId: invoiceId!, otp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useConfirmManualPayment = (invoiceId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: 'cash' | 'upi') => confirmManualPayment({ invoiceId: invoiceId!, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

// @deprecated — kept for backward compat
export const useApproveCashPayment = () => {
  return useMutation({
    mutationFn: approveCashPayment,
  });
};
