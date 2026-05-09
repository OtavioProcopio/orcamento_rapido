import { render, screen } from "@testing-library/react";
import { Card } from "../../components/Card";

describe("Card", () => {
  it("renders title and content", () => {
    render(
      <Card title="Titulo">
        <p>Conteudo</p>
      </Card>,
    );

    expect(screen.getByText("Titulo")).toBeInTheDocument();
    expect(screen.getByText("Conteudo")).toBeInTheDocument();
  });

  it("supports cards without title and trims class names", () => {
    const { container } = render(
      <Card className="custom-card">
        <p>Sem titulo</p>
      </Card>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("card");
    expect(container.firstChild).toHaveClass("custom-card");
  });
});
