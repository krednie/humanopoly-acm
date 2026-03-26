export interface Property {
  propertyId: string;
  name: string;
  price: number;
  rent: number;
}

// ─────────────────────────────────────────────
// EDIT THIS FILE to add/change properties.
// price = cost to buy; rent = what others pay.
// ─────────────────────────────────────────────
export const PROPERTIES: Property[] = [
  { propertyId: "p01", name: "Silicon Valley", price: 400, rent: 50 },
  { propertyId: "p02", name: "Wall Street", price: 350, rent: 45 },
  { propertyId: "p03", name: "MIT Campus", price: 300, rent: 40 },
  { propertyId: "p04", name: "Hollywood Blvd", price: 280, rent: 35 },
  { propertyId: "p05", name: "Baker Street", price: 260, rent: 32 },
  { propertyId: "p06", name: "Champs-Élysées", price: 240, rent: 30 },
  { propertyId: "p07", name: "Tokyo Tower", price: 220, rent: 28 },
  { propertyId: "p08", name: "Colosseum", price: 200, rent: 25 },
  { propertyId: "p09", name: "Times Square", price: 380, rent: 48 },
  { propertyId: "p10", name: "Eiffel Quarter", price: 320, rent: 42 },
  { propertyId: "p11", name: "Neon District", price: 180, rent: 22 },
  { propertyId: "p12", name: "Harbour View", price: 160, rent: 20 },
  { propertyId: "p13", name: "The Bazaar", price: 140, rent: 18 },
  { propertyId: "p14", name: "Old Town", price: 120, rent: 15 },
  { propertyId: "p15", name: "Tech Hub", price: 340, rent: 44 },
  { propertyId: "p16", name: "Space Port", price: 360, rent: 46 },
  { propertyId: "p17", name: "Jungle Plaza", price: 100, rent: 12 },
  { propertyId: "p18", name: "Desert Oasis", price: 80, rent: 10 },
  { propertyId: "p19", name: "Arctic Base", price: 60, rent: 8 },
  { propertyId: "p20", name: "Cloud Palace", price: 420, rent: 55 },
];
