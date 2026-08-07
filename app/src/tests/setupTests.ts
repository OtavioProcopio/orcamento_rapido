import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// jsdom não expõe structuredClone; fake-indexeddb (usado para testar o
// storageAdapter contra um IndexedDB real) depende dele para clonar valores
// gravados. Os dados persistidos pelo app são sempre JSON-serializáveis.
if (!globalThis.structuredClone) {
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T;
}
