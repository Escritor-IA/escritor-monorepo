import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorCard } from "./ErrorCard";

describe("ErrorCard", () => {
  it("renders the message with an alert role", () => {
    render(<ErrorCard message="Créditos insuficientes." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Créditos insuficientes.");
  });

  it("does not render a dismiss button when onDismiss is not provided", () => {
    render(<ErrorCard message="Erro." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<ErrorCard message="Erro." onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
