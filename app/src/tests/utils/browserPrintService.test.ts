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
});
