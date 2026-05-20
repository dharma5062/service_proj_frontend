import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/AuthContext";

const FormSchema = z
    .object({
        name: z.string().min(3, { message: "Name must be at least 3 characters" }),
        phone: z
            .string()
            .min(10, { message: "Phone number must be at least 10 characters" })
            .regex(/^[0-9]+$/, { message: "Phone number must contain only digits" }),
        company_name: z.string().optional().or(z.literal("")),
        // address: z.string().optional().or(z.literal("")),
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters" }),
        password_confirmation: z.string(),
        // terms: z.boolean().refine((val) => val === true, {
        //     message: "You must accept the terms and conditions",
        // }),
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.password_confirmation) {
            ctx.addIssue({
                path: ["password_confirmation"],
                code: z.ZodIssueCode.custom,
                message: "Passwords do not match",
            });
        }
    });

type FormData = z.infer<typeof FormSchema>;

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { axiosInstance } = useAuth() || {};

    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            phone: "",
            company_name: "",
            // address: "",
            email: "",
            password: "",
            password_confirmation: "",
            // terms: false,
        },
    });

    const handleSubmitData = async (data: FormData) => {
        setIsSubmitting(true);

        try {
            const payload = {
                name: data.name.trim(),
                phone: data.phone.replace(/\D/g, ""),
                company_name: data.company_name ? data.company_name.trim() : undefined,
                // address: data.address?.trim() || undefined,
                email: data.email.trim(),
                password: data.password,
                password_confirmation: data.password_confirmation,
                user_type: "so",
            };

            const client = axiosInstance ?? axios.create({ baseURL: "http://localhost:8000/api" });
            const res = await client.post("/register-otp", payload);
            const otpSend = res?.data?.OTP_send || res?.data?.otp_send;

            // Store registration data in localStorage
            localStorage.setItem("registerEmail", payload.email || payload.phone);
            localStorage.setItem("registerPayload", JSON.stringify(payload));
            if (otpSend) localStorage.setItem("otp_send", otpSend);

            toast.success("OTP sent successfully!");

            // Navigate to verify OTP page
            navigate("/verify-otp", {
                state: {
                    ...payload,
                    otp_send: otpSend,
                },
            });
        } catch (err: any) {
            console.error("Registration error:", err);

            if (err?.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                Object.keys(backendErrors).forEach((field) => {
                    form.setError(field as keyof FormData, {
                        type: "manual",
                        message: backendErrors[field][0],
                    });
                });
            } else {
                toast.error(err?.response?.data?.message || "Registration failed. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-900">
            <div className="layout-container flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between whitespace-nowrap px-6 sm:px-10 lg:px-16 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-slate-50">
                        <svg
                            className="h-6 w-6 text-primary"
                            fill="none"
                            viewBox="0 0 48 48"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g clipPath="url(#clip0_6_319)">
                                <path
                                    d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                                    fill="currentColor"
                                />
                            </g>
                            <defs>
                                <clipPath id="clip0_6_319">
                                    <rect fill="white" height="48" width="48" />
                                </clipPath>
                            </defs>
                        </svg>
                        <h2 className="text-slate-900 dark:text-slate-50 text-xl font-bold leading-tight tracking-[-0.015em]">
                            ServiceManager
                        </h2>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-73px)]">
                        {/* Left Side - Image and Text (hidden on mobile) */}
                        <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-900/50">
                            <div className="max-w-md w-full">
                                <img
                                    className="w-full h-auto rounded-xl object-cover shadow-lg aspect-square"
                                    src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&h=600&fit=crop"
                                    alt="Shop management dashboard"
                                />
                                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-slate-50">
                                    Join thousands of successful shop owners
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    Your business management, simplified. Access all the tools you need to grow and
                                    connect with your customers.
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-4 w-full bg-white dark:bg-slate-900">
                            <div className="max-w-lg w-full mx-auto -mt-8">
                                <div className="flex flex-col gap-0 mb-2">
                                    <h1 className="text-slate-900 dark:text-slate-50 text-xl font-black leading-tight tracking-[-0.033em]">
                                        Create Your Shop Owner Account
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs font-normal leading-normal">
                                        Manage your services and connect with customers.
                                    </p>
                                </div>

                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(handleSubmitData)}
                                        className="flex flex-col gap-1.5"
                                        noValidate
                                    >
                                        {/* Single Column Layout for All Fields */}
                                        <div className="flex flex-col gap-1.5">
                                            {/* Full Name */}
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Full Name *
                                                        </Label>
                                                        <Input
                                                            {...field}
                                                            placeholder="Enter your full name"
                                                            className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Mobile Number */}
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Mobile Number *
                                                        </Label>
                                                        <Input
                                                            {...field}
                                                            type="tel"
                                                            placeholder="Enter your mobile number"
                                                            className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Shop Name */}
                                            <FormField
                                                control={form.control}
                                                name="company_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Shop Name
                                                        </Label>
                                                        <Input
                                                            {...field}
                                                            placeholder="Enter your shop name"
                                                            className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Email (Mandatory) */}
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Email *
                                                        </Label>
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            placeholder="Enter your email address"
                                                            className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            disabled={isSubmitting}
                                                        />
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Password */}
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Password *
                                                        </Label>
                                                        <div className="relative flex items-center">
                                                            <Input
                                                                {...field}
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="Create a password"
                                                                className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-9"
                                                                disabled={isSubmitting}
                                                                autoComplete="new-password"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-0 h-full px-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                                                onClick={() => setShowPassword((prev) => !prev)}
                                                                disabled={isSubmitting}
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Confirm Password */}
                                            <FormField
                                                control={form.control}
                                                name="password_confirmation"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                            Confirm Password *
                                                        </Label>
                                                        <div className="relative flex items-center">
                                                            <Input
                                                                {...field}
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                placeholder="Re-enter your password"
                                                                className="w-full h-8 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-9"
                                                                disabled={isSubmitting}
                                                                autoComplete="new-password"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-0 h-full px-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                                disabled={isSubmitting}
                                                            >
                                                                {showConfirmPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Address - Full Width (Optional) */}
                                        {/* <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label className="text-slate-900 dark:text-slate-50 text-xs font-medium">
                                                        Shop Address <span className="text-slate-500 dark:text-slate-400 font-normal">(Optional)</span>
                                                    </Label>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your complete shop address"
                                                        className="w-full h-9 rounded-lg text-sm text-slate-900 dark:text-slate-50 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                        disabled={isSubmitting}
                                                    />
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        /> */}

                                        {/* Terms Checkbox */}
                                        {/* <FormField
                                            control={form.control}
                                            name="terms"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-start gap-2">
                                                        <Checkbox
                                                            id="terms-checkbox"
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/50"
                                                        />
                                                        <Label
                                                            htmlFor="terms-checkbox"
                                                            className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer leading-tight"
                                                        >
                                                            By creating an account, you agree to our{" "}
                                                            <a
                                                                href="#"
                                                                className="font-medium text-blue-600 hover:underline"
                                                                onClick={(e) => e.preventDefault()}
                                                            >
                                                                Terms of Service
                                                            </a>{" "}
                                                            and{" "}
                                                            <a
                                                                href="#"
                                                                className="font-medium text-blue-600 hover:underline"
                                                                onClick={(e) => e.preventDefault()}
                                                            >
                                                                Privacy Policy
                                                            </a>
                                                            .
                                                        </Label>
                                                    </div>
                                                    <FormMessage className="text-xs ml-6" />
                                                </FormItem>
                                            )}
                                        /> */}

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="w-full mt-2 h-10 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        />
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Create Account"
                                            )}
                                        </Button>

                                        {/* Login Link - Below Create Account Button */}
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                Already have an account?
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={() => navigate("/login")}
                                                variant="link"
                                                className="h-auto p-0 text-sm font-semibold text-primary hover:text-primary/90 dark:text-primary/80 dark:hover:text-primary"
                                            >
                                                Log In
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
