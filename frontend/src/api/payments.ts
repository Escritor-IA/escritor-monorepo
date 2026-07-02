import client from "./client";

export const paymentsApi = {
  createCheckoutSession: (plan: "basic" | "premium") =>
    client.post<{ url: string }>("/payments/create-checkout-session/", { plan }),

  changePlan: (plan: "basic" | "premium") =>
    client.post<{ status: string }>("/payments/change-plan/", { plan }),

  cancelSubscription: () =>
    client.post<{ status: string; cancel_at: number | null }>("/payments/cancel-subscription/"),
};
