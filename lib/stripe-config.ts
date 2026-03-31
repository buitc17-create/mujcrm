export const PLANS = {
  START: {
    name: 'Start',
    monthly: { priceId: 'price_1TH20wIcnvQU8Hw0o9yciYoR', amount: 299 },
    yearly:  { priceId: 'price_1TH21bIcnvQU8Hw0u2hHovND', amount: 2870 },
  },
  TYM: {
    name: 'Tým',
    monthly: { priceId: 'price_1TH28DIcnvQU8Hw0qVrfKd0k', amount: 599 },
    yearly:  { priceId: 'price_1TH28DIcnvQU8Hw0DJmurYYA', amount: 5750 },
  },
  BUSINESS: {
    name: 'Business',
    monthly: { priceId: 'price_1TH2HxIcnvQU8Hw0TGwAj4Ut', amount: 999 },
    yearly:  { priceId: 'price_1TH2HxIcnvQU8Hw02VfQOq8K', amount: 9590 },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthly: { priceId: 'price_1TH2JOIcnvQU8Hw0oTRu7g6G', amount: 1799 },
    yearly:  { priceId: 'price_1TH2JOIcnvQU8Hw0eD7fhXMo', amount: 17270 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type BillingInterval = 'monthly' | 'yearly';
