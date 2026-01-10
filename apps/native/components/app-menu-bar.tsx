import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, usePathname } from 'expo-router';
import { HomeIcon, ListIcon, PlusIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const MENU_ITEMS: MenuItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    isActive: (pathname) => pathname === '/' || pathname === '',
  },
  {
    href: '/lists',
    label: 'Lists',
    icon: ListIcon,
    isActive: (pathname) => pathname.startsWith('/lists'),
  },
  {
    href: '/share',
    label: 'Share',
    icon: PlusIcon,
    isActive: (pathname) => pathname.startsWith('/share'),
  },
];

export function AppMenuBar() {
  const pathname = usePathname() ?? '';

  return (
    <View className="border-t border-border bg-background pb-safe pt-2">
      <View className="flex-row gap-2 px-2">
        {MENU_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const variant = active ? 'secondary' : 'ghost';
          return (
            <Link key={item.href} href={item.href as any} asChild>
              <Button
                variant={variant}
                className="h-12 flex-1 flex-col gap-1 rounded-xl"
                accessibilityRole="button">
                <Icon as={item.icon} className="size-5" />
                <Text className="text-xs">{item.label}</Text>
              </Button>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
