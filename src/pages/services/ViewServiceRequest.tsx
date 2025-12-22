// import { useParams, useNavigate } from 'react-router-dom';
// import { ChevronRight, Printer, Send } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';

// const ViewServiceRequest = () => {
//     const { id } = useParams<{ id: string }>();
//     const navigate = useNavigate();

//     // Mock data - in real app, fetch based on id
//     const serviceRequest = {
//         id: id || 'SR-10573',
//         createdDate: 'Oct 26, 2023',
//         status: 'Diagnosing',
//         customer: {
//             name: 'Eleanor Vance',
//             phone: '(555) 123-4567',
//             email: 'eleanor.v@example.com',
//         },
//         product: {
//             name: 'Pro-Grade Espresso Machine',
//             serialNumber: 'SN-PGEM-98765B',
//             purchaseDate: 'June 15, 2022',
//             warrantyStatus: 'Active (until June 14, 2024)',
//         },
//         defect: "The machine is making a loud grinding noise during the brewing cycle and the steam wand is not producing consistent pressure. It started happening about a week ago and has gotten progressively worse. I've tried descaling it, but that hasn't helped.",
//         notes: [
//             {
//                 text: 'Initial check complete. Grinding noise confirmed. Seems to be an issue with the burr grinder alignment. Steam wand pressure is low; will investigate the thermoblock.',
//                 author: 'John Doe',
//                 timestamp: 'Oct 26, 2023, 2:15 PM',
//             },
//             {
//                 text: 'Received the request and assigned to John for diagnosis.',
//                 author: 'Sarah Chen',
//                 timestamp: 'Oct 26, 2023, 11:30 AM',
//             },
//         ],
//     };

//     const statuses = ['New', 'Diagnosing', 'In Progress', 'Ready', 'Completed'];

//     return (
//         <div className="max-w-7xl mx-auto p-3">
//             {/* Breadcrumbs */}
//             <div className="flex items-center gap-2 mb-3">
//                 <button
//                     onClick={() => navigate('/dashboard/services')}
//                     className="text-gray-500 hover:text-blue-600 text-sm font-medium"
//                 >
//                     Service Requests
//                 </button>
//                 <ChevronRight className="h-4 w-4 text-gray-400" />
//                 <span className="text-gray-800 text-sm font-medium">{serviceRequest.id}</span>
//             </div>

//             {/* Page Header */}
//             <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
//                 <div>
//                     <h1 className="text-lg font-bold text-gray-900 tracking-tights">
//                         Service Request {serviceRequest.id}
//                     </h1>
//                     <p className="text-xs text-gray-500">
//                         Created on: {serviceRequest.createdDate}
//                     </p>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button variant="outline" className="text-xs gap-2">
//                         <Printer className="h-4 w-4" />
//                         Print Label
//                     </Button>
//                     <Button className="text-xs bg-blue-600 hover:bg-blue-700 gap-2">
//                         <Send className="h-4 w-4" />
//                         Send Notification
//                     </Button>
//                 </div>
//             </div>

//             {/* Status Stepper */}
//             <div className="text-sm flex gap-2 p-1 mb-3 overflow-x-auto bg-gray-100 rounded-lg">
//                 {statuses.map((status) => (
//                     <div
//                         key={status}
//                         className={`text-sm flex h-9 flex-1 shrink-0 items-center justify-center rounded-md ${status === serviceRequest.status
//                             ? 'bg-yellow-500/20 text-yellow-700'
//                             : 'bg-transparent text-gray-500'
//                             }`}
//                     >
//                         <p className={`text-sm ${status === serviceRequest.status ? 'font-bold' : 'font-medium'}`}>
//                             {status}
//                         </p>
//                     </div>
//                 ))}
//             </div>

//             {/* Main Grid Layout */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//                 {/* Left Column */}
//                 <div className="lg:col-span-2 flex flex-col gap-3">
//                     {/* Customer Details Card */}
//                     <Card>
//                         <CardHeader className="border-b p-3">
//                             <CardTitle className="text-lg font-bold text-gray-900 tracking-tights">Customer Details</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-3">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Name</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.customer.name}</p>
//                                 </div>
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Contact Number</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.customer.phone}</p>
//                                 </div>
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Email Address</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.customer.email}</p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Product Information Card */}
//                     <Card>
//                         <CardHeader className="border-b p-3">
//                             <CardTitle className="text-lg font-bold text-gray-900 tracking-tights">Product Information</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-3">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Product Name</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.product.name}</p>
//                                 </div>
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Serial Number</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.product.serialNumber}</p>
//                                 </div>
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Purchase Date</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.product.purchaseDate}</p>
//                                 </div>
//                                 <div className="flex flex-col gap-1">
//                                     <p className="text-sm text-gray-500 font-medium">Warranty Status</p>
//                                     <p className="text-xs gray-800 font-medium">{serviceRequest.product.warrantyStatus}</p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Reported Defect Card */}
//                     <Card>
//                         <CardHeader className="border-b p-3">
//                             <CardTitle className='text-sm font-medium text-gray-700'>Reported Defect</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-3">
//                             <p className="text-xs gray-800 font-medium">{serviceRequest.defect}</p>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Right Column */}
//                 <div className="lg:col-span-1 flex flex-col gap-3">
//                     {/* Status Management Card */}
//                     <Card>
//                         <CardContent className="pt-3 flex flex-col gap-3">
//                             <h3 className="text-sm font-bold text-gray-900 tracking-tights">Status Management</h3>
//                             <div className="flex flex-col gap-2">
//                                 <label htmlFor="status-update" className="text-sm font-medium text-gray-700">
//                                     Update Status
//                                 </label>
//                                 <Select defaultValue={serviceRequest.status}>
//                                     <SelectTrigger className="text-sm">
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {statuses.map((status) => (
//                                             <SelectItem key={status} value={status}>
//                                                 {status}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                             <Button className="text-sm w-full bg-gray-800 hover:bg-gray-700">Update</Button>
//                         </CardContent>
//                     </Card>

//                     {/* Internal Notes Card */}
//                     <Card>
//                         <CardHeader className="border-b p-3">
//                             <CardTitle className='text-sm font-bold text-gray-900 tracking-tights'>Internal Notes</CardTitle>
//                         </CardHeader>
//                         <CardContent className="pt-3 flex flex-col gap-3">
//                             {serviceRequest.notes.map((note, index) => (
//                                 <div key={index}>
//                                     <div className="flex flex-col gap-1">
//                                         <p className="text-xs text-gray-800 font-medium">{note.text}</p>
//                                         <p className="text-xs text-gray-500">
//                                             {note.author} - {note.timestamp}
//                                         </p>
//                                     </div>
//                                     {index < serviceRequest.notes.length - 1 && (
//                                         <div className="border-b border-gray-200 my-2"></div>
//                                     )}
//                                 </div>
//                             ))}
//                             <div className="mt-3 flex flex-col gap-2">
//                                 <Textarea
//                                     className="text-sm min-h-[100px] bg-gray-50"
//                                     placeholder="Add a new note..."
//                                 />
//                                 <Button className="text-sm w-full bg-gray-800 hover:bg-gray-700">Add Note</Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ViewServiceRequest;
