/**
 * @file nhtsa.adapter.ts
 * The ONLY file in this module that knows NHTSA vPIC exists. It hits the
 * public NHTSA API directly (separate axios instance — no auth interceptors,
 * no relation to `apiClient`), normalizes the PascalCase/English response
 * into the app's `.NET-ready` CarMake/CarModel contract, and validates the
 * result through Zod before returning it.
 *
 * To remove NHTSA later: delete this file and change `carMakesApi` in
 * `carMakes.api.ts` to call the real backend. Nothing else depends on this file.
 */
import axios from "axios";
import type { CarMake, CarModel } from "../types";
import { carMakesResponseSchema, carModelsResponseSchema } from "../schemas/carMake.schema";

const nhtsaClient = axios.create({
  baseURL: "https://vpic.nhtsa.dot.gov/api/vehicles",
  timeout: 15_000, // NHTSA is slow: sometimes +2.5s
  headers: { Accept: "application/json" },
});

/** English → Arabic labels for makes common in the Saudi market. Falls back to the English name. */
const AR_MAKE_LABELS: Record<string, string> = {
  toyota: "تويوتا",
  hyundai: "هيونداي",
  nissan: "نيسان",
  kia: "كيا",
  honda: "هوندا",
  ford: "فورد",
  chevrolet: "شيفروليه",
  lexus: "لكزس",
  gmc: "جي إم سي",
  "mercedes-benz": "مرسيدس بنز",
  bmw: "بي إم دبليو",
  mazda: "مازدا",
  mitsubishi: "ميتسوبيشي",
  audi: "أودي",
  volkswagen: "فولكس واجن",
  jeep: "جيب",
  dodge: "دودج",
  infiniti: "إنفينيتي",
  "land rover": "لاند روفر",
  porsche: "بورش",
  suzuki: "سوزوكي",
  isuzu: "إيسوزو",
  mg: "إم جي",
  changan: "چانجان",
};

function arLabel(nameEn: string): string {
  return AR_MAKE_LABELS[nameEn.trim().toLowerCase()] ?? nameEn;
}

/** Bounded allow-list of Saudi-market-relevant makes, derived from the Arabic label map. */
const ALLOWED_MAKES = new Set(Object.keys(AR_MAKE_LABELS));

interface NhtsaMakeResult {
  Make_ID: number;
  Make_Name: string;
}

interface NhtsaModelResult {
  Make_ID: number;
  Model_ID: number;
  Model_Name: string;
}

export async function fetchMakesFromNhtsa(): Promise<CarMake[]> {
  const { data } = await nhtsaClient.get<{ Results: NhtsaMakeResult[] }>("/GetAllMakes?format=json");

  const filtered = data.Results.filter((r) => ALLOWED_MAKES.has(r.Make_Name.trim().toLowerCase()));

  if (filtered.length === 0) {
    console.warn(
      "[nhtsa.adapter] No NHTSA makes matched ALLOWED_MAKES — check for NHTSA naming changes.",
    );
  }

  const items: CarMake[] = filtered.map((r) => ({
    id: String(r.Make_ID),
    nameEn: r.Make_Name,
    nameAr: arLabel(r.Make_Name),
  }));

  items.sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));

  return carMakesResponseSchema.parse({ items }).items;
}

export async function fetchModelsFromNhtsa(makeId: string): Promise<CarModel[]> {
  const { data } = await nhtsaClient.get<{ Results: NhtsaModelResult[] }>(
    `/GetModelsForMakeId/${encodeURIComponent(makeId)}?format=json`,
  );

  const items: CarModel[] = data.Results.map((r) => ({
    id: String(r.Model_ID),
    makeId: String(r.Make_ID),
    nameEn: r.Model_Name,
    nameAr: r.Model_Name,
  }));

  return carModelsResponseSchema.parse({ items }).items;
}
