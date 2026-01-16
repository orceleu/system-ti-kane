import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

interface FormData {
  id: string;
  Nom: string;
  Prenom: string;
  StartDate: string;
  EndDate: string;
  NIF: string;
  Phone: string;
  Plan: number | string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Historic: string;
  Detruit?: string;
}
export function formatReadableDate(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function addDaysToNow(daysString: string): string {
  const days = parseInt(daysString, 10);
  if (isNaN(days)) throw new Error("Invalid number of days");

  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getLocalISOWithoutSeconds(dateString: string): string {
  const d = new Date(dateString); // <-- ici on accepte un string

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
// hooks/useProgress.ts
export function useProgress(startDate: string | Date, endDate: string | Date) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (now <= start) return 0;
  if (now >= end) return 100;

  const total = end - start;
  const elapsed = now - start;
  const percent = (elapsed / total) * 100;

  return Math.round(percent);
}
export function getNumericProgress(
  currentStr: string,
  totalStr: string
): number {
  const current = Number(currentStr);
  const total = Number(totalStr);

  if (isNaN(current) || isNaN(total) || total <= 0) {
    // throw new Error("Invalid numeric strings passed to getNumericProgress()");
    console.log(`${isNaN(current)},${isNaN(total)},${total <= 0}`);
  }

  if (current <= 0) return 0;
  if (current >= total) return 100;

  const percent = (current / total) * 100;

  return Math.round(percent);
}
export function generateData(
  montant: number,
  montantQuotidien: number,
  action: "dep" | "retr"
): string {
  if (montantQuotidien <= 0) throw new Error("Le plan doit être supérieur à 0");

  const now = new Date().toISOString();
  const jours = montant / montantQuotidien;

  return `${now},${montant},${jours},${action};`;
}

export function appendDataRepeated(
  initialData: string,
  dataToAdd: string
): string {
  // On s'assure que la nouvelle entrée a un point-virgule
  const entry = dataToAdd.trim().endsWith(";") ? dataToAdd : dataToAdd + ";";

  // Concatène simplement la nouvelle donnée à la chaîne existante
  return initialData ? initialData + entry : entry;
}

export async function addAllDocs(data: FormData[]) {
  try {
    for (const form of data) {
      const ref = doc(db, "doc", form.id);

      await setDoc(ref, {
        Nom: form.Nom || "",
        Prenom: form.Prenom || "",
        StartDate: form.StartDate || "",
        EndDate: form.EndDate || "",
        NIF: form.NIF || "",
        Phone: form.Phone || "",
        Plan: form.Plan || 0,
        DailyMoney: form.DailyMoney || "0",
        Balance: form.Balance || "0",
        TotalBalance: form.TotalBalance || "0",
        Historic: form.Historic || "",
        Detruit: form.Detruit || "non",
      });

      console.log(`✅ Added doc ${form.id}`);
    }

    console.log("🎉 All documents added!");
  } catch (err) {
    console.error("❌ Error adding documents:", err);
  }
}
