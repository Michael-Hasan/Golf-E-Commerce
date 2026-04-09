import { BadRequestException } from "@nestjs/common";
import { AdminUploadController } from "./admin-upload.controller";
import { localProductImageStorage } from "../storage/product-image-storage";

jest.mock("../storage/product-image-storage", () => ({
  localProductImageStorage: {
    getAssetUrl: jest.fn((filename: string) => `/assets/${filename}`),
  },
}));

describe("AdminUploadController", () => {
  const controller = new AdminUploadController();

  it("returns the asset URL when a filename is provided", () => {
    const result = controller.uploadProductImage({ filename: "club.png" });
    expect(result).toEqual({ imageUrl: "/assets/club.png", filename: "club.png" });
    expect(localProductImageStorage.getAssetUrl).toHaveBeenCalledWith("club.png");
  });

  it("throws when no file is provided", () => {
    expect(() => controller.uploadProductImage({} as any)).toThrow(
      BadRequestException,
    );
  });
});
