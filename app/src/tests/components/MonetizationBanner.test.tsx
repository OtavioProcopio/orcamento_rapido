import { render, screen } from "@testing-library/react";
import { MonetizationBanner } from "../../components/MonetizationBanner";

describe("MonetizationBanner", () => {
  it("renders banner text", () => {
    render(<MonetizationBanner />);
    expect(
      screen.getByText("Experimente o plano Pro e personalize seus PDFs."),
    ).toBeInTheDocument();
  });
});
