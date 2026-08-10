// Todo o storage segue o padrão "lê tudo → reescreve tudo" (ver
// storageAdapter.ts): addBudget/updateClient/etc leem a lista inteira,
// aplicam a mudança em memória e regravam a lista inteira. Isso não é
// atômico entre abas — se a aba A e a aba B tiverem cada uma sua própria
// cópia em memória e ambas salvarem, a que salvar por último apaga
// silenciosamente a mudança da outra, sem aviso nenhum.
//
// BroadcastChannel não resolve isso de verdade (não há merge nem lock), mas
// dá pra pelo menos avisar: quando uma aba grava um store, as outras abas
// abertas recebem a notificação e podem mostrar "isso mudou em outro lugar,
// quer atualizar?" antes do usuário sobrescrever sem saber.
export type SyncedStore = "budgets" | "clients" | "profiles";

type SyncMessage = { store: SyncedStore };

// BroadcastChannel nunca entrega a própria mensagem pra quem a enviou — é
// exatamente o comportamento que queremos aqui (a aba que salvou não deve
// se avisar sobre a própria escrita).
let channel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel("orca-rapido-sync");
  }
  return channel;
};

export const notifyStoreChanged = (store: SyncedStore): void => {
  getChannel()?.postMessage({ store } satisfies SyncMessage);
};

export const subscribeToStoreChanges = (
  store: SyncedStore,
  onChange: () => void,
): (() => void) => {
  const ch = getChannel();
  if (!ch) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data?.store === store) {
      onChange();
    }
  };

  ch.addEventListener("message", handleMessage);
  return () => ch.removeEventListener("message", handleMessage);
};
