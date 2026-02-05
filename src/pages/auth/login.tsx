import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email_or_phone?: string; password?: string; general?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");


  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setLoading(true);
    try {
      const payload = {
        email_or_phone: emailOrPhone,
        password: password,
      };
      const res = await axios.post("http://localhost:8000/api/login", payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (res?.data?.token) {
        login(res.data.token);
      }
      setSuccessMessage(res?.data?.message || "Login successful!");
      setTimeout(() => {
        navigate("/onboarding/shop");
      }, 800);
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err?.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: "Login failed. Try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-sm shadow-xl rounded-xl border-0">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-blue-700">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {successMessage && (
              <div className="bg-blue-50 border border-blue-300 px-3 py-2 rounded-md text-blue-700 text-center text-sm mb-3">
                {successMessage}
              </div>
            )}
            {errors.general && (
              <div className="bg-red-50 border border-red-300 px-3 py-2 rounded-md text-red-700 text-center text-sm mb-3">
                {errors.general}
              </div>
            )}
            <div className="space-y-1">
              <Label className="font-semibold text-gray-700">Email or Phone</Label>
              <Input
                type="text"
                placeholder="Enter your email or phone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md text-sm"
              />
              {errors.email_or_phone && (
                <p className="text-red-600 text-xs mt-1">{errors.email_or_phone}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md text-sm pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex justify-end">
              <span
                className="text-blue-600 text-xs font-medium cursor-pointer hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </div>
            <Button
              className="w-full h-11 mt-2 text-base font-semibold  duration-150 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-xs text-gray-600 pt-3">
              Don’t have an account?{" "}
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={() => navigate("/register")}
              >
                Create one
              </span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
