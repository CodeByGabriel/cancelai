export {};

declare global {
  interface Window {
    __pluggyCallback?: (itemId: string) => void;
  }
}
