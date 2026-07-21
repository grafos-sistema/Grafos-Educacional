'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  BookOpenIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Dashboard',
    href: '/super-admin/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Categorias',
    href: '/super-admin/question-categories',
    icon: FolderIcon,
  },
  {
    name: 'Questões',
    href: '/super-admin/questions',
    icon: BookOpenIcon,
  },
  {
    name: 'Estatísticas',
    href: '/super-admin/statistics',
    icon: ChartBarIcon,
    disabled: true,
  },
];

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen w-64 fixed left-0 top-16 p-4">
      <div className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
                <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  Em breve
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-grafos-teal to-grafos-blue text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
        <h4 className="text-sm font-semibold text-info-900 dark:text-info-100 mb-1">
          Super Administrador
        </h4>
        <p className="text-xs text-info-700 dark:text-info-300">
          Acesso total ao sistema de banco de questões
        </p>
      </div>
    </nav>
  );
}
