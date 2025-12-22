import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface ValidationErrors {
  [key: string]: string;
}

export default function ResetPassword() {
  useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = (location.state as any)?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // =============================
  // VALIDATE FORM
  // =============================
  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!email.trim()) errors.email = "Email is required";

    if (!otp.trim()) errors.otp = "OTP is required";
    else if (otp.length < 4) errors.otp = "OTP must be at least 4 digits";

    if (!password) errors.password = "Password is required";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters";

    if (!password_confirmation)
      errors.password_confirmation = "Confirm password is required";
    else if (password !== password_confirmation)
      errors.password_confirmation = "Passwords do not match";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // =============================
  // HANDLE SUBMIT
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setValidationErrors({});

    try {


      alert("Password reset successful!");
      navigate("/login");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formatted: ValidationErrors = {};
        Object.keys(backendErrors).forEach((field) => {
          formatted[field] = backendErrors[field][0];
        });
        setValidationErrors(formatted);
      } else if (error.response?.data?.message) {
        setValidationErrors({ general: error.response.data.message });
      } else {
        setValidationErrors({ general: "Reset failed. Try again later." });
      }
    }

    setLoading(false);
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="max-w-md w-full rounded-2xl shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl pt-8 pb-6 text-center">
          <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-blue-100 text-base mt-2">
            Enter the OTP and create your new password
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 pb-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GENERAL ERROR */}
            {validationErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 text-sm">
                  {validationErrors.general}
                </p>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">Email</Label>
              <Input
                type="email"
                value={email}
                placeholder="Enter your registered email"
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 text-base rounded-lg ${
                  validationErrors.email ? "border-red-500" : ""
                }`}
              />
              {validationErrors.email && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* OTP */}
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">OTP</Label>
              <Input
                value={otp}
                placeholder="Enter OTP from your email"
                onChange={(e) => setOtp(e.target.value)}
                className={`h-12 text-base rounded-lg ${
                  validationErrors.otp ? "border-red-500" : ""
                }`}
              />
              {validationErrors.otp && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.otp}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter new password"
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 text-base pr-12 rounded-lg ${
                    validationErrors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={password_confirmation}
                  placeholder="Re-enter password"
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={`h-12 text-base pr-12 rounded-lg ${
                    validationErrors.password_confirmation
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {validationErrors.password_confirmation && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.password_confirmation}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <p className="text-center text-gray-600 text-sm mt-6">
              Back to{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 font-semibold"
              >
                Login
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
