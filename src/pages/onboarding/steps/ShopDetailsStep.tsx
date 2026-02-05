import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Store, User, Phone, Mail, MapPin, FileText, ArrowRight, Briefcase } from 'lucide-react';
import { OnboardingData } from '../ShopOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchBusinessTypes, BusinessType } from '@/pages/serviceAPI/BusinessTypesAPI';

interface ShopDetailsStepProps {
    data: OnboardingData;
    updateData: (data: Partial<OnboardingData>) => void;
    onNext: () => void;
}

const ShopDetailsStep: React.FC<ShopDetailsStepProps> = ({ data, updateData, onNext }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(true);

    // Load business types on mount
    useEffect(() => {
        const loadBusinessTypes = async () => {
            try {
                const types = await fetchBusinessTypes();
                setBusinessTypes(types);
            } catch (error) {
                console.error('Failed to load business types:', error);
                toast.error('Failed to load business types');
            } finally {
                setLoadingBusinessTypes(false);
            }
        };
        loadBusinessTypes();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleImageUpload = (file: File) => {
        if (file.size > 3 * 1024 * 1024) {
            toast.error('File size must be less than 3MB');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPEG, PNG, GIF, or SVG.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            updateData({
                shopLogo: file,
                shopLogoPreview: reader.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!data.shopName.trim()) newErrors.shopName = 'Shop Name is required';
        if (!data.shopOwnerName.trim()) newErrors.shopOwnerName = 'Owner Name is required';
        if (!data.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
        if (!data.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email is invalid';

        // Basic requirement for file to simulate "completeness" though technically optional in some flows
        // newErrors.shopLogo = 'Logo is recommended'; 

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onNext();
        } else {
            toast.error('Please fill in all required fields');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tell us about your shop</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Please provide the basic details to get your shop listed on wService.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Form Fields */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="space-y-3">
                        <Label htmlFor="shopName" className="text-sm font-semibold text-gray-700">Shop Name</Label>
                        <div className="relative">
                            <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="shopName"
                                name="shopName"
                                value={data.shopName}
                                onChange={handleInputChange}
                                className={cn("pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors", errors.shopName && "border-red-500")}
                                placeholder="e.g. QuickFix Electronics"
                            />
                        </div>
                        {errors.shopName && <span className="text-xs text-red-500 pl-1">{errors.shopName}</span>}
                    </div>

                    {/* <div className="space-y-2">
                        <Label htmlFor="tagline" className="text-sm font-semibold text-gray-700">Tagline (Optional)</Label>
                        <Textarea
                            id="tagline"
                            name="tagline"
                            value={data.tagline || ''}
                            onChange={handleInputChange}
                            className="min-h-[60px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            placeholder="A short description about your shop..."
                        />
                    </div> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shopOwnerName" className="text-sm font-semibold text-gray-700">Owner Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="shopOwnerName"
                                    name="shopOwnerName"
                                    value={data.shopOwnerName}
                                    onChange={handleInputChange}
                                    className={cn("pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors", errors.shopOwnerName && "border-red-500")}
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.shopOwnerName && <span className="text-xs text-red-500 pl-1">{errors.shopOwnerName}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={data.phoneNumber}
                                    onChange={handleInputChange}
                                    className={cn("pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors", errors.phoneNumber && "border-red-500")}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            {errors.phoneNumber && <span className="text-xs text-red-500 pl-1">{errors.phoneNumber}</span>}
                        </div>
                    </div>

                    {/* Business Email and Business Type Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Business Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    value={data.email}
                                    onChange={handleInputChange}
                                    className={cn("pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors", errors.email && "border-red-500")}
                                    placeholder="contact@shopname.com"
                                />
                            </div>
                            {errors.email && <span className="text-xs text-red-500 pl-1">{errors.email}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessType" className="text-sm font-semibold text-gray-700">Business Type</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                <Select
                                    value={data.businessTypeId?.toString() || ""}
                                    onValueChange={(value) => {
                                        updateData({ businessTypeId: parseInt(value) });
                                        if (errors.businessTypeId) {
                                            setErrors(prev => ({ ...prev, businessTypeId: '' }));
                                        }
                                    }}
                                    disabled={loadingBusinessTypes}
                                >
                                    <SelectTrigger className={cn("pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors", errors.businessTypeId && "border-red-500")}>
                                        <SelectValue placeholder={loadingBusinessTypes ? "Loading..." : "Select Business Type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.businessTypeId && <span className="text-xs text-red-500 pl-1">{errors.businessTypeId}</span>}
                        </div>
                    </div>

                    {/* Shop Address and GST Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Shop Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="address"
                                    name="address"
                                    value={data.address}
                                    onChange={handleInputChange}
                                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    placeholder="123 Main St, Suite 100, City, State, Zip"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gstNumber" className="text-sm font-semibold text-gray-700">GST / Tax ID (Optional)</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="gstNumber"
                                    name="gstNumber"
                                    value={data.gstNumber}
                                    onChange={handleInputChange}
                                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    placeholder="GST123456789"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Image Upload */}
                <div className="lg:col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Shop Logo</Label>
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-6 h-[280px] flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                            dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
                            data.shopLogoPreview ? "bg-white" : "bg-gray-50"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {data.shopLogoPreview ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={data.shopLogoPreview}
                                    alt="Shop Logo"
                                    className="max-h-full max-w-full object-contain rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md text-white">
                                    <Upload className="w-8 h-8 mb-2" />
                                    <span className="text-sm font-medium">Change Logo</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-100 p-4 rounded-full mb-4">
                                    <Upload className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">Click to upload or drag and drop</h3>
                                <p className="text-xs text-gray-500 mb-4">SVG, PNG, JPG or GIF (max. 3MB)</p>
                                <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                                    Select File
                                </Button>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="md:col-span-3 pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => { }}>Cancel</Button>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white min-w-[120px]">
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default ShopDetailsStep;
