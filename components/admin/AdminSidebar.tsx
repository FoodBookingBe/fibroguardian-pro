'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UsersIcon, CreditCardIcon, ChartBarIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'; // Using Heroicons

const navigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Gebruikersbeheer', href: '/admin/users', icon: UsersIcon },
  { name: 'Abonnementen', href: '/admin/subscriptions', icon: CreditCardIcon },
  { name: 'Statistieken', href: '/admin/statistics', icon: ChartBarIcon },
];

const secondaryNavigation = [
    { name: 'Terug naar App', href: '/dashboard', icon: ArrowUturnLeftIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-purple-700 px-6 w-64"> {/* Adjusted color and width */}
      <div className="flex h-16 shrink-0 items-center">
        {/* Optional: Admin Logo or Title */}
        <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      pathname === item.href
                        ? 'bg-purple-800 text-white'
                        : 'text-purple-100 hover:text-white hover:bg-purple-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
             <ul role="list" className="-mx-2 space-y-1">
                {secondaryNavigation.map((item) => (
                    <li key={item.name}>
                    <Link
                        href={item.href}
                        className={classNames(
                        pathname === item.href
                            ? 'bg-purple-800 text-white'
                            : 'text-purple-100 hover:text-white hover:bg-purple-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                    >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                    </Link>
                    </li>
                ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
