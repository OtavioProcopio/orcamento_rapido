import { notifyStoreChanged, subscribeToStoreChanges } from "../../utils/tabSync";

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("tabSync", () => {
  it("does not notify the same tab that made the change", async () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToStoreChanges("budgets", onChange);

    notifyStoreChanged("budgets");
    await flush();

    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies subscribers when another tab changes the same store", async () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToStoreChanges("budgets", onChange);
    const otherTabChannel = new BroadcastChannel("orca-rapido-sync");

    otherTabChannel.postMessage({ store: "budgets" });
    await flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    otherTabChannel.close();
    unsubscribe();
  });

  it("ignores messages about a different store", async () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToStoreChanges("budgets", onChange);
    const otherTabChannel = new BroadcastChannel("orca-rapido-sync");

    otherTabChannel.postMessage({ store: "clients" });
    await flush();

    expect(onChange).not.toHaveBeenCalled();
    otherTabChannel.close();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", async () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToStoreChanges("budgets", onChange);
    unsubscribe();

    const otherTabChannel = new BroadcastChannel("orca-rapido-sync");
    otherTabChannel.postMessage({ store: "budgets" });
    await flush();

    expect(onChange).not.toHaveBeenCalled();
    otherTabChannel.close();
  });

  it("no-ops when BroadcastChannel is unavailable (old Safari, etc.)", async () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    // @ts-expect-error simulando um navegador sem BroadcastChannel
    delete globalThis.BroadcastChannel;

    await jest.isolateModulesAsync(async () => {
      const isolatedTabSync = await import("../../utils/tabSync");

      expect(() => isolatedTabSync.notifyStoreChanged("budgets")).not.toThrow();
      const unsubscribe = isolatedTabSync.subscribeToStoreChanges(
        "budgets",
        jest.fn(),
      );
      expect(() => unsubscribe()).not.toThrow();
    });

    globalThis.BroadcastChannel = originalBroadcastChannel;
  });
});
