import { trackEvent, trackPageview } from "../../utils/analytics";

describe("analytics", () => {
  afterEach(() => {
    delete window.goatcounter;
  });

  it("does nothing when goatcounter never loaded (adblocker, offline, etc.)", () => {
    expect(() => trackPageview("/dashboard")).not.toThrow();
    expect(() => trackEvent("budget-created")).not.toThrow();
  });

  it("reports a pageview with the given path and optional title", () => {
    const count = jest.fn();
    window.goatcounter = { count };

    trackPageview("/dashboard", "Meu Painel");

    expect(count).toHaveBeenCalledWith({ path: "/dashboard", title: "Meu Painel" });
  });

  it("reports an event prefixed so it's distinguishable from pageviews", () => {
    const count = jest.fn();
    window.goatcounter = { count };

    trackEvent("budget-created");

    expect(count).toHaveBeenCalledWith({
      path: "event:budget-created",
      event: true,
      title: "budget-created",
    });
  });
});
