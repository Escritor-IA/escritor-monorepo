import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders title, description and calls onConfirm/onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Excluir projeto"
        description="Esta ação não pode ser desfeita."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Excluir projeto")).toBeInTheDocument();
    expect(screen.getByText("Esta ação não pode ser desfeita.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirmar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows an ErrorCard when an error is passed", () => {
    render(
      <ConfirmDialog
        title="Cancelar assinatura"
        description="Confirma?"
        error="Sem assinatura ativa."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Sem assinatura ativa.");
  });

  it("does not show an ErrorCard when there is no error", () => {
    render(
      <ConfirmDialog
        title="Cancelar assinatura"
        description="Confirma?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables both buttons while loading", () => {
    render(
      <ConfirmDialog
        title="Cancelar assinatura"
        description="Confirma?"
        loading
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Cancelar")).toBeDisabled();
    expect(screen.getByText("Aguarde…")).toBeDisabled();
  });
});
