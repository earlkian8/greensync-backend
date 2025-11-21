import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
  Menu,
  X,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/Components/ui/collapsible';
import Logo2 from './../../assets/logo2.png';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';

export default function AuthenticatedLayout({ breadcrumbs = [], children }) {
  const user = usePage().props.auth.user;
  const { flash } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);

  useEffect(() => {
    if (flash.success) {
      toast.success(flash.success);
    }
  }, [flash]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.menu-button')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  const navigationItems = [
    {
      title: 'Dashboard',
      url: route('dashboard'),
      icon: LayoutDashboard,
      routeName: 'dashboard',
      type: 'single'
    },
    {
      title: 'Resident Management',
      url: route('admin.resident-management.index'),
      icon: Users,
      routeName: 'admin.resident-management.*',
      type: 'single'
    },
    {
      title: 'Collector Management',
      url: route('admin.collector-management.index'),
      icon: Truck,
      routeName: 'admin.collector-management.*',
      type: 'single'
    },
    {
      title: 'Waste Bin Management',
      url: route('admin.waste-bin-management.index'),
      icon: Trash2,
      routeName: 'admin.waste-bin-management.*',
      type: 'single'
    },
    {
      title: 'Collection Schedule Management',
      url: route('admin.collection-schedule-management.index'),
      icon: Calendar,
      routeName: 'admin.collection-schedule-management.*',
      type: 'single'
    },
    {
      title: 'Route Management',
      url: route('admin.route-management.index'),
      icon: MapPin,
      routeName: 'admin.route-management.*',
      type: 'single'
    },
    {
      title: 'Route Assignment',
      url: route('admin.route-assignment-management.index'),
      icon: Layers,
      routeName: 'admin.route-assignment-management.*',
      type: 'single'
    },
    {
      title: 'Request Management',
      url: route('admin.collection-request-management.index'),
      icon: FileText,
      routeName: 'admin.collection-request-management.*',
      type: 'single'
    },
    // {
    //   title: 'Notification & Announcement',
    //   url: route('admin.notification-management.index'),
    //   icon: Bell,
    //   routeName: 'admin.notification-management.*',
    //   type: 'single'
    // },
    {
      title: 'Reporting',
      url: route('admin.reporting.index'),
      icon: BarChart2,
      routeName: 'admin.reporting.*',
      type: 'single'
    },
    {
      title: 'User Management',
      icon: Key,
      type: 'collapsible',
      isOpen: userManagementOpen,
      setIsOpen: setUserManagementOpen,
      items: [
        {
          title: 'User Accounts',
          url: route('user-management.users.index'),
          routeName: 'user-management.users.*',
          icon: Users
        },
        {
          title: 'Roles & Permissions',
          url: route('user-management.roles-and-permissions.index'),
          routeName: 'user-management.roles-and-permissions.*',
          icon: Key
        },
        {
          title: 'Activity Logs',
          url: route('user-management.activity-logs.index'),
          routeName: 'user-management.activity-logs.*',
          icon: FileText
        },
      ]
    }
  ];

  const renderNavigationItem = (item) => {
    if (item.type === 'single') {
      const isActive = Array.isArray(item.routeName)
        ? item.routeName.some(routeName => route().current(routeName))
        : route().current(item.routeName);
      const Icon = item.icon;

      return (
        <Link
          key={item.title}
          href={item.url}
          className={`
            group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
            ${isActive
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-700 hover:text-white hover:bg-green-600'
            }
            ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
          `}
          title={sidebarCollapsed ? item.title : undefined}
        >
          <Icon className={`flex-shrink-0 h-5 w-5 ${sidebarCollapsed ? 'lg:mr-0' : 'mr-3'}`} />
          <span className={`truncate transition-opacity duration-200 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            {item.title}
          </span>
        </Link>
      );
    }

    if (item.type === 'collapsible') {
      const Icon = item.icon;
      const hasActiveChild = item.items.some(subItem => {
        if (Array.isArray(subItem.routeName)) {
          return subItem.routeName.some(routeName => route().current(routeName));
        } else {
          return route().current(subItem.routeName);
        }
      });

      return (
        <Collapsible
          key={item.title}
          open={item.isOpen}
          onOpenChange={item.setIsOpen}
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <button
              className={`
                group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${hasActiveChild
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:text-white hover:bg-green-600'
                }
                ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
              `}
              title={sidebarCollapsed ? item.title : undefined}
            >
              <Icon className={`flex-shrink-0 h-5 w-5 ${sidebarCollapsed ? 'lg:mr-0' : 'mr-3'}`} />
              <span className={`truncate transition-opacity duration-200 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                {item.title}
              </span>
              {!sidebarCollapsed && (
                <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`} />
              )}
            </button>
          </CollapsibleTrigger>

          {!sidebarCollapsed && (
            <CollapsibleContent className="space-y-1">
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-300 pl-4">
                {item.items.map((subItem) => {
                  const isActive = Array.isArray(subItem.routeName)
                    ? subItem.routeName.some(routeName => route().current(routeName))
                    : route().current(subItem.routeName);
                  const SubIcon = subItem.icon;

                  return (
                    <Link
                      key={subItem.title}
                      href={subItem.url}
                      className={`
                        group flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200
                        ${isActive
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-700 hover:text-white hover:bg-green-600'
                        }
                      `}
                    >
                      <SubIcon className="flex-shrink-0 h-4 w-4 mr-2" />
                      <span className="truncate">{subItem.title}</span>
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      );
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between relative z-50">
        <div className="flex items-center space-x-4">
          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className='h-6 w-6' />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-button lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <img src={Logo2} className="h-10 w-10 object-contain" alt="GreenSync Logo" />
            <div className="ml-3 hidden sm:block">
              <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                GreenSync
              </div>
              <div className="text-xs font-medium text-green-600/70 tracking-wide">
                Waste Management System
              </div>
            </div>
          </div>
        </div>

        {/* Header content */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-green-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={route('profile.edit')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={route('logout')} method="post" as="button">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          sidebar bg-white border-r border-gray-200 flex-shrink-0 py-2 
          ${sidebarOpen ? 'fixed inset-y-0 left-0 z-40 w-64' : 'hidden'} 
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          lg:relative lg:flex lg:z-auto
          transform transition-all duration-300 ease-in-out
        `}>
          <div className="flex flex-col h-full w-full">
            {/* Sidebar header - only show on mobile when open */}
            <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => renderNavigationItem(item))}
            </nav>

            {/* Sidebar footer */}
            <div className="py-2 flex justify-center items-center border-t border-gray-200">
              {!sidebarCollapsed ? (
                <span className="text-xs text-gray-500">{user.email}</span>
              ) : (
                <span className='p-[11px]'></span>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Content area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-7xl">
              {breadcrumbs.length > 0 && (
                <div className='sm:mx-9 max-lg:mx-0 mb-6'>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {breadcrumbs[breadcrumbs.length - 1].name}
                  </h1>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Link href={route('dashboard')} className="text-gray-500 hover:text-gray-700">
                      <Home className="h-4 w-4" />
                    </Link>
                    {breadcrumbs.map((item, index) => (
                      <span key={index} className="inline-flex items-center">
                        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="text-gray-700">{item.name}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {children}
              <Toaster position="top-right" />
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
              <p>&copy; 2025 GreenSync. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}