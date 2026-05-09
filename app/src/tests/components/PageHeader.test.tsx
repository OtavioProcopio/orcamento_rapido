import { render, screen } from "@testing-library/react";
import { PageHeader } from "../../components/PageHeader";

describe("PageHeader", () => {
  it("renders title and subtitle", () => {
    render(<PageHeader title="Titulo" subtitle="Subtitulo" />);

    expect(screen.getByText("Titulo")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo")).toBeInTheDocument();
  });

  it("renders actions only when provided", () => {
    const { rerender } = render(
      <PageHeader title="Titulo" actions={<button type="button">Acao</button>} />,
    );

    expect(screen.getByRole("button", { name: "Acao" })).toBeInTheDocument();

    rerender(<PageHeader title="Titulo" />);
    expect(screen.queryByRole("button", { name: "Acao" })).not.toBeInTheDocument();
  });
});
