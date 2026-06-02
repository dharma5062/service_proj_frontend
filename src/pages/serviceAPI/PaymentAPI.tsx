import { useQuery, useMutation } from '@tanstack/react-query';
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
}

export interface VerifyTokenResponse {
  status: boolean;
  message?: string;
  already_paid?: boolean;
  data: PublicInvoiceData;
}

export interface InitiatePaymentPayload {
  token: string;
  gateway: 'razorpay' | 'cashfree';
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

export type InitiatePaymentResponse = InitiateRazorpayResponse | InitiateCashfreeResponse;

export interface VerifyPaymentPayload {
  token: string;
  gateway: 'razorpay' | 'cashfree';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cashfree_order_id?: string;
}

export interface VerifyPaymentResponse {
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

// ==========================================
// Hooks
// ==========================================

export const useVerifyPayToken = (token: string) => {
  return useQuery({
    queryKey: ['payToken', token],
    queryFn: () => verifyPayToken(token),
    retry: false, // Don't retry on 404
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
