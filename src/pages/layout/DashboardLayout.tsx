import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
};

const DashboardLayout = () => {
    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset className="flex flex-col h-screen">
                <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background sticky top-0 z-10">
                    {/* Left side - Sidebar trigger */}
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                    </div>

                    {/* Right side - Notifications and Profile */}
                    <div className="flex items-center gap-4">
                        {/* Notification Icon */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-md">
                                    <Bell className="h-4 w-4" />
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                                    <span className="sr-only">Notifications</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex flex-col items-start p-3">
                                    <p className="text-sm font-medium">New service request</p>
                                    <p className="text-xs text-gray-500">SR001 has been created</p>
                                    <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start p-3">
                                    <p className="text-sm font-medium">Staff update</p>
                                    <p className="text-xs text-gray-500">John Doe completed a task</p>
                                    <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start p-3">
                                    <p className="text-sm font-medium">Promotion ending soon</p>
                                    <p className="text-xs text-gray-500">Summer Sale ends in 2 days</p>
                                    <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="justify-center text-blue-600">
                                    View all notifications
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Profile Icon */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                                            JD
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">John Doe</p>
                                        <p className="text-xs text-gray-500">john.doe@example.com</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    <span onClick={handleLogout}>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <ScrollArea className="flex-1">
                    <main className="p-3 bg-gray-50 min-h-full">
                        <Outlet />
                    </main>
                </ScrollArea>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DashboardLayout;
