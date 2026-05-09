import { render, screen } from "@testing-library/react";
import { InputField } from "../../components/InputField";

describe("InputField", () => {
  it("renders label and error", () => {
    render(<InputField label="Nome" name="nome" error="Obrigatorio" />);

    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument();
    expect(screen.getByText("Obrigatorio")).toBeInTheDocument();
  });
});
