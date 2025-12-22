import React, { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerifyState {
    email?: string;
    otp_send?: string;
    name?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
    user_type?: string;
    company_name?: string;
    address?: string;
}

export default function VerifyOTP() {
    const { toast } = useToast();
    const { axiosInstance } = useAuth() || {};
    const client = axiosInstance ?? axios.create({ baseURL: "http://localhost:8000/api" });
    const location = useLocation();
    const navigate = useNavigate();

    const nav = (location.state || {}) as VerifyState;
    const savedPayload = JSON.parse(localStorage.getItem("registerPayload") || "{}") || {};

    const email = nav.email || savedPayload.email || "";
    const phone = nav.phone || savedPayload.phone || "";
    const name = nav.name || savedPayload.name || "";
    const password = nav.password || savedPayload.password || "";
    const password_confirmation = nav.password_confirmation || savedPayload.password_confirmation || "";
    const user_type = nav.user_type || savedPayload.user_type || "so";
    const company_name = nav.company_name || savedPayload.company_name || "";
    const address = nav.address || savedPayload.address || "";

    const [otpSend] = useState(nav.otp_send || localStorage.getItem("otp_send") || "");
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (index: number, value: string) => {
        const digit = value.replace(/[^0-9]/g, "").slice(-1);

        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = digit;
        setOtpDigits(newOtpDigits);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpValue = otpDigits.join("");

        if (otpValue.length !== 6) {
            toast({
                variant: "destructive",
                title: "Invalid OTP",
                description: "Please enter the complete 6-digit code",
            });
            return;
        }

        const payload = {
            email: email || undefined,
            phone,
            email_otp: otpValue,
            name,
            otp_send: otpSend,
            password,
            password_confirmation,
            user_type,
            company_name,
            address,
        };

        try {
            setLoading(true);
            const res = await client.post("/register", payload);

            // Success toast for 200/201 responses
            if (res.status === 200 || res.status === 201) {
                toast({
                    title: "Verification Successful!",
                    description: res?.data?.message || "Your account has been verified successfully.",
                });
            }

            localStorage.removeItem("registerEmail");
            localStorage.removeItem("registerPayload");
            localStorage.removeItem("otp_send");
            setTimeout(() => navigate("/dashboard"), 800);
        } catch (err: any) {
            console.error("Verification error:", err);

            // Error toast for failure cases
            if (err?.response?.data?.errors) {
                const backend = err.response.data.errors;
                const errorMessages = Object.values(backend).flat();
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: errorMessages[0] as string || "Please check your OTP and try again.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: err?.response?.data?.message || "Verification failed. Please try again.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const displayContact = email || phone;

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900 p-3">
            <div className="w-full max-w-md bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6">
                {/* Lock Icon */}
                <div className="flex justify-center mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Lock className="h-7 w-7" />
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-slate-900 dark:text-slate-50 text-xl sm:text-2xl font-bold text-center mb-2">
                    Enter Verification Code
                </h1>

                {/* Body Text */}
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm text-center mb-4 px-2">
                    We've sent a 6-digit code to <span className="font-medium text-slate-900 dark:text-slate-50">{displayContact}</span>
                </p>

                {/* OTP Input Form */}
                <form onSubmit={verifyOtp} className="space-y-4">
                    {/* Confirmation Code Inputs */}
                    <div className="flex justify-center gap-2">
                        {otpDigits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="flex h-12 w-10 sm:h-14 sm:w-12 text-center text-lg sm:text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 dark:focus:ring-offset-slate-900 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 transition-all"
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying...
                            </div>
                        ) : (
                            "Verify"
                        )}
                    </Button>
                </form>

                {/* Back to Registration Button */}
                <div className="mt-3">
                    <Button
                        type="button"
                        onClick={() => navigate("/register")}
                        variant="outline"
                        className="w-full h-9 text-xs font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Back to Registration
                    </Button>
                </div>

                {/* Sign In Link */}
                <div className="mt-3 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Already have an account?{" "}
                        <button
                            onClick={() => navigate("/login")}
                            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 hover:underline focus:outline-none"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
