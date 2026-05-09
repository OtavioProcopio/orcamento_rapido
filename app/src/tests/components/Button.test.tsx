import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../components/Button";

describe("Button", () => {
  it("renders label and handles click", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
