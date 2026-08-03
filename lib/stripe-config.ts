export const PLANS = {
  START: {
    name: 'Start',
    monthly: { priceId: 'price_1TWkN3Ieu0gIDMAh1yxZcZWH', amount: 299 },
    yearly:  { priceId: 'price_1TWkN3Ieu0gIDMAhnVW7orSB', amount: 2870 },
  },
  TYM: {
    name: 'Tým',
    monthly: { priceId: 'price_1TWkNMIeu0gIDMAhAhZBQroz', amount: 599 },
    yearly:  { priceId: 'price_1TWkNkIeu0gIDMAhlVQsh0FO', amount: 5750 },
  },
  BUSINESS: {
    name: 'Business',
    monthly: { priceId: 'price_1TWkOOIeu0gIDMAh6IoPZSo3', amount: 999 },
    yearly:  { priceId: 'price_1TWkOOIeu0gIDMAhfenpRVmR', amount: 9590 },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthly: { priceId: 'price_1TWkPEIeu0gIDMAhJ1EwMNXx', amount: 1790 },
    yearly:  { priceId: 'price_1TWkPEIeu0gIDMAhPWrf2NXr', amount: 17270 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type BillingInterval = 'monthly' | 'yearly';
