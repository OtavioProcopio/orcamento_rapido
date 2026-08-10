import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";
import { BroadcastChannel } from "worker_threads";
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

// jsdom (diferente de um navegador de verdade) também não implementa
// BroadcastChannel, usado por utils/tabSync.ts pra avisar outras abas sobre
// mudanças no storage. O Node real tem uma implementação própria — mas ela
// mantém o handle referenciado por padrão, o que trava o processo do Jest
// esperando o event loop esvaziar (o app nunca fecha o channel; numa aba de
// navegador de verdade isso não importa, ela só é descartada no unload).
// unref() sozinho não bloqueia o teste, então some quando ninguém mais o usa.
if (!globalThis.BroadcastChannel) {
  class UnrefBroadcastChannel extends BroadcastChannel {
    constructor(name: string) {
      super(name);
      this.unref();
    }
  }

  globalThis.BroadcastChannel =
    UnrefBroadcastChannel as unknown as typeof globalThis.BroadcastChannel;
}
