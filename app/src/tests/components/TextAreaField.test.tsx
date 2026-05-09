import { render, screen } from "@testing-library/react";
import { TextAreaField } from "../../components/TextAreaField";

describe("TextAreaField", () => {
  it("renders label", () => {
    render(<TextAreaField label="Notas" name="notas" />);
    expect(screen.getByLabelText("Notas")).toBeInTheDocument();
  });
});
