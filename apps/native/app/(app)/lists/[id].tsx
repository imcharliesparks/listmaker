import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { apiAddItem, apiGetListById, apiGetListItems, type ApiItem, type ApiList } from '@/lib/server-api';
import { useStableGetToken } from '@/lib/use-stable-token';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Image, ScrollView, View } from 'react-native';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = Number(id);
  const getToken = useStableGetToken();

  const [list, setList] = React.useState<ApiList | null>(null);
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newUrl, setNewUrl] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!Number.isFinite(listId)) {
      setError('Invalid list id');
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const [listData, itemsData] = await Promise.all([
        apiGetListById(getToken, listId),
        apiGetListItems(getToken, listId),
      ]);
      setList(listData.list);
      setItems(itemsData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [getToken, listId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onAddItem = React.useCallback(async () => {
    const url = newUrl.trim();
    if (!url || !Number.isFinite(listId)) return;

    setAdding(true);
    setError(null);
    try {
      await apiAddItem(getToken, { listId, url });
      setNewUrl('');
      const itemsData = await apiGetListItems(getToken, listId);
      setItems(itemsData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setAdding(false);
    }
  }, [getToken, listId, newUrl]);

  return (
    <>
      <Stack.Screen options={{ title: 'List' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 mt-safe" keyboardShouldPersistTaps="handled">
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

        {!loading && list ? (
          <Card className="py-4">
            <CardHeader className="gap-1">
              <CardTitle>{list.title}</CardTitle>
              {list.description ? <CardDescription>{list.description}</CardDescription> : null}
            </CardHeader>
          </Card>
        ) : null}

        <Card className="py-4">
          <CardHeader className="gap-1">
            <CardTitle>Add item</CardTitle>
            <CardDescription>Paste a URL to save into this list.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-1.5">
              <Label nativeID="new-item-url">URL</Label>
              <Input
                aria-labelledby="new-item-url"
                placeholder="https://..."
                value={newUrl}
                onChangeText={setNewUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={onAddItem}
              />
            </View>
            <Button onPress={onAddItem} disabled={adding || newUrl.trim().length === 0}>
              <Text>{adding ? 'Adding…' : 'Add item'}</Text>
            </Button>
          </CardContent>
        </Card>

        <View className="gap-2">
          <Text variant="h3" className="text-xl">
            Items
          </Text>
          <Separator />
        </View>

        {items.length === 0 ? (
          <Card className="py-4">
            <CardContent>
              <Text variant="muted">No items in this list yet.</Text>
            </CardContent>
          </Card>
        ) : null}

        {items.map((item) => (
          <Link
            key={item.id}
            href={{ pathname: '/items/[id]', params: { id: String(item.id) } } as any}
            asChild>
            <Button variant="ghost" className="h-auto w-full items-stretch justify-start p-0">
              <Card className="w-full py-4">
                <CardHeader className="gap-1">
                  <CardTitle numberOfLines={2}>{item.title || item.url}</CardTitle>
                  {item.description ? (
                    <CardDescription numberOfLines={2}>{item.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="gap-2">
                  {item.thumbnail_url ? (
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      resizeMode="contain"
                      className="h-44 w-full rounded-md bg-muted"
                      accessibilityLabel={item.title ?? 'Item image'}
                    />
                  ) : null}
                  <Text variant="muted" numberOfLines={1}>
                    {item.url}
                  </Text>
                </CardContent>
              </Card>
            </Button>
          </Link>
        ))}
      </ScrollView>
    </>
  );
}
