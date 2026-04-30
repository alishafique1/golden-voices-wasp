export enum SubscriptionStatus {
  PastDue = "past_due",
  CancelAtPeriodEnd = "cancel_at_period_end",
  Active = "active",
  Deleted = "deleted",
}

export enum PaymentPlanId {
  PayAsYouGo = "pay_as_you_go",
  MonthlyBasic = "monthly_basic",
  MonthlyPremium = "monthly_premium",
}

export interface PaymentPlan {
  id: PaymentPlanId;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect =
  | { kind: "subscription" }
  | { kind: "credits"; amount: number };

export const paymentPlans = {
  [PaymentPlanId.PayAsYouGo]: {
    id: PaymentPlanId.PayAsYouGo,
    effect: { kind: "credits", amount: 0.1 },
  },
  [PaymentPlanId.MonthlyBasic]: {
    id: PaymentPlanId.MonthlyBasic,
    effect: { kind: "subscription" },
  },
  [PaymentPlanId.MonthlyPremium]: {
    id: PaymentPlanId.MonthlyPremium,
    effect: { kind: "subscription" },
  },
} as const satisfies Record<PaymentPlanId, PaymentPlan>;

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.PayAsYouGo]: "$0 Pay As You Go",
    [PaymentPlanId.MonthlyBasic]: "$29 Basic",
    [PaymentPlanId.MonthlyPremium]: "$79 Premium",
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter(
    (planId) => paymentPlans[planId].effect.kind === "subscription",
  );
}
