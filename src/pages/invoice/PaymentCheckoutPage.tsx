import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useVerifyPayToken,
  useInitiatePayment,
  useVerifyPayment,
  InitiateRazorpayResponse,
  InitiateCashfreeResponse,
} from '../serviceAPI/PaymentAPI';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CreditCard, Wallet, Banknote, AlertCircle, X, MapPin, RefreshCw } from 'lucide-react';
import { useRazorpay } from 'react-razorpay';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

// ── Cash Confirmation Modal ──────────────────────────────────────────────────

interface CashConfirmModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  shopName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CashConfirmModal = ({
  isOpen,
  amount,
  currency,
  shopName,
  onConfirm,
  onCancel,
  isLoading,
}: CashConfirmModalProps) => {
  if (!isOpen) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency + ' ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Cash Payment</p>
                <p className="text-xs text-emerald-100">Confirmation required</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Amount highlight */}
          <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">Amount to Pay at Shop</p>
            <p className="text-3xl font-black text-emerald-700">
              {currencySymbol}{Number(amount).toFixed(2)}
            </p>
          </div>

          {/* Shop info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Pay in person at <strong className="text-gray-800">{shopName}</strong></span>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">How this works:</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Visit the shop and hand over the cash</li>
                  <li>Shop staff will generate a verification OTP on your payment screen</li>
                  <li>Share the OTP with the staff to complete payment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 text-sm rounded-xl border-gray-200"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={onConfirm}
            disabled={isLoading}
            id="confirm-cash-at-shop"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing...</>
            ) : (
              'Yes, Pay at Shop →'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const PaymentCheckoutPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [gateway, setGateway] = useState<'razorpay' | 'cashfree' | 'cash_in_hand'>('razorpay');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  const { data: verifyData, isLoading, error, refetch } = useVerifyPayToken(token || '');
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();
  const { Razorpay } = useRazorpay();

  const invoice = verifyData?.data;

  useEffect(() => {
    if (isSuccess && invoice?.invoice_id) {
      const timer = setTimeout(() => {
        navigate(`/dashboard/invoice/view/${invoice.invoice_id}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, invoice?.invoice_id, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Handle Token Errors or already paid
  if (error || !verifyData?.status) {
    const isAlreadyPaid = (error as any)?.response?.data?.already_paid || verifyData?.already_paid;
    const msg = (error as any)?.response?.data?.message || 'Invalid or expired payment link.';

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            {isAlreadyPaid ? (
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <span className="text-2xl text-red-600">!</span>
              </div>
            )}
            <CardTitle className="text-2xl">{isAlreadyPaid ? 'Already Paid' : 'Link Invalid'}</CardTitle>
            <CardDescription className="text-base mt-2">{msg}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    const isCash = gateway === 'cash_in_hand';
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
        <Card className={`w-full max-w-md shadow-lg border-t-4 ${isCash ? 'border-emerald-500' : 'border-green-500'}`}>
          <CardHeader className="text-center">
            {isCash ? (
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Banknote className="w-8 h-8 text-emerald-600" />
              </div>
            ) : (
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            )}
            <CardTitle className={`text-2xl ${isCash ? 'text-emerald-700' : 'text-green-700'}`}>
              {isCash ? 'Cash Payment Registered!' : 'Payment Successful!'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isCash
                ? `Cash payment request recorded for invoice ${verifyData.data.invoice_number}. Visit ${verifyData.data.shop_name} to complete your payment. The shop staff will verify via OTP.`
                : `Thank you, ${verifyData.data.customer_name}. Invoice ${verifyData.data.invoice_number} has been paid.`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const pendingCashPayment = invoice?.payments?.find(
    (p: any) => p.gateway === 'cash_in_hand' && p.status === 'pending'
  );

  // Called after user confirms the cash modal
  const executeCashPayment = async () => {
    if (!token || !invoice) return;
    try {
      const initRes = await initiatePayment.mutateAsync({ token, gateway: 'cash_in_hand' });
      toast.success((initRes as any).message || 'Cash payment registered. Visit the shop to complete payment.');
      setShowCashModal(false);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record cash payment.');
      setShowCashModal(false);
    }
  };

  const handlePay = async () => {
    if (!token || !invoice) return;

    // Cash in Hand → show confirmation modal first
    if (gateway === 'cash_in_hand') {
      setShowCashModal(true);
      return;
    }

    try {
      const initRes = await initiatePayment.mutateAsync({ token, gateway });

      if (gateway === 'razorpay') {
        const rzRes = initRes as InitiateRazorpayResponse;
        const options = {
          key: rzRes.key_id,
          amount: rzRes.amount,
          currency: rzRes.currency as any,
          name: invoice.shop_name,
          description: `Invoice ${invoice.invoice_number}`,
          order_id: rzRes.order_id,
          handler: async (response: any) => {
            try {
              await verifyPayment.mutateAsync({
                token,
                gateway: 'razorpay',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success('Payment verified successfully!');
              setIsSuccess(true);
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: invoice.customer_name,
            email: invoice.customer_email,
            contact: invoice.customer_phone,
          },
          theme: { color: '#4f46e5' },
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error.description);
        });
        rzp.open();

      } else if (gateway === 'cashfree') {
        const cfRes = initRes as InitiateCashfreeResponse;
        const cashfree = await load({
          mode: cfRes.env === 'production' ? 'production' : 'sandbox',
        });

        cashfree.checkout({ paymentSessionId: cfRes.payment_session_id, redirectTarget: '_modal' }).then(
          (result: any) => {
            if (result.error) toast.error(result.error.message || 'Payment failed.');
            if (result.paymentDetails) {
              verifyPayment.mutate(
                { token, gateway: 'cashfree', cashfree_order_id: cfRes.order_id },
                {
                  onSuccess: () => { toast.success('Payment verified successfully!'); setIsSuccess(true); },
                  onError: (err: any) => toast.error(err.response?.data?.message || 'Verification failed.'),
                }
              );
            }
          }
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  return (
    <>
      {/* Cash Confirmation Modal */}
      <CashConfirmModal
        isOpen={showCashModal}
        amount={Number(invoice.total_amount)}
        currency={invoice.currency}
        shopName={invoice.shop_name}
        onConfirm={executeCashPayment}
        onCancel={() => setShowCashModal(false)}
        isLoading={initiatePayment.isPending}
      />

      <div className="flex min-h-screen w-full flex-col items-center bg-gray-50 py-8 px-4 font-sans">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-2xl text-center text-primary">Complete Payment</CardTitle>
            <CardDescription className="text-center text-sm uppercase tracking-wide font-semibold text-gray-500 mt-2">
              {invoice.shop_name}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3 mb-5">
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                <span className="text-gray-600 font-medium">Invoice No.</span>
                <span className="font-bold">{invoice.invoice_number}</span>
              </div>

              <div className="flex justify-between items-center p-2">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium text-right">{invoice.customer_name}</span>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <span className="text-gray-600">Device</span>
                <span className="font-medium text-right">{invoice.device_name}</span>
              </div>

              <div className="flex justify-between items-center p-2 pt-3">
                <span className="text-gray-800 font-semibold text-lg">Total Due</span>
                <span className="text-primary font-bold text-xl">
                  {invoice.currency === 'INR' ? '₹' : invoice.currency}{' '}
                  {Number(invoice.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {pendingCashPayment ? (
                <div className="flex flex-col items-center justify-center p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                    <Banknote className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-800 mb-1">Cash Payment Pending</h3>
                  <p className="text-sm text-amber-600">
                    <strong>{invoice.shop_name}</strong> to complete this payment.
                    The shop staff will generate an OTP for you to share.
                  </p>
                  {pendingCashPayment.cash_otp && (
                      <div className="mt-4 p-4 bg-white border border-amber-200 rounded-lg w-full shadow-inner">
                          <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Your Verification OTP</p>
                          <p className="text-4xl font-black text-amber-700 tracking-[0.25em]">{pendingCashPayment.cash_otp}</p>
                          <p className="text-xs text-gray-400 mt-2">Show this code to the shop staff to confirm your payment</p>
                      </div>
                  )}
                  {!pendingCashPayment.cash_otp && (
                      <Button variant="outline" className="mt-4 w-full border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => refetch()}>
                          <RefreshCw className="w-4 h-4 mr-2" /> Check for OTP
                      </Button>
                  )}
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Select Payment Method
                  </h3>
                  <RadioGroup
                    defaultValue="razorpay"
                    onValueChange={(v) => setGateway(v as 'razorpay' | 'cashfree' | 'cash_in_hand')}
                  >
                    <div
                      className={`flex items-center space-x-3 border p-3 rounded-xl cursor-pointer transition-colors ${gateway === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setGateway('razorpay')}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Razorpay</p>
                          <p className="text-xs text-gray-500">Cards, UPI, NetBanking</p>
                        </div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border p-3 rounded-xl cursor-pointer transition-colors ${gateway === 'cashfree' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setGateway('cashfree')}
                    >
                      <RadioGroupItem value="cashfree" id="cashfree" />
                      <Label htmlFor="cashfree" className="flex-1 cursor-pointer flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Wallet size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Cashfree</p>
                          <p className="text-xs text-gray-500">Cards, UPI, Wallets</p>
                        </div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border p-3 rounded-xl cursor-pointer transition-colors ${gateway === 'cash_in_hand' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setGateway('cash_in_hand')}
                    >
                      <RadioGroupItem value="cash_in_hand" id="cash_in_hand" />
                      <Label htmlFor="cash_in_hand" className="flex-1 cursor-pointer flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                          <Banknote size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Cash in Hand</p>
                          <p className="text-xs text-gray-500">Pay cash at the service center · OTP verified</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </>
              )}
            </div>
          </CardContent>

          {!pendingCashPayment && (
            <CardFooter className="pt-2 pb-4 px-6">
              <Button
                className="w-full text-lg h-12 font-semibold shadow-lg rounded-xl"
                onClick={handlePay}
                disabled={initiatePayment.isPending || verifyPayment.isPending}
                id="proceed-to-pay-btn"
              >
                {initiatePayment.isPending || verifyPayment.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : gateway === 'cash_in_hand' ? (
                  'Confirm Cash Payment →'
                ) : (
                  `Pay ${invoice.currency === 'INR' ? '₹' : invoice.currency} ${Number(invoice.total_amount).toFixed(2)}`
                )}
              </Button>
            </CardFooter>
          )}
        </Card>

        <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
          Secure payments processed via 256-bit SSL encryption.
        </p>
      </div>
    </>
  );
};

export default PaymentCheckoutPage;
