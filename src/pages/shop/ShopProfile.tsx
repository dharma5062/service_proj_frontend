import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const ShopProfile = () => {
    const { handleSubmit } = useForm();

    const onSubmit = (data: any) => {
        console.log(data);
    };

    return (
        <div className="p-0">
            <div className="mb-4">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Complete Your Shop Profile</h1>
                <p className="text-xs text-blue-600 mt-1">Add these crucial details to help customers find and trust your business.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Shop Address */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-900">Shop Address</h2>

                    <div className="space-y-2">
                        <Label htmlFor="address1" className="text-xs">Address Line 1</Label>
                        <Input id="address1" placeholder="e.g., 123 Main Street" className="bg-white text-sm" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address2" className="text-xs">Address Line 2 (Optional)</Label>
                        <Input id="address2" placeholder="e.g., Suite 100" className="bg-white text-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-xs">City</Label>
                            <Input id="city" placeholder="e.g., San Francisco" className="bg-white text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-xs">State / Province</Label>
                            <Input id="state" placeholder="e.g., California" className="bg-white text-sm" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-xs">Postal Code</Label>
                        <Input id="postalCode" placeholder="e.g., 94103" className="bg-white text-sm" />
                    </div>
                </section>

                {/* Business Information */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-900">Business Information</h2>

                    <div className="space-y-2">
                        <Label htmlFor="gst" className="text-xs">GST / Business ID</Label>
                        <Input id="gst" placeholder="Enter your business ID" className="bg-white text-sm" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="noGst" />
                        <label
                            htmlFor="noGst"
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-600"
                        >
                            I don't have a GST / Business ID
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">This information is used for invoicing and business verification purposes.</p>
                </section>

                {/* Working Hours */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-gray-900">Working Hours</h2>
                        <button type="button" className="text-xs text-blue-600 hover:underline">Apply to all days</button>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                            <div className="col-span-3">Day</div>
                            <div className="col-span-4">Opening Time</div>
                            <div className="col-span-4">Closing Time</div>
                            <div className="col-span-1 text-center">Status</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y">
                            {daysOfWeek.map((day, index) => (
                                <div key={day} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-gray-50 transition-colors">
                                    <div className="col-span-3 text-xs font-medium text-gray-900">
                                        {day.substring(0, 3)}
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            type="time"
                                            className="h-8 text-xs bg-white border-gray-200"
                                            defaultValue="09:00"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            type="time"
                                            className="h-8 text-xs bg-white border-gray-200"
                                            defaultValue="17:00"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Checkbox
                                            id={`open-${day}`}
                                            defaultChecked={index < 5}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Check the box to mark the day as open. Uncheck to mark as closed.</p>
                </section>

                <div className="flex justify-end pt-3 border-t border-gray-200 gap-3">
                    <Button type="button" variant="ghost" className="text-sm">Skip for now</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm">Save Profile</Button>
                </div>
            </form>
        </div>
    );
};

export default ShopProfile;
