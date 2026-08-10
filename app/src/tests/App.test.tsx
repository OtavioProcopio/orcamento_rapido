import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("App navigation flow", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    delete window.goatcounter;
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

  it("reports a pageview on every route change, including the first one", async () => {
    const count = jest.fn();
    window.goatcounter = { count };
    localStorage.clear();

    render(<App />);
    await waitFor(() =>
      expect(count).toHaveBeenCalledWith({ path: "/", title: undefined }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Começar a usar" }),
    );
    await waitFor(() =>
      expect(count).toHaveBeenCalledWith({ path: "/profile", title: undefined }),
    );
  });
});
