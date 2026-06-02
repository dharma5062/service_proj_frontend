import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVerifyPayToken, useInitiatePayment, useVerifyPayment, InitiateRazorpayResponse, InitiateCashfreeResponse } from '../serviceAPI/PaymentAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CreditCard, Wallet } from 'lucide-react';
import { useRazorpay } from 'react-razorpay';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

const PaymentCheckoutPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [gateway, setGateway] = useState<'razorpay' | 'cashfree'>('razorpay');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: verifyData, isLoading, error } = useVerifyPayToken(token || '');
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
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-green-500 border-t-4">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you, {verifyData.data.customer_name}. Your invoice {verifyData.data.invoice_number} has been paid successfully.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const handlePay = async () => {
    if (!token || !invoice) return;

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
            // Verify Signature
            try {
              await verifyPayment.mutateAsync({
                token,
                gateway: 'razorpay',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
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
          theme: {
            color: '#4f46e5',
          },
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

        const checkoutOptions = {
          paymentSessionId: cfRes.payment_session_id,
          redirectTarget: '_modal', // Open in modal instead of redirect
        };

        cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
            toast.error(result.error.message || 'Payment failed.');
          }
          if (result.redirect) {
             // Handle redirect if needed
          }
          if (result.paymentDetails) {
            // Verify payment
            verifyPayment.mutate({
              token,
              gateway: 'cashfree',
              cashfree_order_id: cfRes.order_id
            }, {
              onSuccess: () => {
                toast.success('Payment verified successfully!');
                setIsSuccess(true);
              },
              onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Payment verification failed.');
              }
            });
          }
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="border-b pb-6">
          <CardTitle className="text-2xl text-center text-primary">Complete Payment</CardTitle>
          <CardDescription className="text-center text-sm uppercase tracking-wide font-semibold text-gray-500 mt-2">
            {invoice.shop_name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 mb-8">
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
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
            
            <div className="flex justify-between items-center p-2 pt-4">
              <span className="text-gray-800 font-semibold text-lg">Total Due</span>
              <span className="text-primary font-bold text-2xl">
                {invoice.currency === 'INR' ? '₹' : invoice.currency} {Number(invoice.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Select Payment Method</h3>
            <RadioGroup defaultValue="razorpay" onValueChange={(v) => setGateway(v as 'razorpay' | 'cashfree')}>
              
              <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${gateway === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setGateway('razorpay')}>
                <RadioGroupItem value="razorpay" id="razorpay" />
                <Label htmlFor="razorpay" className="flex-1 cursor-pointer flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Razorpay</p>
                    <p className="text-xs text-gray-500">Cards, UPI, NetBanking</p>
                  </div>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${gateway === 'cashfree' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setGateway('cashfree')}>
                <RadioGroupItem value="cashfree" id="cashfree" />
                <Label htmlFor="cashfree" className="flex-1 cursor-pointer flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cashfree</p>
                    <p className="text-xs text-gray-500">Cards, UPI, Wallets</p>
                  </div>
                </Label>
              </div>

            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6 px-6">
          <Button 
            className="w-full text-lg h-14 font-semibold shadow-lg rounded-xl"
            onClick={handlePay}
            disabled={initiatePayment.isPending || verifyPayment.isPending}
          >
            {(initiatePayment.isPending || verifyPayment.isPending) ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              `Pay ${invoice.currency === 'INR' ? '₹' : invoice.currency} ${Number(invoice.total_amount).toFixed(2)}`
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
        Secure payments processed via 256-bit SSL encryption.
      </p>
    </div>
  );
};

export default PaymentCheckoutPage;
