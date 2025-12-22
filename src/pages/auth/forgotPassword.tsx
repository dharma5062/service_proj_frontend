import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setLoading(true);

    try {
      const payload = { email };
      const res = await axios.post(
        "http://localhost:8000/api/forgot-password",
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      setSuccessMessage(res?.data?.message || "Reset instructions sent to your email.");

      // Navigate to reset-password page with email before clearing
      setTimeout(() => {
        navigate("/reset-password", { state: { email: email } });
      }, 500);
    
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err?.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: "Something went wrong. Try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-sm shadow-2xl rounded-xl border-0">
        <CardHeader className="pb-4 pt-8">
          <CardTitle className="text-center text-2xl font-bold text-blue-700">
            Forgot Password
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-6">
            {successMessage && (
              <div className="bg-blue-50 border border-blue-300 px-3 py-2 rounded-md text-blue-700 text-center text-sm">
                {successMessage}
              </div>
            )}
            {errors.general && (
              <div className="bg-red-50 border border-red-300 px-3 py-2 rounded-md text-red-700 text-center text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="font-semibold text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 text-sm"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-red-600 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-semibold text-base transition-colors duration-150 disabled:opacity-60"
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <p className="text-center text-xs text-gray-600 pt-3">
              Remember your password?{" "}
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
