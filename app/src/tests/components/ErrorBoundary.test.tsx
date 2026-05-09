import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../../components/ErrorBoundary";

const ProblemChild = () => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  it("renders children when no error happens", () => {
    render(
      <ErrorBoundary>
        <div>Conteudo seguro</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Conteudo seguro")).toBeInTheDocument();
  });

  it("renders fallback and reload action after runtime errors", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText("Não foi possível carregar esta tela"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
