"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from "@/public/cash.png";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase/config";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatReadableDate,
  generateData,
  getLocalISOWithoutSeconds,
} from "@/app/function/function";
import LockerTable from "@/app/clientComponent/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LoaderIcon,
  ArrowLeft,
  Printer,
  PlusCircle,
  MinusCircle,
  CreditCard,
  User,
  Calendar,
  CalendarDays,
  Layers,
  Coins,
  Wallet,
  Phone,
  FileText,
  ShieldCheck,
  AlertCircle,
  HandCoins,
  CheckCircle2,
  Lock,
  Percent,
  Sparkles,
  Copy,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { addHistoryEntry } from "@/app/function/history";

interface FormData {
  id: string;
  Nom: string;
  Prenom: string;
  StartDate: string;
  EndDate: string;
  NIF: string;
  Phone: string;
  Plan: string;
  PlanType?: "jour" | "semaine" | "mois";
  ContributionAmount?: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Historic: string;
  Detruit: string;
}

const STORAGE_KEY_TAUX = "mario_cash_taux_interet";

export default function PDFGenerator({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData | null>(null);
  const docKey = useRef("");
  const [amount, setAmount] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [errorLimit, setErrorLimit] = useState("");
  const [errorLimitRemove, setErrorLimitRemove] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [passDelete, setPassDelete] = useState("");
  const [passDeleteOk, setPassDeleteOk] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const password = useRef("");

  const [storedTaux, setStoredTaux] = useState("5");
  const [loanSimMontant, setLoanSimMontant] = useState("10000");
  const [loanSimMois, setLoanSimMois] = useState("6");

  const [depositMode, setDepositMode] = useState<
    "jour" | "semaine" | "mois" | "libre"
  >("jour");
  const [depositQuantity, setDepositQuantity] = useState<number>(1);
  const [withdrawMode, setWithdrawMode] = useState<
    "libre" | "jour" | "semaine" | "mois"
  >("libre");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAUX);
      if (saved) {
        setStoredTaux(saved);
      }
    } catch (e) {
      console.error("Erreur lecture localStorage:", e);
    }
  }, []);

  const getCustomerdata = async (email: string) => {
    if (email) {
      const userRef = doc(db, "user", email);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        console.log("User not found");
      } else {
        const userData = snap.data();
        password.current = userData?.password;
      }
    }
  };

  const stringRef = useRef<string>("");

  useEffect(() => {
    if (passDelete && passDelete === password.current) {
      setPassDeleteOk(true);
    } else {
      setPassDeleteOk(false);
    }
  }, [passDelete]);

  const appendString = (initial: string, add: string) => {
    if (!stringRef.current) {
      stringRef.current = initial;
    }
    stringRef.current += add;
    return stringRef.current;
  };

  function updateDepositByPeriod(
    mode: "jour" | "semaine" | "mois" | "libre",
    qty: number,
    freeAmount?: string
  ) {
    setDepositMode(mode);
    setDepositQuantity(qty);
    setErrorLimit("");

    const daily = Number(form?.DailyMoney) || 1;
    let computedAmount = 0;

    if (mode === "jour") {
      computedAmount = Math.max(1, qty) * daily;
      setAmount(String(computedAmount));
    } else if (mode === "semaine") {
      computedAmount = Math.max(1, qty) * 7 * daily;
      setAmount(String(computedAmount));
    } else if (mode === "mois") {
      computedAmount = Math.max(1, qty) * 30 * daily;
      setAmount(String(computedAmount));
    } else {
      const val = freeAmount !== undefined ? freeAmount : amount;
      setAmount(val);
      computedAmount = Number(val) || 0;
    }

    const current = Number(form?.Balance ?? 0);
    const total = Number(form?.TotalBalance ?? 0);

    if (computedAmount <= 0) {
      setErrorLimit("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    if (current + computedAmount > total) {
      setErrorLimit(
        `Ajouter ce montant (+${computedAmount.toLocaleString()} $ht) dépasserait le total prévu pour le carnet (${total.toLocaleString()} $ht).`
      );
    }
  }

  function validateAmount(value: string) {
    setAmount(value);
    setErrorLimit("");
    setErrorLimitRemove("");

    const numeric = Number(value);
    const current = Number(form?.Balance ?? 0);
    const total = Number(form?.TotalBalance ?? 0);

    if (Number.isNaN(numeric) || numeric <= 0) {
      setErrorLimit("Veuillez entrer un montant valide supérieur à 0.");
      return;
    }

    if (current + numeric > total) {
      setErrorLimit(
        "Ajouter ce montant dépasserait le total prévu pour le carnet."
      );
    }

    if (numeric > current) {
      setErrorLimitRemove(
        "Impossible de retirer plus que la balance actuelle."
      );
    }
  }

  function applyWithdrawPreset(mode: "libre" | "jour" | "semaine" | "mois", qty: number = 1) {
    setWithdrawMode(mode);
    const daily = Number(form?.DailyMoney) || 1;
    let val = 0;
    if (mode === "jour") val = qty * daily;
    else if (mode === "semaine") val = qty * 7 * daily;
    else if (mode === "mois") val = qty * 30 * daily;
    
    if (val > 0) {
      setAmount(String(val));
      validateAmount(String(val));
    }
  }

  async function addFunds() {
    if (!form || errorLimit || !passDeleteOk) return;
    setLoadingAdd(true);
    const numericAmount = Number(amount);
    const newValue = Number(form.Balance) + numericAmount;

    try {
      const ref = doc(db, "doc", form.id);
      const newHistoric = appendString(
        form.Historic,
        generateData(
          numericAmount,
          Number(form.DailyMoney),
          "dep",
          depositMode,
          depositQuantity
        )
      );

      await updateDoc(ref, {
        Balance: String(newValue),
        Historic: newHistoric,
      });

      const modeLabel =
        depositMode === "jour"
          ? `${depositQuantity} jour(s)`
          : depositMode === "semaine"
          ? `${depositQuantity} semaine(s)`
          : depositMode === "mois"
          ? `${depositQuantity} mois`
          : "montant libre";

      addHistoryEntry({
        type: "depot",
        description: `Dépôt (${modeLabel}): ${form.Nom} ${form.Prenom}`,
        details: `Montant: +${numericAmount}$ht · Mode: ${modeLabel} · Nouvelle balance: ${newValue}$ht`,
      });

      setForm((prev) =>
        prev
          ? {
              ...prev,
              Balance: String(newValue),
              Historic: newHistoric,
            }
          : prev
      );

      setAmount("");
      setPassDelete("");
      setPassDeleteOk(false);
      setOpenAdd(false);
      alert(`Dépôt de +${numericAmount.toLocaleString()} $ht (${modeLabel}) enregistré avec succès !`);
    } catch (err) {
      console.error("Erreur ajout fund:", err);
      alert("Erreur lors de l'enregistrement du dépôt.");
    } finally {
      setLoadingAdd(false);
    }
  }

  async function removeFunds() {
    if (!form || errorLimitRemove || !passDeleteOk) return;
    const numericAmount = Number(amount);
    if (Number(form?.Balance ?? 0) - numericAmount < 0) {
      setErrorLimitRemove(
        "Impossible de retirer plus que la balance actuelle."
      );
      return;
    }

    setLoadingRemove(true);
    const newValue = Number(form.Balance) - numericAmount;

    try {
      const ref = doc(db, "doc", form.id);
      const newHistoric = appendString(
        form.Historic,
        generateData(
          numericAmount,
          Number(form.DailyMoney),
          "retr",
          "libre"
        )
      );

      await updateDoc(ref, {
        Balance: String(newValue),
        Historic: newHistoric,
      });

      addHistoryEntry({
        type: "retrait",
        description: `Retrait: ${form.Nom} ${form.Prenom}`,
        details: `Montant: -${numericAmount}$ht · Nouvelle balance: ${newValue}$ht`,
      });

      setForm((prev) =>
        prev
          ? {
              ...prev,
              Balance: String(newValue),
              Historic: newHistoric,
            }
          : prev
      );

      setAmount("");
      setPassDelete("");
      setPassDeleteOk(false);
      setOpenRemove(false);
      alert(`Retrait effectué avec succès: -${numericAmount} $ht !`);
    } catch (err) {
      console.error("Erreur retrait fond:", err);
      alert("Erreur lors du retrait.");
    } finally {
      setLoadingRemove(false);
    }
  }

  useEffect(() => {
    const fetchForm = async () => {
      docKey.current = (await params).slug;

      try {
        const docRef = doc(db, "doc", docKey.current);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data() as Omit<FormData, "id">;
          setForm({
            id: docSnap.id,
            ...docData,
          });
          if (docData.PlanType && ["jour", "semaine", "mois"].includes(docData.PlanType)) {
            setDepositMode(docData.PlanType);
          }
        }
      } catch (error) {
        console.error("Erreur Firebase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [params]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        getCustomerdata(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const simTotalInterest = useMemo(() => {
    const m = Number(loanSimMontant) || 0;
    const t = Number(storedTaux) || 0;
    const d = Number(loanSimMois) || 1;
    return (m * t * d) / 100;
  }, [loanSimMontant, storedTaux, loanSimMois]);

  const simTotalDu = useMemo(() => {
    return (Number(loanSimMontant) || 0) + simTotalInterest;
  }, [loanSimMontant, simTotalInterest]);

  const simMensualite = useMemo(() => {
    const d = Number(loanSimMois) || 1;
    return d > 0 ? simTotalDu / d : 0;
  }, [simTotalDu, loanSimMois]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL client copiée");
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <LoaderIcon className="w-8 h-8 text-violet-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-medium">
          Chargement du carnet client...
        </p>
      </div>
    );
  }

  const currentBalance = Number(form.Balance) || 0;
  const totalBalance = Number(form.TotalBalance) || 1;
  const progressPercent = Math.min(
    100,
    Math.round((currentBalance / totalBalance) * 100),
  );
  const isDestroyed = form.Detruit === "oui";

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex-1">
            {user && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au Tableau de Bord
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                isDestroyed
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isDestroyed ? "Carnet Clôturé / Détruit" : "Carnet Actif"}
            </span>

            {user && (
              <span className="hidden md:flex text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg items-center gap-1">
                Lien public : Client voit solde sans compte
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={copyUrl}
              className="text-xs font-semibold text-slate-700 border-slate-200 gap-1.5 rounded-xl h-9"
            >
              <Copy className="w-3.5 h-3.5" />
              Copier URL
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-semibold text-slate-700 border-slate-200 gap-1.5 rounded-xl h-9"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer / PDF
            </Button>
          </div>
        </div>

        {/* Main Passbook Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shadow-md">
                  <Image
                    src={logo}
                    alt="Mario Cash"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Mario Cash
                  </h1>
                  <p className="text-violet-200 text-xs sm:text-sm font-medium">
                    Carnet Numérique d&apos;Épargne & Finance
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/15">
                <p className="text-[11px] text-violet-200 uppercase font-semibold">
                  Date d&apos;ouverture
                </p>
                <p className="text-sm font-bold text-white">
                  {formatReadableDate(
                    getLocalISOWithoutSeconds(form.StartDate),
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-violet-100">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-200" />
                Règlement : Carnet obligatoire pour toute transaction.
              </span>
              <span className="text-[11px] opacity-80">
                En cas de perte, des frais s&apos;appliquent pour le
                remplacement.
              </span>
            </div>
          </div>

          {/* Client & Account Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Informations du Bénéficiaire
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                    Nom & Prénom
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {form.Nom} {form.Prenom}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                    Téléphone
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {form.Phone || "—"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                    NIF / CIN
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate font-mono">
                    {form.NIF || "—"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      Plan choisi
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        form.PlanType === "semaine"
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : form.PlanType === "mois"
                          ? "bg-violet-100 text-violet-700 border-violet-200"
                          : "bg-sky-100 text-sky-700 border-sky-200"
                      }`}
                    >
                      {form.PlanType === "semaine"
                        ? "Hebdo"
                        : form.PlanType === "mois"
                        ? "Mensuel"
                        : "Quotidien"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-violet-700">
                    {form.PlanType === "semaine"
                      ? `${Math.round(Number(form.Plan) / 7)} Semaines (${form.Plan}j)`
                      : form.PlanType === "mois"
                      ? `${Math.round(Number(form.Plan) / 30)} Mois (${form.Plan}j)`
                      : `${form.Plan} Jours`}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Dates & Daily Contribution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Début
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {formatReadableDate(
                      getLocalISOWithoutSeconds(form.StartDate),
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Fin prévue
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {formatReadableDate(
                      getLocalISOWithoutSeconds(form.EndDate),
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span className="text-[11px] font-medium text-emerald-700">
                      Cotisation de Référence
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-mono">
                    /{form.PlanType || "jour"}
                  </span>
                </div>
                <p className="text-base font-black text-emerald-800">
                  {form.PlanType === "semaine"
                    ? `${form.ContributionAmount || (Number(form.DailyMoney) * 7).toLocaleString()} $ht `
                    : form.PlanType === "mois"
                    ? `${form.ContributionAmount || (Number(form.DailyMoney) * 30).toLocaleString()} $ht `
                    : `${form.DailyMoney} $ht `}
                  <span className="text-xs font-semibold text-emerald-600">
                    / {form.PlanType === "semaine" ? "semaine" : form.PlanType === "mois" ? "mois" : "jour"}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 pt-1.5 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-medium">
                  <span>
                    Jour : <strong>{Number(form.DailyMoney).toFixed(1)}$ht</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Semaine : <strong>{(Number(form.DailyMoney) * 7).toFixed(0)}$ht</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Mois : <strong>{(Number(form.DailyMoney) * 30).toFixed(0)}$ht</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Solde & Progress Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                    Solde Actuel Collecté
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                      {currentBalance.toLocaleString()} $ht
                    </span>
                    <span className="text-sm text-slate-400">
                      / {Number(form.TotalBalance).toLocaleString()} $ht attendu
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xs text-slate-400 block">
                    Reste à collecter
                  </span>
                  <span className="text-lg font-bold text-amber-300">
                    {Math.max(
                      0,
                      Number(form.TotalBalance) - currentBalance,
                    ).toLocaleString()}{" "}
                    $ht
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Progression globale</span>
                  <span className="font-bold text-emerald-400">
                    {progressPercent}% complété
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Operations: Ajouter de l'argent par Jour, Semaine, Mois, ou Montant Libre (Hidden in Print) */}
            {!isDestroyed && user && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-violet-600" />
                      Effectuer un Dépôt ou un Retrait
                    </h3>
                    <p className="text-xs text-slate-500">
                      Choisissez d&apos;ajouter de l&apos;argent par jour, par
                      semaine ou par mois selon la cotisation
                    </p>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 self-start sm:self-auto">
                    Base : {form.DailyMoney} $ht / jour
                  </span>
                </div>

                {/* Period Selector Tabs */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mode d&apos;ajout de l&apos;argent :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => updateDepositByPeriod("jour", 1)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        depositMode === "jour"
                          ? "bg-sky-50 border-sky-500 text-sky-900 shadow-2xs ring-2 ring-sky-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Par Jour</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateDepositByPeriod("semaine", 1)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        depositMode === "semaine"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs ring-2 ring-indigo-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Par Semaine (7j)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateDepositByPeriod("mois", 1)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        depositMode === "mois"
                          ? "bg-violet-50 border-violet-500 text-violet-900 shadow-2xs ring-2 ring-violet-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4 text-violet-600" />
                      <span>Par Mois (30j)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDepositMode("libre");
                        validateAmount(amount || "100");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        depositMode === "libre"
                          ? "bg-slate-100 border-slate-500 text-slate-900 shadow-2xs ring-2 ring-slate-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Coins className="w-4 h-4 text-slate-600" />
                      <span>Montant Libre</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets according to active mode */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  {depositMode === "jour" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Choisissez le nombre de jours à cotiser :
                        </span>
                        <span className="text-[11px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          {depositQuantity} jour{depositQuantity > 1 ? "s" : ""}{" "}
                          = +{(depositQuantity * Number(form.DailyMoney)).toLocaleString()}$ht
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[1, 2, 3, 5, 7, 10, 15, 20, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateDepositByPeriod("jour", d)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                              depositQuantity === d
                                ? "bg-sky-600 text-white border-sky-600 shadow-2xs font-bold"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +{d} j
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {depositMode === "semaine" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Choisissez le nombre de semaines (1 sem = 7 jours) :
                        </span>
                        <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {depositQuantity} sem ({depositQuantity * 7}j) = +
                          {(
                            depositQuantity *
                            7 *
                            Number(form.DailyMoney)
                          ).toLocaleString()}
                          $ht
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => updateDepositByPeriod("semaine", w)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                              depositQuantity === w
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +{w} sem. ({w * 7}j)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {depositMode === "mois" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Choisissez le nombre de mois (1 mois = 30 jours) :
                        </span>
                        <span className="text-[11px] text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                          {depositQuantity} mois ({depositQuantity * 30}j) = +
                          {(
                            depositQuantity *
                            30 *
                            Number(form.DailyMoney)
                          ).toLocaleString()}
                          $ht
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[1, 2, 3, 4, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateDepositByPeriod("mois", m)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                              depositQuantity === m
                                ? "bg-violet-600 text-white border-violet-600 shadow-2xs font-bold"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            +{m} mois ({m * 30}j)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {depositMode === "libre" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Montants rapides prédéfinis ($ht) :
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          Équivaut à{" "}
                          {(
                            Number(amount || 0) /
                            (Number(form.DailyMoney) || 1)
                          ).toFixed(1)}{" "}
                          jours
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["50", "100", "150", "200", "300", "500", "1000", "2000"].map(
                          (val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => validateAmount(val)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                amount === val
                                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {val} $ht
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount input & Live Simulation Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Montant à verser ($ht)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Entrez le montant en $ht..."
                        value={amount}
                        onChange={(e) => {
                          if (depositMode !== "libre") {
                            setDepositMode("libre");
                          }
                          validateAmount(e.target.value);
                        }}
                        className="bg-slate-50 border-slate-200 text-slate-900 font-bold text-base h-11 rounded-xl pr-12"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        $ht
                      </span>
                    </div>

                    {errorLimit && (
                      <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errorLimit}
                      </p>
                    )}
                    {errorLimitRemove && (
                      <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errorLimitRemove}
                      </p>
                    )}
                  </div>

                  {/* Real-time simulation preview card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Aperçu de la transaction :
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Mode sélectionné
                        </span>
                        <span className="font-bold text-slate-800 capitalize">
                          {depositMode === "jour"
                            ? `${depositQuantity} jour(s)`
                            : depositMode === "semaine"
                            ? `${depositQuantity} semaine(s)`
                            : depositMode === "mois"
                            ? `${depositQuantity} mois`
                            : "Montant libre"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Jours crédités
                        </span>
                        <span className="font-bold text-emerald-700">
                          +
                          {(
                            Number(amount || 0) /
                            (Number(form.DailyMoney) || 1)
                          ).toFixed(1)}{" "}
                          j
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Nouveau solde
                        </span>
                        <span className="font-bold text-slate-900">
                          {(
                            currentBalance + Number(amount || 0)
                          ).toLocaleString()}{" "}
                          $ht
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Nouvelle progression
                        </span>
                        <span className="font-bold text-emerald-600">
                          {Math.min(
                            100,
                            Math.round(
                              ((currentBalance + Number(amount || 0)) /
                                totalBalance) *
                                100,
                            ),
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {/* AJOUTER DES FONDS (DEPOT) */}
                  <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-11 px-6 gap-2 shadow-xs"
                        disabled={
                          !amount || Number(amount) <= 0 || !!errorLimit
                        }
                      >
                        <PlusCircle className="w-4 h-4" />
                        Ajouter des fonds (+{Number(amount || 0).toLocaleString()} $ht)
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-slate-900 text-lg font-bold flex items-center gap-2">
                          <PlusCircle className="w-5 h-5 text-emerald-600" />
                          Confirmer le dépôt
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                          Ajout de{" "}
                          <strong>{Number(amount || 0).toLocaleString()} $ht</strong>{" "}
                          au carnet de{" "}
                          <strong>
                            {form.Nom} {form.Prenom}
                          </strong>
                          .
                        </DialogDescription>
                      </DialogHeader>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 my-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mode :</span>
                          <span className="font-bold text-slate-800 capitalize">
                            {depositMode} ({depositQuantity})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Jours crédités :
                          </span>
                          <span className="font-bold text-emerald-700">
                            +
                            {(
                              Number(amount) / Number(form.DailyMoney)
                            ).toFixed(1)}{" "}
                            jours
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                          <span className="text-slate-700">Nouveau Solde :</span>
                          <span className="text-emerald-700">
                            {(currentBalance + Number(amount)).toLocaleString()}{" "}
                            $ht
                          </span>
                        </div>
                      </div>

                      <div className="py-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Entrez votre mot de passe gestionnaire pour autoriser :
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={passDelete}
                            onChange={(e) => setPassDelete(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200 text-slate-900"
                            autoFocus
                          />
                        </div>
                        {passDelete && (
                          <div className="text-xs font-semibold pt-1">
                            {passDeleteOk ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mot de
                                passe correct (Autorisé)
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Mot de
                                passe incorrect
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenAdd(false);
                            setPassDelete("");
                            setPassDeleteOk(false);
                          }}
                          className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={addFunds}
                          disabled={loadingAdd || !passDeleteOk}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {loadingAdd ? "Traitement..." : "Confirmer le dépôt"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* RETIRER DES FONDS */}
                  <Dialog open={openRemove} onOpenChange={setOpenRemove}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl h-11 px-5 gap-2 shadow-xs"
                        disabled={
                          !amount || Number(amount) <= 0 || !!errorLimitRemove
                        }
                      >
                        <MinusCircle className="w-4 h-4" />
                        Retirer des fonds
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-slate-900 text-lg font-bold flex items-center gap-2">
                          <MinusCircle className="w-5 h-5 text-rose-600" />
                          Confirmer le retrait
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                          Retrait de{" "}
                          <strong>{Number(amount || 0).toLocaleString()} $ht</strong>{" "}
                          de la balance de{" "}
                          <strong>
                            {form.Nom} {form.Prenom}
                          </strong>
                          .
                        </DialogDescription>
                      </DialogHeader>

                      <div className="py-3 space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Entrez votre mot de passe gestionnaire pour autoriser :
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={passDelete}
                            onChange={(e) => setPassDelete(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200 text-slate-900"
                            autoFocus
                          />
                        </div>
                        {passDelete && (
                          <div className="text-xs font-semibold pt-1">
                            {passDeleteOk ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mot de
                                passe correct (Autorisé)
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Mot de
                                passe incorrect
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenRemove(false);
                            setPassDelete("");
                            setPassDeleteOk(false);
                          }}
                          className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={removeFunds}
                          disabled={loadingRemove || !passDeleteOk}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                        >
                          {loadingRemove
                            ? "Traitement..."
                            : "Confirmer le retrait"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {/* SECTION: Proposition de Prêt & Simulation avec Taux localStorage */}
            {user && (
              <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5 shadow-xs space-y-3 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                      <HandCoins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-violet-900">
                        Option de Prêt pour {form.Nom} {form.Prenom}
                      </h3>
                      <p className="text-xs text-violet-600">
                        Taux d&apos;intérêt configuré :{" "}
                        <strong>{storedTaux}%</strong> (enregistré dans vos
                        paramètres)
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const url = `/dashboard/prets?clientId=${form.id}&nom=${encodeURIComponent(
                        form.Nom,
                      )}&prenom=${encodeURIComponent(
                        form.Prenom,
                      )}&phone=${encodeURIComponent(
                        form.Phone || "",
                      )}&nif=${encodeURIComponent(
                        form.NIF || "",
                      )}&montant=${loanSimMontant}`;
                      router.push(url);
                    }}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl h-9 gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Accorder un prêt à ce client
                  </Button>
                </div>

                {/* Mini simulation preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-violet-200/80 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">
                      Montant ($)
                    </label>
                    <Input
                      type="number"
                      value={loanSimMontant}
                      onChange={(e) => setLoanSimMontant(e.target.value)}
                      className="h-8 bg-white border-slate-200 text-xs font-bold text-slate-900 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">
                      Durée (mois)
                    </label>
                    <Input
                      type="number"
                      value={loanSimMois}
                      onChange={(e) => setLoanSimMois(e.target.value)}
                      className="h-8 bg-white border-slate-200 text-xs font-bold text-slate-900 rounded-lg"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-violet-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Intérêts ({storedTaux}%)
                    </span>
                    <span className="font-bold text-amber-600">
                      {simTotalInterest.toFixed(2)}$
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-violet-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Mensualité
                    </span>
                    <span className="font-bold text-emerald-700">
                      {simMensualite.toFixed(2)}$ / m
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions History Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" />
                  Tableau & Historique du Carnet
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Plan :{" "}
                  <strong>
                    {form.PlanType === "semaine"
                      ? `${Math.round(Number(form.Plan) / 7)} sem. (${form.Plan}j)`
                      : form.PlanType === "mois"
                      ? `${Math.round(Number(form.Plan) / 30)} mois (${form.Plan}j)`
                      : `${form.Plan} jours`}
                  </strong>{" "}
                  · Cotisation :{" "}
                  <strong>
                    {form.PlanType === "semaine"
                      ? `${form.ContributionAmount || (Number(form.DailyMoney) * 7).toString()}$ht / sem`
                      : form.PlanType === "mois"
                      ? `${form.ContributionAmount || (Number(form.DailyMoney) * 30).toString()}$ht / mois`
                      : `${form.DailyMoney}$ht / jour`}
                  </strong>
                </span>
              </div>

              <div>
                <LockerTable
                  plan={Number(form.Plan)}
                  data={form.Historic}
                  dailyMoney={Number(form.DailyMoney)}
                  planType={form.PlanType}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 print:hidden">
          Ti kanè Finance · Système de gestion de prêts et d&apos;épargne
        </p>
      </div>
    </div>
  );
}
