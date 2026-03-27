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
  { propertyId: "p1", name: "Boys Hostel", price: 60, rent: 15 },
  { propertyId: "p2", name: "Girls Hostel", price: 60, rent: 15 },
  { propertyId: "p3", name: "Bluespring Mess", price: 100, rent: 25 },
  { propertyId: "p4", name: "Bluedove Mess", price: 100, rent: 25 },
  { propertyId: "p5", name: "Ramdas Pai Amphitheatre", price: 120, rent: 30 },
  { propertyId: "p6", name: "TMA Pai Auditorium", price: 140, rent: 35 },
  { propertyId: "p7", name: "Sharda Pai Auditorium", price: 140, rent: 35 },
  { propertyId: "p8", name: "Vasanti Pai Auditorium", price: 160, rent: 40 },
  { propertyId: "p9", name: "Italian Oven", price: 180, rent: 45 },
  { propertyId: "p10", name: "Munchies", price: 180, rent: 45 },
  { propertyId: "p11", name: "Old Mess", price: 200, rent: 50 },
  { propertyId: "p12", name: "Mechanical Workshop", price: 220, rent: 55 },
  { propertyId: "p13", name: "Lecture Hall Complex", price: 220, rent: 55 },
  { propertyId: "p14", name: "Academic Workshop", price: 240, rent: 60 },
  { propertyId: "p15", name: "AB 1 (Academic Block 1)", price: 260, rent: 65 },
  { propertyId: "p16", name: "AB 2", price: 260, rent: 65 },
  { propertyId: "p17", name: "AB 3", price: 280, rent: 70 },
  { propertyId: "p18", name: "Cricket Ground", price: 320, rent: 80 },
  { propertyId: "p19", name: "Football Ground", price: 300, rent: 75 },
  { propertyId: "p20", name: "Basketball Court", price: 300, rent: 75 },
  { propertyId: "p21", name: "Grand Stairs", price: 350, rent: 90 },
  { propertyId: "p22", name: "Dome Building", price: 400, rent: 100 },
];
