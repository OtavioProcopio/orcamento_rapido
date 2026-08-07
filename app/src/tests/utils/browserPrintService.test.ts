import { createBrowserPrintSession } from "../../utils/browserPrintService";

describe("browserPrintService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts native print and finalizes after afterprint", () => {
    const printMock = jest.fn();
    const onAfterPrint = jest.fn();

    const cleanup = createBrowserPrintSession({
      print: printMock,
      onAfterPrint,
    });

    jest.advanceTimersByTime(100);
    expect(printMock).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("afterprint"));
    expect(onAfterPrint).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("reports an error when native print throws", () => {
    const onError = jest.fn();
    const onAfterPrint = jest.fn();

    createBrowserPrintSession({
      print: () => {
        throw new Error("print failed");
      },
      onAfterPrint,
      onError,
    });

    jest.advanceTimersByTime(100);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onAfterPrint).not.toHaveBeenCalled();
  });

  it("ignores a second afterprint event once already settled", () => {
    const printMock = jest.fn();
    const onAfterPrint = jest.fn();

    createBrowserPrintSession({ print: printMock, onAfterPrint });

    jest.advanceTimersByTime(100);
    window.dispatchEvent(new Event("afterprint"));
    window.dispatchEvent(new Event("afterprint"));

    expect(onAfterPrint).toHaveBeenCalledTimes(1);
  });

  it("ignores a print error if afterprint already settled the session", () => {
    const onError = jest.fn();
    const onAfterPrint = jest.fn();

    createBrowserPrintSession({
      print: () => {
        throw new Error("print failed after settle");
      },
      onAfterPrint,
      onError,
    });

    // afterprint dispara (e resolve a sessão) antes do timer de print rodar.
    window.dispatchEvent(new Event("afterprint"));
    jest.advanceTimersByTime(100);

    expect(onAfterPrint).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("stops listening and clears the timer when cleanup runs early", () => {
    const printMock = jest.fn();
    const onAfterPrint = jest.fn();

    const cleanup = createBrowserPrintSession({
      print: printMock,
      onAfterPrint,
    });
    cleanup();

    jest.advanceTimersByTime(100);
    window.dispatchEvent(new Event("afterprint"));

    expect(printMock).not.toHaveBeenCalled();
    expect(onAfterPrint).not.toHaveBeenCalled();
  });
});
