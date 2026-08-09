import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";
import { __resetStorageMigrationCacheForTests } from "../storage/storageAdapter";

// Cada teste simula uma "sessão" de navegador nova (localStorage/IndexedDB
// limpos), mas os caches de promise de migração do storageAdapter vivem no
// módulo — sem resetar aqui, só o primeiro teste de cada arquivo migraria de
// verdade.
beforeEach(() => {
  __resetStorageMigrationCacheForTests();
});

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
