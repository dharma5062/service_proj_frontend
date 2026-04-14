import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useCustomersApi } from "@/pages/serviceAPI/CustomersAPI";
import { toast } from "sonner";

const CustomerInviteApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { useApproveInvite } = useCustomersApi();
  const approveInviteMutation = useApproveInvite();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  const handleApprove = async () => {
    if (!token) {
      toast.error("Invalid invitation link");
      return;
    }

    setStatus("loading");
    try {
      const response = await approveInviteMutation.mutateAsync(token);
      if (response.success) {
        setCustomerInfo(response.data);
        setStatus("success");
        toast.success("Invitation approved successfully!");
        
        // Wait a small moment so the user sees the success state, then redirect
        setTimeout(() => {
          const customerId = response.data?.id;
          navigate(`/dashboard/services/create?customerId=${customerId}`);
        }, 2000);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to approve invitation. It may be expired or invalid.");
      toast.error(err.message || "Failed to approve invitation");
    }
  };

  // Auto-approve if token is present (optional, but requested flow seems to imply a button click)
  // For now, let's keep the button for user confirmation

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${status === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : status === 'error' ? (
                <AlertCircle className="w-10 h-10 text-red-600" />
              ) : (
                <UserPlus className="w-10 h-10 text-blue-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {status === 'success' ? 'Welcome!' : 'Account Invitation'}
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            {status === 'success' 
              ? `Verification complete, ${customerInfo?.name}.`
              : 'Please approve the invitation to access our services.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center py-6">
          {status === 'idle' && (
            <p className="text-gray-500">
              By clicking the button below, you will confirm your membership and be redirected to our service request page.
            </p>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-blue-600 font-medium">Approving your invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <p className="text-green-600 font-medium">Redirecting you to service request...</p>
              <p className="text-sm text-gray-500 mt-2">Setting everything up for you.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium">{errorMessage}</p>
              <p className="text-sm text-red-600 mt-2">
                If you believe this is an error, please contact support or request a new invitation link.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pb-8">
          {(status === 'idle' || status === 'error') && (
            <Button 
              size="lg"
              className={`w-full h-12 text-lg font-semibold shadow-md transition-all duration-200 ${
                status === 'error' ? 'bg-gray-800 hover:bg-black' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={status === 'error' ? () => navigate('/') : handleApprove}
            >
              {status === 'error' ? 'Go to Home' : 'Approve Invitation'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CustomerInviteApproval;
