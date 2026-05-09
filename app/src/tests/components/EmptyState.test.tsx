import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../components/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="Sem dados" description="Crie um item para comecar." />,
    );

    expect(screen.getByText("Sem dados")).toBeInTheDocument();
    expect(screen.getByText("Crie um item para comecar.")).toBeInTheDocument();
  });
});
