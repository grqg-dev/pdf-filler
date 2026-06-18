export interface FaxNumber {
  id: string;
  name: string;
  number: string;
  displayNumber: string;
}

export const FAX_NUMBERS: Record<string, FaxNumber> = {
  juliaRay: {
    id: "juliaRay",
    name: "Dr. Julia Ray",
    number: "18053422546",
    displayNumber: "1 (805) 342-2546",
  },
  lambPT: {
    id: "lambPT",
    name: "Lamb PT",
    number: "18055860632",
    displayNumber: "1 (805) 586-0632",
  },
  obstetrix: {
    id: "obstetrix",
    name: "Obstetrix",
    number: "18058982048",
    displayNumber: "1 (805) 898-2048",
  },
  ocean: {
    id: "ocean",
    name: "Ocean Perinatal",
    number: "18056207862",
    displayNumber: "1 (805) 620-7862",
  },
  aeroflow: {
    id: "aeroflow",
    name: "Aeroflow",
    number: "18008062799",
    displayNumber: "1 (800) 806-2799",
  },
  sansumDiabetes: {
    id: "sansumDiabetes",
    name: "Sansum Diabetes",
    number: "18056823332",
    displayNumber: "1 (805) 682-3332",
  },
  sansumPelvicFloorPT: {
    id: "sansumPelvicFloorPT",
    name: "Sansum Pelvic Floor PT",
    number: "18056816361",
    displayNumber: "1 (805) 681-6361",
  },
};

export const FAX_NUMBER_LIST: FaxNumber[] = Object.values(FAX_NUMBERS);
