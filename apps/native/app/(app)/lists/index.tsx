import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { apiGetUserLists, type ApiListRow } from '@/lib/server-api';
import { useStableGetToken } from '@/lib/use-stable-token';
import { Link, Stack } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

export default function ListsScreen() {
  const getToken = useStableGetToken();
  const [lists, setLists] = React.useState<ApiListRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGetUserLists(getToken);
      setLists(data.lists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: 'Lists' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 mt-safe" keyboardDismissMode="interactive">
        <View className="flex-row items-center justify-between">
          <Text variant="h2" className="border-0 pb-0">
            Your lists
          </Text>
          <Button size="sm" variant="outline" onPress={load} disabled={loading}>
            <Text>Refresh</Text>
          </Button>
        </View>

        {error ? (
          <Card className="py-4">
            <CardContent className="gap-1">
              <Text className="font-medium text-destructive">Couldn’t load lists</Text>
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

        {!loading && !error && lists.length === 0 ? (
          <Card className="py-4">
            <CardContent>
              <Text variant="muted">No lists yet.</Text>
            </CardContent>
          </Card>
        ) : null}

        {lists.map((list) => (
          <Link
            key={list.id}
            href={{ pathname: '/lists/[id]', params: { id: String(list.id) } } as any}
            asChild>
            <Button variant="ghost" className="h-auto w-full items-stretch justify-start p-0">
              <Card className="w-full py-4">
                <CardHeader className="gap-1">
                  <CardTitle>{list.title}</CardTitle>
                  {list.description ? <CardDescription>{list.description}</CardDescription> : null}
                </CardHeader>
                <CardContent>
                  <Text variant="muted">
                    {Number.parseInt(list.item_count ?? '0', 10) || 0} items
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
