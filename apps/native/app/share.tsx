import { SignInForm } from '@/components/sign-in-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { apiAddItem, apiGetUserLists, type ApiListRow } from '@/lib/server-api';
import { useShareIntentState } from '@/lib/share-intent-provider';
import { readLastSharedListId, writeLastSharedListId } from '@/lib/share-last-list';
import { getBestSharedUrl, isValidHttpUrl } from '@/lib/share-url';
import { useStableGetToken } from '@/lib/use-stable-token';
import { useAuth } from '@clerk/clerk-expo';
import { router, Stack } from 'expo-router';
import { CheckIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

export default function ShareReceiverScreen() {
  const { isSignedIn } = useAuth();
  const getToken = useStableGetToken();
  const { hasShareIntent, shareIntent, resetShareIntent, error: shareIntentError } = useShareIntentState();

  const [lists, setLists] = React.useState<ApiListRow[]>([]);
  const [selectedListId, setSelectedListId] = React.useState<number | null>(null);
  const [listsLoading, setListsLoading] = React.useState(false);

  const [url, setUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const lastAutoUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const sharedUrl = getBestSharedUrl(shareIntent);
    if (!sharedUrl) return;
    setUrl((current) => {
      if (current.trim().length === 0) return sharedUrl;
      if (lastAutoUrlRef.current && current === lastAutoUrlRef.current) return sharedUrl;
      return current;
    });
    lastAutoUrlRef.current = sharedUrl;
  }, [shareIntent]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const lastListId = await readLastSharedListId();
      if (!cancelled) setSelectedListId(lastListId);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLists = React.useCallback(async () => {
    if (!isSignedIn) return;
    setListsLoading(true);
    setError(null);
    try {
      const data = await apiGetUserLists(getToken);
      setLists(data.lists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setListsLoading(false);
    }
  }, [getToken, isSignedIn]);

  React.useEffect(() => {
    void loadLists();
  }, [loadLists]);

  React.useEffect(() => {
    if (selectedListId == null) return;
    if (lists.some((l) => l.id === selectedListId)) return;
    setSelectedListId(null);
  }, [lists, selectedListId]);

  const onClear = React.useCallback(() => {
    resetShareIntent();
    setUrl('');
    setError(null);
  }, [resetShareIntent]);

  const onSubmit = React.useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!selectedListId || !isValidHttpUrl(trimmedUrl)) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiAddItem(getToken, { listId: selectedListId, url: trimmedUrl });
      await writeLastSharedListId(selectedListId);
      resetShareIntent();
      router.replace({ pathname: '/lists/[id]', params: { id: String(selectedListId) } } as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  }, [getToken, resetShareIntent, selectedListId, url]);

  const title = shareIntent?.meta?.title;
  const trimmedUrl = url.trim();
  const canSubmit = isSignedIn && selectedListId != null && isValidHttpUrl(trimmedUrl) && !submitting;
  const shareIntentErrorMessage =
    shareIntentError && typeof shareIntentError === 'object' && 'message' in shareIntentError
      ? String((shareIntentError as { message?: unknown }).message)
      : String(shareIntentError);
  const hasUnsupportedShare =
    hasShareIntent &&
    !getBestSharedUrl(shareIntent) &&
    (((shareIntent?.text ?? '').trim().length > 0) || ((shareIntent?.files?.length ?? 0) > 0));

  return (
    <>
      <Stack.Screen options={{ title: 'Add item' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 mt-safe" keyboardShouldPersistTaps="handled">
        {shareIntentError ? (
          <Card className="py-4">
            <CardContent className="gap-1">
              <Text className="font-medium text-destructive">Share intent failed</Text>
              <Text variant="muted">
                {shareIntentErrorMessage}
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="py-4">
            <CardContent className="gap-1">
              <Text className="font-medium text-destructive">Something went wrong</Text>
              <Text variant="muted">{error}</Text>
            </CardContent>
          </Card>
        ) : null}

        {hasUnsupportedShare ? (
          <Card className="py-4">
            <CardContent className="gap-1">
              <Text className="font-medium">This share isn’t supported yet</Text>
              <Text variant="muted">Listmaker currently only supports saving http(s) links.</Text>
            </CardContent>
          </Card>
        ) : null}

        {!isSignedIn ? (
          <Card className="py-4">
            <CardHeader className="gap-1">
              <CardTitle>Sign in to save this</CardTitle>
              <CardDescription>You’ll return here after signing in.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <SignInForm />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="py-4">
              <CardHeader className="gap-1">
                <CardTitle>Item</CardTitle>
                {hasShareIntent ? (
                  <CardDescription>Review and choose a list.</CardDescription>
                ) : (
                  <CardDescription>Paste a URL, or share to this app from another app.</CardDescription>
                )}
              </CardHeader>
              <CardContent className="gap-3">
                {title ? (
                  <View className="gap-1">
                    <Text className="font-medium" numberOfLines={2}>
                      {title}
                    </Text>
                    <Separator />
                  </View>
                ) : null}

                <View className="gap-1.5">
                  <Label nativeID="share-url">URL</Label>
                  <Input
                    aria-labelledby="share-url"
                    placeholder="https://..."
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                  {trimmedUrl.length > 0 && !isValidHttpUrl(trimmedUrl) ? (
                    <Text className="text-sm font-medium text-destructive">
                      Enter a valid http(s) URL.
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row gap-2">
                  <Button onPress={onSubmit} disabled={!canSubmit} className="flex-1">
                    <Text>{submitting ? 'Saving.' : 'Save to list'}</Text>
                  </Button>
                  <Button onPress={onClear} variant="outline" disabled={submitting} size="icon">
                    <Icon as={XIcon} className="size-5" />
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card className="py-4">
              <CardHeader className="gap-1">
                <View className="flex-row items-center justify-between">
                  <CardTitle>Choose list</CardTitle>
                  <Button size="sm" variant="outline" onPress={loadLists} disabled={listsLoading}>
                    <Text>Refresh</Text>
                  </Button>
                </View>
              </CardHeader>
              <CardContent className="gap-2">
                {listsLoading ? <Text variant="muted">Loading.</Text> : null}
                {!listsLoading && lists.length === 0 ? <Text variant="muted">No lists yet.</Text> : null}
                {lists.map((list) => {
                  const selected = selectedListId === list.id;
                  return (
                    <Button
                      key={list.id}
                      variant={selected ? 'secondary' : 'ghost'}
                      className="h-auto w-full items-start justify-start px-3 py-3"
                      onPress={() => setSelectedListId(list.id)}>
                      <View className="w-full flex-row items-start gap-2">
                        <View className="mt-0.5">
                          {selected ? <Icon as={CheckIcon} className="size-5 text-primary" /> : null}
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="font-medium">{list.title}</Text>
                          {list.description ? <Text variant="muted">{list.description}</Text> : null}
                        </View>
                      </View>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );
}
