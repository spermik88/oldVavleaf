declare module 'zustand/middleware' {
  export function persist<S>(
    config: (set: any, get: any, api: any) => S,
    options: any
  ): any;
  export function createJSONStorage(getStorage: () => any): any;
}
