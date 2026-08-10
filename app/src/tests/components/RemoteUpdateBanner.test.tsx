import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoteUpdateBanner } from "../../components/RemoteUpdateBanner";

describe("RemoteUpdateBanner", () => {
  it("shows the label and calls onRefresh when clicked", async () => {
    const onRefresh = jest.fn();
    const user = userEvent.setup();

    render(
      <RemoteUpdateBanner label="Mudou em outra aba." onRefresh={onRefresh} />,
    );

    expect(screen.getByText("Mudou em outra aba.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Atualizar agora" }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
