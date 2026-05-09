import { fileToBase64 } from "../../utils/file";

describe("fileToBase64", () => {
  it("converts file to base64", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const fakeBase64 = "data:text/plain;base64,dGVzdCBjb250ZW50";

    class MockFileReader {
      onload:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      onerror:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      result: string | ArrayBuffer | null = null;

      readAsDataURL = jest.fn(() => {
        this.result = fakeBase64;
        this.onload?.call(
          this as unknown as FileReader,
          new ProgressEvent("load") as unknown as ProgressEvent<FileReader>,
        );
      });
    }

    const fileReaderConstructor = jest.fn(
      () => new MockFileReader() as unknown as FileReader,
    );
    global.FileReader = fileReaderConstructor as unknown as typeof FileReader;

    const result = await fileToBase64(file);
    expect(result).toBe(fakeBase64); // since result was read after onload returns String(reader.result)
  });

  it("rejects on error", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    class MockFileReader {
      onload:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      onerror:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;

      readAsDataURL = jest.fn(() => {
        this.onerror?.call(
          this as unknown as FileReader,
          new ProgressEvent("error") as unknown as ProgressEvent<FileReader>,
        );
      });
    }

    const fileReaderConstructor = jest.fn(
      () => new MockFileReader() as unknown as FileReader,
    );
    global.FileReader = fileReaderConstructor as unknown as typeof FileReader;

    await expect(fileToBase64(file)).rejects.toThrow("Falha ao ler arquivo.");
  });
});
