import {
  fileToBase64,
  validateLogoFile,
  MAX_LOGO_SIZE_BYTES,
} from "../../utils/file";

describe("validateLogoFile", () => {
  const makeFile = (type: string, size: number): File => {
    const file = new File([new Uint8Array(size)], "logo", { type });
    return file;
  };

  it("accepts png, jpeg, webp and svg within the size limit", () => {
    for (const type of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ]) {
      expect(validateLogoFile(makeFile(type, 1000))).toBeNull();
    }
  });

  it("rejects unsupported file types", () => {
    expect(validateLogoFile(makeFile("application/pdf", 1000))).toBe(
      "Formato não suportado. Envie PNG, JPG, WebP ou SVG.",
    );
  });

  it("rejects files above the size limit", () => {
    expect(
      validateLogoFile(makeFile("image/png", MAX_LOGO_SIZE_BYTES + 1)),
    ).toBe("Arquivo muito grande. O tamanho máximo é 1MB.");
  });

  it("accepts a file exactly at the size limit", () => {
    expect(
      validateLogoFile(makeFile("image/png", MAX_LOGO_SIZE_BYTES)),
    ).toBeNull();
  });
});

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

  it("resolves to an empty string when the reader result is not a string", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    class MockFileReader {
      onload:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      onerror:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      result: string | ArrayBuffer | null = new ArrayBuffer(0);

      readAsDataURL = jest.fn(() => {
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

    await expect(fileToBase64(file)).resolves.toBe("");
  });
});
