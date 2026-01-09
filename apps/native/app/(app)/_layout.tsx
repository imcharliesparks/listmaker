import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppMenuBar } from '@/components/app-menu-bar';
import { UserMenu } from '@/components/user-menu';
import { Stack } from 'expo-router';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';

const SCREEN_OPTIONS = {
  headerShadowVisible: false,
  headerRight: () => <HeaderRight />,
};

export default function AppLayout() {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <Stack screenOptions={SCREEN_OPTIONS} />
      </View>
      <AppMenuBar />
    </View>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function HeaderRight() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-row items-center gap-1 pr-2">
      <Button onPress={toggleColorScheme} size="icon" variant="ghost" className="rounded-full">
        <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
      </Button>
      <UserMenu />
    </View>
  );
}
