import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors";

const FALLBACK = "Algo deu errado.";

describe("getErrorMessage", () => {
  it("returns the fallback when the error has no response data", () => {
    expect(getErrorMessage(new Error("network fail"), FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage({}, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  it("extracts a plain string body", () => {
    const err = { response: { data: "Créditos insuficientes." } };
    expect(getErrorMessage(err, FALLBACK)).toBe("Créditos insuficientes.");
  });

  it("extracts the first item of a bare list body", () => {
    const err = { response: { data: ["Projeto não encontrado."] } };
    expect(getErrorMessage(err, FALLBACK)).toBe("Projeto não encontrado.");
  });

  it("extracts {detail: ...} bodies", () => {
    const err = { response: { data: { detail: "Capítulo não encontrado." } } };
    expect(getErrorMessage(err, FALLBACK)).toBe("Capítulo não encontrado.");
  });

  it("extracts {non_field_errors: [...]} bodies", () => {
    const err = { response: { data: { non_field_errors: ["Combinação inválida."] } } };
    expect(getErrorMessage(err, FALLBACK)).toBe("Combinação inválida.");
  });

  it("extracts a field-level DRF validation error, e.g. {analysis_type: [...]}", () => {
    const err = { response: { data: { analysis_type: ["Tipo de análise inválido."] } } };
    expect(getErrorMessage(err, FALLBACK)).toBe("Tipo de análise inválido.");
  });

  it("falls back when the body is an empty object", () => {
    const err = { response: { data: {} } };
    expect(getErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the body has no usable string anywhere", () => {
    const err = { response: { data: { code: 502, retryable: false } } };
    expect(getErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });
});
