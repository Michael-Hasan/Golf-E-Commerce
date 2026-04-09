import { fireEvent, render, screen } from "@testing-library/react";
import { ProductImage } from "./app-frame";

describe("ProductImage", () => {
  it("renders the image and falls back to an initial when loading fails", () => {
    render(<ProductImage name="Driver" category="Clubs" />);
    const img = screen.getByRole("img", { name: /driver/i });
    expect(img).toBeInTheDocument();
    fireEvent.error(img);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("shows the first letter of the name even if the category changes", () => {
    render(<ProductImage name="Bag" category="Accessories" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
