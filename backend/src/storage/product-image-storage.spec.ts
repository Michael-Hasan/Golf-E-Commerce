import { LocalProductImageStorage } from "./product-image-storage";

describe("LocalProductImageStorage", () => {
  let storage: LocalProductImageStorage;

  beforeEach(() => {
    process.env.PRODUCT_IMAGE_BASE_URL = "/assets/products";
    storage = new LocalProductImageStorage();
  });

  afterEach(() => {
    delete process.env.PRODUCT_IMAGE_BASE_URL;
  });

  it("generates a sanitized filename that keeps the extension", () => {
    const filename = storage.generateFilename("Cool ❤️ Club.PNG");
    expect(filename).toMatch(/^cool-club-[0-9]+-[a-z0-9]{6}\.png$/);
  });

  it("builds asset URLs from the configured base", () => {
    expect(storage.getAssetUrl("example.jpg")).toBe("/assets/products/example.jpg");
  });
});
