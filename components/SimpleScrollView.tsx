import type { PropsWithChildren, ReactElement } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function SimpleScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <ThemedView
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
          ]}>
          {headerImage}
        </ThemedView>
        <ThemedView style={styles.content}>
          {children}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
  },
});

