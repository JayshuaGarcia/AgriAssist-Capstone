declare module 'expo-router' {
  // Add only the exports you use, or use 'any' for a quick fix
  export const useRouter: () => {
    push: (route: string) => void;
    replace: (route: string) => void;
    back: () => void;
    canGoBack: () => boolean;
  };
  export const Link: React.ComponentType<any>;
  export const Stack: React.ComponentType<any> & {
    Screen: React.ComponentType<any>;
  };
  export const Tabs: React.ComponentType<any> & {
    Screen: React.ComponentType<any>;
  };
  export type Href = string;
  // Add more exports as needed
} 