"use client";

import { db } from "@/app/firebase/config";
import { generateData } from "@/app/function/function";
import { addHistoryEntry } from "@/app/function/history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Sparkles,
  Calendar,
  DollarSign,
  Layers,
  CalendarDays,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export type PlanType = "jour" | "semaine" | "mois";

// Durées préconisées par type de plan
export const PLAN_DAYS_PRESETS = [
  { label: "100 jours", days: 100 },
  { label: "200 jours", days: 200 },
  { label: "300 jours", days: 300 },
  { label: "365 jours (1 an)", days: 365 },
];

export const PLAN_WEEKS_PRESETS = [
  { label: "12 sem. (~3 mois)", weeks: 12, days: 12 * 7 },
  { label: "26 sem. (~6 mois)", weeks: 26, days: 26 * 7 },
  { label: "52 sem. (1 an)", weeks: 52, days: 52 * 7 },
];

export const PLAN_MONTHS_PRESETS = [
  { label: "3 mois", months: 3, days: 3 * 30 },
  { label: "6 mois", months: 6, days: 6 * 30 },
  { label: "10 mois", months: 10, days: 10 * 30 },
  { label: "12 mois (1 an)", months: 12, days: 12 * 30 },
];

const STORAGE_KEY = "nouveau-client:plan-options";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [planType, setPlanType] = useState<PlanType>("jour");

  // Units count according to planType (e.g. 100 days, 26 weeks, 6 months)
  const [planUnits, setPlanUnits] = useState<number>(100);
  const [contribution, setContribution] = useState<string>("");

  // true une fois localStorage lu (évite d'écraser les valeurs sauvées)
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    Nom: "",
    Prenom: "",
    StartDate: new Date().toISOString().slice(0, 16),
    EndDate: "",
    NIF: "",
    Phone: "",
    Plan: 100, // Total number of days
    PlanType: "jour" as PlanType,
    ContributionAmount: "", // Amount per unit (per day, per week, per month)
    DailyMoney: "", // Equivalent daily amount
    Balance: "",
    TotalBalance: "",
    Historic: "",
    Detruit: "non",
  });

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addDaysToDate = (date: string, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 16);
  };

  const getDiffDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Switch Plan Type handler
  const handleSelectPlanType = (type: PlanType) => {
    setPlanType(type);
    handleChange("PlanType", type);

    let defaultDays = 100;
    let defaultUnits = 100;

    if (type === "jour") {
      defaultDays = 100;
      defaultUnits = 100;
    } else if (type === "semaine") {
      defaultDays = 26 * 7;
      defaultUnits = 26;
    } else if (type === "mois") {
      defaultDays = 6 * 30;
      defaultUnits = 6;
    }

    setPlanUnits(defaultUnits);
    handleChange("Plan", defaultDays);
    handleChange("EndDate", addDaysToDate(form.StartDate, defaultDays));
  };

  // Charger dernières options depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const validTypes: PlanType[] = ["jour", "semaine", "mois"];

        if (validTypes.includes(saved.planType)) {
          setPlanType(saved.planType);
          handleChange("PlanType", saved.planType);
        }
        if (Number(saved.planUnits) > 0) {
          setPlanUnits(Number(saved.planUnits));
        }
        if (Number(saved.plan) > 0) {
          handleChange("Plan", Number(saved.plan));
        }
      }
    } catch (e) {
      console.error("Erreur lecture localStorage:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Sauver options à chaque changement
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          planType,
          planUnits,
          plan: form.Plan,
        })
      );
    } catch (e) {
      console.error("Erreur écriture localStorage:", e);
    }
  }, [hydrated, planType, planUnits, form.Plan]);

  // Update EndDate when StartDate or Plan changes
  useEffect(() => {
    handleChange("EndDate", addDaysToDate(form.StartDate, Number(form.Plan) || 100));
  }, [form.StartDate, form.Plan]);

  // Recalculate totals and daily equivalent whenever contribution, planType or planUnits change
  useEffect(() => {
    const contVal = Number(contribution) || 0;
    let total = 0;
    let dailyEq = 0;

    if (planType === "jour") {
      total = contVal * planUnits;
      dailyEq = contVal;
    } else if (planType === "semaine") {
      total = contVal * planUnits;
      dailyEq = contVal > 0 ? contVal / 7 : 0;
    } else if (planType === "mois") {
      total = contVal * planUnits;
      dailyEq = contVal > 0 ? contVal / 30 : 0;
    }

    handleChange("ContributionAmount", contribution);
    handleChange("DailyMoney", dailyEq > 0 ? Number(dailyEq.toFixed(2)).toString() : "0");
    handleChange("TotalBalance", total.toString());
  }, [contribution, planType, planUnits]);

  // Handle manual EndDate change
  const handleEndDateChange = (value: string) => {
    handleChange("EndDate", value);
    const diffDays = getDiffDays(form.StartDate, value);
    handleChange("Plan", diffDays);

    if (planType === "jour") {
      setPlanUnits(diffDays);
    } else if (planType === "semaine") {
      setPlanUnits(Math.round(diffDays / 7) || 1);
    } else if (planType === "mois") {
      setPlanUnits(Math.round(diffDays / 30) || 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const dailyRate = Number(form.DailyMoney) || 1;
      const initialDeposit = Number(form.Balance) || 0;

      // Ensure historic is created properly if initial deposit exists
      const historicData =
        form.Historic ||
        (initialDeposit > 0
          ? generateData(initialDeposit, dailyRate, "dep", planType, 1)
          : "");

      const payload = {
        ...form,
        PlanType: planType,
        ContributionAmount: contribution || form.DailyMoney,
        Historic: historicData,
      };

      await addDoc(collection(db, "doc"), payload);

      const planUnitLabel =
        planType === "jour"
          ? `${planUnits} jours`
          : planType === "semaine"
            ? `${planUnits} semaines (${form.Plan}j)`
            : `${planUnits} mois (${form.Plan}j)`;

      addHistoryEntry({
        type: "creation",
        description: `Nouveau client: ${form.Nom} ${form.Prenom}`,
        details: `Type: Plan ${planType.toUpperCase()} · Cotisation: ${contribution}$ht/${planType} · Durée: ${planUnitLabel} · Total: ${form.TotalBalance}$ht`,
      });

      alert("Client ajouté avec succès !");
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’ajout du client");
    } finally {
      setLoading(false);
    }
  };

  const totalExpected = Number(form.TotalBalance) || 0;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            Nouveau Client
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enregistrer un nouveau client et initialiser son carnet selon le type de plan choisi
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* ÉTAPE 1 : CHOIX DU TYPE DE PLAN (/jour, /semaine, /mois) */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              1. Sélectionner le Type de Plan
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              Fréquence de cotisation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Plan Quotidien */}
            <button
              type="button"
              onClick={() => handleSelectPlanType("jour")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${planType === "jour"
                  ? "bg-sky-50/80 border-sky-500 shadow-sm ring-2 ring-sky-500/20"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${planType === "jour"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                {planType === "jour" && (
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Plan Quotidien</p>
                <p className="text-xs text-slate-500 mt-0.5">Cotisation par jour</p>
              </div>
            </button>

            {/* Plan Hebdomadaire */}
            <button
              type="button"
              onClick={() => handleSelectPlanType("semaine")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${planType === "semaine"
                  ? "bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${planType === "semaine"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                {planType === "semaine" && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Plan Hebdomadaire</p>
                <p className="text-xs text-slate-500 mt-0.5">Cotisation par semaine (7j)</p>
              </div>
            </button>

            {/* Plan Mensuel */}
            <button
              type="button"
              onClick={() => handleSelectPlanType("mois")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${planType === "mois"
                  ? "bg-violet-50/80 border-violet-500 shadow-sm ring-2 ring-violet-500/20"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${planType === "mois"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}
                >
                  <CalendarDays className="w-4 h-4" />
                </div>
                {planType === "mois" && (
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Plan Mensuel</p>
                <p className="text-xs text-slate-500 mt-0.5">Cotisation par mois (30j)</p>
              </div>
            </button>
          </div>
        </div>

        {/* ÉTAPE 2 : SÉLECTION DE LA DURÉE DU PLAN SELON LE TYPE */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Durée du Plan (
              {planType === "jour"
                ? "en Jours"
                : planType === "semaine"
                  ? "en Semaines"
                  : "en Mois"}
              )
            </h2>

            <div className="bg-violet-50 text-violet-700 px-3 py-1 rounded-xl border border-violet-200 text-xs font-bold">
              Total prévu = {totalExpected.toLocaleString()} $ht
            </div>
          </div>

          {/* Presets par Jour */}
          {planType === "jour" && (
            <div className="flex flex-wrap gap-2 items-center">
              {PLAN_DAYS_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => {
                    setPlanUnits(p.days);
                    handleChange("Plan", p.days);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${planUnits === p.days
                      ? "bg-sky-600 text-white border-sky-600 shadow-2xs font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Presets par Semaine */}
          {planType === "semaine" && (
            <div className="flex flex-wrap gap-2 items-center">
              {PLAN_WEEKS_PRESETS.map((p) => (
                <button
                  key={p.weeks}
                  type="button"
                  onClick={() => {
                    setPlanUnits(p.weeks);
                    handleChange("Plan", p.days);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${planUnits === p.weeks
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Presets par Mois */}
          {planType === "mois" && (
            <div className="flex flex-wrap gap-2 items-center">
              {PLAN_MONTHS_PRESETS.map((p) => (
                <button
                  key={p.months}
                  type="button"
                  onClick={() => {
                    setPlanUnits(p.months);
                    handleChange("Plan", p.days);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${planUnits === p.months
                      ? "bg-violet-600 text-white border-violet-600 shadow-2xs font-bold"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Durée sélectionnée : <strong>{planUnits} {planType === "jour" ? "jours" : planType === "semaine" ? "semaines" : "mois"}</strong>{" "}
            (soit <strong>{form.Plan} jours</strong> au total sur le calendrier).
          </p>
        </div>

        {/* ÉTAPE 3 : FORMULAIRE INFORMATIONS CLIENT & COTISATION */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cotisation selon le type de plan */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold flex items-center justify-between">
                <span>
                  {planType === "jour"
                    ? "Cotisation quotidienne ($ht / jour) *"
                    : planType === "semaine"
                      ? "Cotisation hebdomadaire ($ht / semaine) *"
                      : "Cotisation mensuelle ($ht / mois) *"}
                </span>
                <span className="text-[10px] text-violet-600 font-normal">
                  Plan {planType}
                </span>
              </label>
              <Input
                type="number"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder={
                  planType === "jour"
                    ? "Ex: 100"
                    : planType === "semaine"
                      ? "Ex: 500"
                      : "Ex: 2000"
                }
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11 font-bold"
              />
              <p className="text-[11px] text-slate-400">
                {planType === "jour"
                  ? "Montant versé chaque jour par le client"
                  : planType === "semaine"
                    ? `Soit environ ${(Number(contribution) / 7).toFixed(1)} $ht / jour`
                    : `Soit environ ${(Number(contribution) / 30).toFixed(1)} $ht / jour`}
              </p>
            </div>

            {/* Montant initial versé (Balance) */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-700 font-semibold">
                  Montant initial versé ($ht) *
                </label>
                {Number(contribution) > 0 && (
                  <span className="text-[10px] text-slate-400">
                    Base : {contribution}$ht / {planType}
                  </span>
                )}
              </div>
              <Input
                type="number"
                value={form.Balance}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("Balance", val);
                  const dailyRate = Number(form.DailyMoney) || 1;
                  handleChange(
                    "Historic",
                    generateData(Number(val), dailyRate, "dep", planType, 1)
                  );
                }}
                placeholder="Montant initial déposé"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />

              {/* Raccourcis de versement initial selon le type de plan */}
              {Number(contribution) > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">
                    Raccourcis :
                  </span>
                  {planType === "jour" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution);
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, val, "dep", "jour", 1));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                      >
                        1 jour ({contribution}$ht)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution) * 2;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, Number(contribution), "dep", "jour", 2));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                      >
                        2 jours ({Number(contribution) * 2}$ht)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution) * 7;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, Number(contribution), "dep", "jour", 7));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                      >
                        7 jours ({Number(contribution) * 7}$ht)
                      </button>
                    </>
                  )}

                  {planType === "semaine" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution);
                          const daily = val / 7;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, daily, "dep", "semaine", 1));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                      >
                        1 semaine ({contribution}$ht)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution) * 2;
                          const daily = Number(contribution) / 7;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, daily, "dep", "semaine", 2));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                      >
                        2 semaines ({Number(contribution) * 2}$ht)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution) * 4;
                          const daily = Number(contribution) / 7;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, daily, "dep", "semaine", 4));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                      >
                        4 semaines ({Number(contribution) * 4}$ht)
                      </button>
                    </>
                  )}

                  {planType === "mois" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution);
                          const daily = val / 30;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, daily, "dep", "mois", 1));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
                      >
                        1 mois ({contribution}$ht)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(contribution) * 2;
                          const daily = Number(contribution) / 30;
                          handleChange("Balance", String(val));
                          handleChange("Historic", generateData(val, daily, "dep", "mois", 2));
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
                      >
                        2 mois ({Number(contribution) * 2}$ht)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* StartDate */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Date de début du carnet
              </label>
              <Input
                value={form.StartDate}
                onChange={(e) => handleChange("StartDate", e.target.value)}
                type="datetime-local"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11 text-xs"
              />
            </div>

            {/* EndDate */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Date de fin prévue
              </label>
              <Input
                value={form.EndDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                type="datetime-local"
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11 text-xs"
              />
            </div>

            {/* Nom */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Nom de famille *
              </label>
              <Input
                value={form.Nom}
                onChange={(e) => handleChange("Nom", e.target.value)}
                placeholder="Nom"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />
            </div>

            {/* Prenom */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Prénom *
              </label>
              <Input
                value={form.Prenom}
                onChange={(e) => handleChange("Prenom", e.target.value)}
                placeholder="Prénom"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />
            </div>

            {/* NIF */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                NIF / CIN *
              </label>
              <Input
                value={form.NIF}
                onChange={(e) => handleChange("NIF", e.target.value)}
                placeholder="Ex: 000-000-000-0"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11 font-mono text-sm"
              />
            </div>

            {/* Phone */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Numéro de Téléphone
              </label>
              <Input
                value={form.Phone}
                onChange={(e) => handleChange("Phone", e.target.value)}
                placeholder="Ex: +509 3700-0000"
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />
            </div>
          </div>

          {/* Live Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Récapitulatif du Carnet Client
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Type de Plan</span>
                <strong className="text-slate-900 capitalize">
                  Plan {planType}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Durée du Plan</span>
                <strong className="text-slate-900">
                  {planUnits} {planType === "jour" ? "jours" : planType === "semaine" ? "semaines" : "mois"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cotisation</span>
                <strong className="text-violet-700">
                  {contribution || "0"} $ht / {planType}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total à terme</span>
                <strong className="text-emerald-700 font-bold">
                  {totalExpected.toLocaleString()} $ht
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 text-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Enregistrer le Client & Créer le Carnet ({planType})
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
