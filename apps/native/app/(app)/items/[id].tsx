import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { apiGetItemById, type ApiItem } from '@/lib/server-api';
import { useStableGetToken } from '@/lib/use-stable-token';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const getToken = useStableGetToken();

  const [item, setItem] = React.useState<ApiItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      if (!Number.isFinite(itemId)) {
        setError('Invalid item id');
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const data = await apiGetItemById(getToken, itemId);
        setItem(data.item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [getToken, itemId]);

  const onOpenUrl = React.useCallback(async () => {
    if (!item?.url) return;
    await Linking.openURL(item.url);
  }, [item?.url]);

  return (
    <>
      <Stack.Screen options={{ title: 'Item' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 mt-safe">
        {error ? (
          <Card className="py-4">
            <CardContent className="gap-1">
              <Text className="font-medium text-destructive">Something went wrong</Text>
              <Text variant="muted">{error}</Text>
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <Card className="py-4">
            <CardContent>
              <Text variant="muted">Loading…</Text>
            </CardContent>
          </Card>
        ) : null}

        {!loading && item ? (
          <Card className="py-4">
            <CardHeader className="gap-1">
              <CardTitle>{item.title || 'Untitled item'}</CardTitle>
              {item.description ? <CardDescription>{item.description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="gap-3">
              {item.thumbnail_url ? (
                <Image
                  source={{ uri: item.thumbnail_url }}
                  resizeMode="contain"
                  className="h-56 w-full rounded-md bg-muted"
                  accessibilityLabel={item.title ?? 'Item image'}
                />
              ) : null}
              <View className="gap-2">
                <Text variant="small" className="text-muted-foreground">
                  URL
                </Text>
                <Text className="font-mono text-sm">{item.url}</Text>
              </View>
              <Separator />
              <Button onPress={onOpenUrl}>
                <Text>Open link</Text>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}
