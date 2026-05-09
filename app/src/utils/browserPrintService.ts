type BrowserPrintSessionOptions = {
  beforePrintDelayMs?: number;
  target?: Window;
  onAfterPrint?: () => void;
  onError?: (error: Error) => void;
  print?: () => void;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error("browser-print-failed");

export const createBrowserPrintSession = ({
  beforePrintDelayMs = 100,
  target = window,
  onAfterPrint,
  onError,
  print,
}: BrowserPrintSessionOptions) => {
  let settled = false;

  const handleAfterPrint = () => {
    if (settled) {
      return;
    }

    settled = true;
    target.removeEventListener("afterprint", handleAfterPrint);
    onAfterPrint?.();
  };

  target.addEventListener("afterprint", handleAfterPrint);

  const timer = window.setTimeout(() => {
    try {
      (print ?? (() => target.print()))();
    } catch (error) {
      if (settled) {
        return;
      }

      settled = true;
      target.removeEventListener("afterprint", handleAfterPrint);
      onError?.(toError(error));
    }
  }, beforePrintDelayMs);

  return () => {
    settled = true;
    window.clearTimeout(timer);
    target.removeEventListener("afterprint", handleAfterPrint);
  };
};
