import { downloadUrl, downloadBlob } from "../../utils/download";

describe("download", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("downloads from url", () => {
    const realCreateElement = document.createElement.bind(document);
    const documentSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName) => {
        const element = realCreateElement(tagName);
        if (tagName === "a") {
          element.click = jest.fn();
        }
        return element;
      });
    jest.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    jest.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    downloadUrl("data:image/png", "file.png");
    expect(documentSpy).toHaveBeenCalled();
  });

  it("downloads from blob", () => {
    global.window.URL.createObjectURL = jest.fn(() => "blob:url");
    const revokeObjectURL = jest.fn();
    global.window.URL.revokeObjectURL = revokeObjectURL;
    downloadBlob(new Blob(), "file.pdf");
    jest.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:url");
  });
});
