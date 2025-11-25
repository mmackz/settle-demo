import { base } from 'wagmi/chains';
import type { Merchant } from '@/types';

export const CHAIN = base;
export const CHAIN_ID = base.id;

// Merchant data matching Settle API structure
export const MERCHANTS: Merchant[] = [
  {
    id: '68546a0d-9d18-4f7b-bb5f-57c34aec618b',
    fid: 1433069,
    businessName: 'Checkpoint Charlie',
    discountPercentage: 20,
    category: 'Restaurants',
    isFeatured: false,
    location: {
      address: 'Av. Dorrego 3590, C1425GAZ Cdad. Autónoma de Buenos Aires, Argentina',
      latitude: null,
      longitude: null,
      mapsUrl: 'https://maps.app.goo.gl/3L6531Vay3jTYoPRA',
    },
    stores: [],
    isActive: true,
    onboardedAt: '2025-11-09T19:05:48.906Z',
    logoUrl: '/merchants/68546a0d-9d18-4f7b-bb5f-57c34aec618b.avif',
  },
  {
    id: '7a95bdd8-0007-44af-8644-18870bddb076',
    fid: 1466351,
    businessName: 'Cuervo Cafe',
    discountPercentage: 20,
    category: 'Cafes',
    isFeatured: false,
    location: {
      address: null,
      latitude: null,
      longitude: null,
      mapsUrl: null,
    },
    stores: [
      {
        id: '866efadc-ad14-42af-8e21-af3009d43f9b',
        name: 'Cuervo Cafe Palermo Off',
        address: 'Arenales 3339, C1425BEQ Cdad. Autónoma de Buenos Aires',
        latitude: null,
        longitude: null,
        mapsUrl: 'https://maps.app.goo.gl/ronpdxi3fGUfMnEC9',
        isActive: true,
      },
      {
        id: '682c8a44-e82e-4e1c-b1e9-33eaf4170a79',
        name: 'Cuervo Cafe El salvador',
        address: 'El Salvador 4580, C1414 Cdad. Autónoma de Buenos Aires',
        latitude: null,
        longitude: null,
        mapsUrl: 'https://maps.app.goo.gl/3vmmda9wjLC7uHmu7',
        isActive: true,
      },
      {
        id: 'a26d471f-ede0-4da3-bb2b-d6a0d7b6238e',
        name: 'Cuervo Cafe Costa Rica',
        address: 'Costa Rica 5801, C1414 Cdad. Autónoma de Buenos Aires',
        latitude: null,
        longitude: null,
        mapsUrl: 'https://maps.app.goo.gl/oqiWpii7SXQv3KJD8',
        isActive: true,
      },
    ],
    isActive: true,
    onboardedAt: '2025-11-11T21:54:36.698Z',
    logoUrl: '/merchants/7a95bdd8-0007-44af-8644-18870bddb076.avif',
  },
  {
    id: '089a0fde-8ade-44cf-b5d4-5e20f9175f65',
    fid: 228597,
    businessName: 'Mattie Shop',
    discountPercentage: 20,
    category: 'Cafes',
    isFeatured: false,
    location: {
      address: 'Vedia 3040, C1429EKB Cdad. Autónoma de Buenos Aires, Argentina',
      latitude: null,
      longitude: null,
      mapsUrl: 'https://maps.app.goo.gl/V4VgWD91xrSqBG5L7',
    },
    stores: [],
    isActive: true,
    onboardedAt: '2025-11-17T11:20:25.525Z',
    logoUrl: '/merchants/089a0fde-8ade-44cf-b5d4-5e20f9175f65.png',
  },
];

export const CATEGORIES = ['All', 'Restaurants', 'Cafes'] as const;
