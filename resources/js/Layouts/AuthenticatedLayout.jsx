import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  LayoutDashboard,
  Settings,
  ChevronRight,
  LogOut,
  ChevronDown,
  Users,
  FileText,
  Trash2,
  Calendar,
  MapPin,
  Truck,
  Layers,
  Bell,
  BarChart2,
  Key,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Logo2 from './../../assets/logo2.png';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { useEffect } from 'react';
export default function AuthenticatedLayout({ breadcrumbs = [], children }) {
  const user = usePage().props.auth.user;
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash]);
  const navigationItems = [
    {
      title: 'Dashboard',
      url: route('dashboard'),
      icon: LayoutDashboard,
      isActive: route().current('dashboard'),
    },
    {
      title: 'Resident Management',
      url: '#',
      icon: Users,
    },
    {
      title: 'Collector Management',
      url: '#',
      icon: Truck,
    },
    {
      title: 'Waste Bin Management',
      url: '#',
      icon: Trash2,
    },
    {
      title: 'Collection Schedule Management',
      url: '#',
      icon: Calendar,
    },
    {
      title: 'Route Management',
      url: '#',
      icon: MapPin,
    },
    {
      title: 'Route Assignment',
      url: '#',
      icon: Layers,
    },
    {
      title: 'Request Management',
      url: '#',
      icon: FileText,
    },
    {
      title: 'Notification & Announcement',
      url: '#',
      icon: Bell,
    },
    {
      title: 'Reporting',
      url: '#',
      icon: BarChart2,
    },
    {
      title: 'User Management',
      icon: Key,
      items: [
        { title: 'Roles & Permission Module', url: route('user-management.roles-and-permissions.index') },
        { title: 'User Management Module', url: route('user-management.users.index') },
        { title: 'Activity Log', url: route('user-management.activity-logs.index') },
      ],
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/" className='hover:text-white'>
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg border-green-600 border-2 text-primary-foreground">
                        <img
                            src={Logo2}
                            alt="Logo"
                            className="w-full h-full object-contain rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">GreenSync</span>
                      <span className="text-xs">
                        Waste Management System
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    
                    if (item.items) {
                      return (
                        <Collapsible key={item.title} asChild defaultOpen={false}>
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton>
                                <Icon className="h-4 w-4" />
                                <span>{item.title}</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <Link href={subItem.url}>
                                        {subItem.title}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.isActive}>
                          <Link href={item.url}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu className='hover:text-white'>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <div className="flex flex-col gap-0.5 leading-none text-left">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs">
                          {user.email}
                        </span>
                      </div>
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="end"
                    className="w-56"
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={route('profile.edit')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

  <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:px-8">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={route('dashboard')}>
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {!isLast && crumb.href ? (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href}>{crumb.name}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-7xl">
             {children}
            </div>
            <Toaster position="top-right"/>
          </div>

    <footer className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <p>&copy; 2025 Abdurauf Sawadjaan Engineering Consultancy. All rights reserved.</p>
      </div>
    </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}