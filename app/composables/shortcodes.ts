const registry = new Map<string, any>();

export function useShortcodes() {
  return {
    instances: registry,
    get: (name: string) => registry.get(name),
  };
}
