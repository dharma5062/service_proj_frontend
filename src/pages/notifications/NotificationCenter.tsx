// import { useState } from 'react';
// import { Search, Bell, MessageSquare, Calendar, Monitor, CheckCircle2, Mail } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { cn } from '@/lib/utils';

// interface Notification {
//     id: string;
//     type: 'booking' | 'message' | 'system' | 'service_update';
//     title: string;
//     description: string;
//     time: string;
//     isRead: boolean;
// }

// const NotificationCenter = () => {
//     const [searchQuery, setSearchQuery] = useState('');

//     const notifications: Notification[] = [
//         {
//             id: '1',
//             type: 'booking',
//             title: 'New booking request from John Doe',
//             description: "Received for 'Deep Tissue Massage' on Oct 26.",
//             time: '5m ago',
//             isRead: false,
//         },
//         {
//             id: '2',
//             type: 'message',
//             title: 'New message from Alex Ray',
//             description: 'Regarding their upcoming appointment.',
//             time: '1h ago',
//             isRead: false,
//         },
//         {
//             id: '3',
//             type: 'system',
//             title: 'System Maintenance',
//             description: 'The platform will be temporarily unavailable on Saturday at 2 AM.',
//             time: '1d ago',
//             isRead: true,
//         },
//         {
//             id: '4',
//             type: 'service_update',
//             title: "Service for Jane Smith marked as 'Completed'",
//             description: "'Haircut and Style' service updated.",
//             time: '2d ago',
//             isRead: true,
//         },
//         {
//             id: '5',
//             type: 'booking',
//             title: 'New booking request from Mike Chan',
//             description: "Received for 'Manicure' on Oct 29.",
//             time: '3d ago',
//             isRead: true,
//         },
//     ];

//     const getNotificationIcon = (type: Notification['type']) => {
//         switch (type) {
//             case 'booking':
//                 return <Calendar className="h-4 w-4 text-blue-600" />;
//             case 'message':
//                 return <MessageSquare className="h-4 w-4 text-blue-600" />;
//             case 'system':
//                 return <Monitor className="h-4 w-4 text-gray-600" />;
//             case 'service_update':
//                 return <CheckCircle2 className="h-4 w-4 text-green-600" />;
//             default:
//                 return <Bell className="h-4 w-4 text-blue-600" />;
//         }
//     };

//     const renderNotifications = (filter: 'all' | 'unread' | 'service' | 'customer' | 'system') => {
//         const filtered = notifications.filter((notif) => {
//             if (filter === 'unread') return !notif.isRead;
//             if (filter === 'service') return notif.type === 'booking' || notif.type === 'service_update';
//             if (filter === 'customer') return notif.type === 'message';
//             if (filter === 'system') return notif.type === 'system';
//             return true;
//         });

//         if (filtered.length === 0) {
//             return (
//                 <div className="text-center py-8">
//                     <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
//                     <p className="text-xs text-gray-600">No notifications found</p>
//                 </div>
//             );
//         }

//         return (
//             <div className="space-y-3">
//                 {filtered.map((notification) => (
//                     <div
//                         key={notification.id}
//                         className={cn(
//                             'bg-white rounded-lg border p-3 hover:shadow-md transition-shadow cursor-pointer',
//                             !notification.isRead && 'border-l-4 border-l-blue-600'
//                         )}
//                     >
//                         <div className="flex items-start gap-3">
//                             {/* Icon */}
//                             <div className="relative mt-1">
//                                 <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
//                                     {getNotificationIcon(notification.type)}
//                                 </div>
//                                 {!notification.isRead && (
//                                     <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full border-2 border-white" />
//                                 )}
//                             </div>

//                             {/* Content */}
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-start justify-between gap-3">
//                                     <div className="flex-1">
//                                         <h3
//                                             className={cn(
//                                                 'text-xs mb-1',
//                                                 !notification.isRead
//                                                     ? 'font-semibold text-gray-900'
//                                                     : 'font-medium text-gray-700'
//                                             )}
//                                         >
//                                             {notification.title}
//                                         </h3>
//                                         <p className="text-xs text-gray-600">{notification.description}</p>
//                                     </div>
//                                     <span className="text-xs text-gray-500 whitespace-nowrap">
//                                         {notification.time}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         );
//     };

//     const unreadCount = notifications.filter((n) => !n.isRead).length;
//     const serviceCount = notifications.filter((n) => n.type === 'booking' || n.type === 'service_update').length;

//     return (
//         <div className="p-0">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-4">
//                 <div>
//                     <h1 className="text-lg font-bold text-gray-900 tracking-tight">Notification Center</h1>
//                     <p className="text-xs text-blue-600 mt-1">Stay updated with all your notifications</p>
//                 </div>
//                 <Button className="bg-blue-600 hover:bg-blue-700 text-sm">Mark All as Read</Button>
//             </div>

//             {/* Search */}
//             <div className="relative mb-4">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <Input
//                     placeholder="Search notifications..."
//                     className="pl-10 bg-white text-sm h-9"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//             </div>

//             {/* Tabs */}
//             <Tabs defaultValue="all" className="w-full">
//                 <TabsList className="mb-4">
//                     <TabsTrigger value="all" className="gap-2 text-sm">
//                         <Bell className="h-3 w-3" />
//                         All
//                         <Badge className="ml-1 bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">
//                             {notifications.length}
//                         </Badge>
//                     </TabsTrigger>
//                     <TabsTrigger value="unread" className="gap-2 text-sm">
//                         <Mail className="h-3 w-3" />
//                         Unread
//                         {unreadCount > 0 && (
//                             <Badge className="ml-1 bg-blue-600 text-white hover:bg-blue-600 text-xs">
//                                 {unreadCount}
//                             </Badge>
//                         )}
//                     </TabsTrigger>
//                     <TabsTrigger value="service" className="gap-2 text-sm">
//                         <Calendar className="h-3 w-3" />
//                         Services
//                         <Badge className="ml-1 bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs">
//                             {serviceCount}
//                         </Badge>
//                     </TabsTrigger>
//                     <TabsTrigger value="customer" className="gap-2 text-sm">
//                         <MessageSquare className="h-3 w-3" />
//                         Messages
//                     </TabsTrigger>
//                     <TabsTrigger value="system" className="gap-2 text-sm">
//                         <Monitor className="h-3 w-3" />
//                         System
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="all">{renderNotifications('all')}</TabsContent>
//                 <TabsContent value="unread">{renderNotifications('unread')}</TabsContent>
//                 <TabsContent value="service">{renderNotifications('service')}</TabsContent>
//                 <TabsContent value="customer">{renderNotifications('customer')}</TabsContent>
//                 <TabsContent value="system">{renderNotifications('system')}</TabsContent>
//             </Tabs>
//         </div>
//     );
// };

// export default NotificationCenter;
