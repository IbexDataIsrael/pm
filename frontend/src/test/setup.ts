import "@testing-library/jest-dom";

// Node 26 exposes a native `localStorage` global that is undefined unless the
// `--localstorage-file` flag is set, which shadows the jsdom implementation and
// leaves `window.localStorage` unusable in tests. Provide an in-memory store when
// one is not available.
if (window.localStorage == null) {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
}
