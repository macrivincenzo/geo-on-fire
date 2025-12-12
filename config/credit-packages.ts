export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  priceDisplay: string; // formatted price
  description: string;
  popular?: boolean;
  bonusCredits?: number; // Optional bonus credits
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 999, // $9.99
    priceDisplay: '$9.99',
    description: 'Perfect for trying out GEO optimization',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 3999, // $39.99
    priceDisplay: '$39.99',
    description: 'Best value for regular users',
    popular: true,
    bonusCredits: 50, // 10% bonus
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 2000,
    price: 14999, // $149.99
    priceDisplay: '$149.99',
    description: 'For agencies and power users',
    bonusCredits: 500, // 25% bonus
  },
];

export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}

