import type { Merchant } from '@/types';

export const MERCHANTS: Merchant[] = [
  {
    id: '7a95bdd8-0007-44af-8644-18870bddb076',
    name: 'Cuervo Cafe',
    location: '3 locations',
    category: 'Cafes',
    discountBadge: '-20%',
    logoUrl: '/merchants/7a95bdd8-0007-44af-8644-18870bddb076.avif',
  },
  {
    id: '68546a0d-9d18-4f7b-bb5f-57c34aec618b',
    name: 'Checkpoint Charlie',
    location: 'Av. Dorrego 3590, C1425GAZ Cdad. Aut...',
    category: 'Restaurants',
    discountBadge: '-20%',
    logoUrl: '/merchants/68546a0d-9d18-4f7b-bb5f-57c34aec618b.avif',
  },
  {
    id: '3c4339fe-7b4a-4f61-a7db-d81b76230a22',
    name: 'La Bici Cafe',
    location: 'Zapiola 147, C1426 Cdad. Autonoma de...',
    category: 'Cafes',
    discountBadge: '-20%',
    logoUrl: '/merchants/3c4339fe-7b4a-4f61-a7db-d81b76230a22.avif',
  },
] as const;

export const CATEGORIES = ['All', 'Restaurants', 'Cafes'] as const;
