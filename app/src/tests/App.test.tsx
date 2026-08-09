import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("App navigation flow", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("sends first-time users from landing to profile setup", async () => {
    localStorage.clear();
    render(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Começar a usar" }),
    );
    expect(
      await screen.findByText("Nenhuma empresa cadastrada"),
    ).toBeInTheDocument();
  });
});
