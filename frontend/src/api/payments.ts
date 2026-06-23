import client from "./client";

export interface CreateCheckoutPayload {
  plan: "basic" | "premium";
  billing_cycle: "monthly" | "annual";
}

export interface CheckoutResponse {
  id: string;
  plan: string;
  billing_cycle: string;
  amount: string;
  status: string;
  checkout_url: string;
  receipt_url: string;
  created_at: string;
}

export interface PaymentStatus {
  status: "pending" | "paid" | "failed";
  plan: "basic" | "premium";
  billing_cycle: "monthly" | "annual";
  amount: string;
  capture_method: string;
  order_nsu: string;
  receipt_url: string;
  expires_at: string | null;
  created_at: string;
}

export const paymentsApi = {
  createCheckout: (payload: CreateCheckoutPayload) =>
    client.post<CheckoutResponse>("/payments/checkout/", payload),

  getStatus: (orderNsu: string) =>
    client.get<PaymentStatus>(`/payments/status/${orderNsu}/`),
};
