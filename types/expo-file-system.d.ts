declare module 'expo-file-system' {
  export interface ReadOptions {
    encoding?: 'utf8' | 'base64';
    position?: number;
    length?: number;
  }

  export function readAsStringAsync(fileUri: string, options?: ReadOptions): Promise<string>;
  export function getInfoAsync(fileUri: string, options?: { md5?: boolean; size?: boolean }): Promise<any>;
  export function writeAsStringAsync(fileUri: string, contents: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
  export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function makeDirectoryAsync(fileUri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(fileUri: string): Promise<string[]>;
  export function downloadAsync(uri: string, fileUri: string, options?: any): Promise<any>;
  export function uploadAsync(url: string, fileUri: string, options?: any): Promise<any>;

  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
}

declare module 'expo-file-system/legacy' {
  export interface ReadOptions {
    encoding?: 'utf8' | 'base64';
    position?: number;
    length?: number;
  }

  export function readAsStringAsync(fileUri: string, options?: ReadOptions): Promise<string>;
  export function getInfoAsync(fileUri: string, options?: { md5?: boolean; size?: boolean }): Promise<any>;
  export function writeAsStringAsync(fileUri: string, contents: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
  export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function makeDirectoryAsync(fileUri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(fileUri: string): Promise<string[]>;
  export function downloadAsync(uri: string, fileUri: string, options?: any): Promise<any>;
  export function uploadAsync(url: string, fileUri: string, options?: any): Promise<any>;

  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
}

