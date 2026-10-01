"use client";
import { db } from "@/app/firebase/config";
import { generateData } from "@/app/function/function";
import { addHistoryEntry } from "@/app/function/history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { UserPlus, Sparkles, Calendar, DollarSign } from "lucide-react";

export const PLAN1 = 100;
export const PLAN2 = 200;
export const PLAN3 = 300;
export const PLAN4 = 365;

export default function Page() {
  const [money, setMoney] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    Nom: "",
    Prenom: "",
    StartDate: new Date().toISOString().slice(0, 16),
    EndDate: "",
    NIF: "",
    Phone: "",
    Plan: PLAN1,
    DailyMoney: "",
    Balance: "",
    TotalBalance: "",
    Historic: "",
    Detruit: "non",
  });

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calculateMoney = (daily: number, days: number) => daily * days;

  const addDaysToDate = (date: string, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 16);
  };

  const getDiffDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Initialisation EndDate
  useEffect(() => {
    handleChange("EndDate", addDaysToDate(form.StartDate, form.Plan));
  }, []);

  // Recalcul EndDate si StartDate ou Plan change
  useEffect(() => {
    handleChange("EndDate", addDaysToDate(form.StartDate, form.Plan));
  }, [form.StartDate, form.Plan]);

  // Calcul automatique
  useEffect(() => {
    const daily = Number(form.DailyMoney) || 0;
    const total = calculateMoney(daily, form.Plan);
    handleChange("TotalBalance", total.toString());
    setMoney(total);
  }, [form.DailyMoney, form.Plan]);

  const handleEndDateChange = (value: string) => {
    handleChange("EndDate", value);

    const diffDays = getDiffDays(form.StartDate, value);
    const daily = Number(form.DailyMoney) || 0;

    handleChange("Plan", diffDays);
    handleChange("TotalBalance", calculateMoney(daily, diffDays).toString());
    setMoney(calculateMoney(daily, diffDays));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await addDoc(collection(db, "doc"), form);
      addHistoryEntry({
        type: "creation",
        description: `Nouveau client: ${form.Nom} ${form.Prenom}`,
        details: `Carte: ${form.DailyMoney}$ht · Plan: ${form.Plan}j · Balance initiale: ${form.Balance}$ht`,
      });
      alert("Client ajouté avec succès !");

      setForm({
        Nom: "",
        Prenom: "",
        StartDate: new Date().toISOString().slice(0, 16),
        EndDate: "",
        NIF: "",
        Phone: "",
        Plan: PLAN1,
        DailyMoney: "",
        Balance: "",
        TotalBalance: "",
        Historic: "",
        Detruit: "non",
      });

      setMoney(0);
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <UserPlus className="w-5 h-5" />
            </div>
            Nouveau Client
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enregistrer un nouveau client et initialiser son carnet d&apos;épargne
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Durée du plan */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sélectionner la Durée du plan
          </h2>

          <div className="flex flex-wrap gap-3 items-center">
            <Tabs defaultValue="100jours">
              <TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-xl">
                <TabsTrigger
                  value="100jours"
                  onClick={() => {
                    handleChange("Plan", PLAN1);
                    handleChange("EndDate", addDaysToDate(form.StartDate, PLAN1));
                  }}
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-2xs"
                >
                  100 jours
                </TabsTrigger>
                <TabsTrigger
                  value="200jours"
                  onClick={() => {
                    handleChange("Plan", PLAN2);
                    handleChange("EndDate", addDaysToDate(form.StartDate, PLAN2));
                  }}
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-2xs"
                >
                  200 jours
                </TabsTrigger>
                <TabsTrigger
                  value="300jours"
                  onClick={() => {
                    handleChange("Plan", PLAN3);
                    handleChange("EndDate", addDaysToDate(form.StartDate, PLAN3));
                  }}
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-2xs"
                >
                  300 jours
                </TabsTrigger>
                <TabsTrigger
                  value="365jours"
                  onClick={() => {
                    handleChange("Plan", PLAN4);
                    handleChange("EndDate", addDaysToDate(form.StartDate, PLAN4));
                  }}
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-2xs"
                >
                  365 jours
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-violet-50 text-violet-700 px-3.5 py-1.5 rounded-xl border border-violet-200 text-sm font-bold">
              Total prévu = {money.toLocaleString()} $ht
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Carte quotidienne ($ht) *
              </label>
              <Input
                type="number"
                value={form.DailyMoney}
                onChange={(e) => handleChange("DailyMoney", e.target.value)}
                placeholder="Ex: 100"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />
            </div>

            {/* Balance */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Montant initial versé ($ht) *
              </label>
              <Input
                type="number"
                value={form.Balance}
                onChange={(e) => {
                  handleChange("Balance", e.target.value);
                  handleChange(
                    "Historic",
                    generateData(
                      Number(e.target.value),
                      Number(form.DailyMoney),
                      "dep"
                    )
                  );
                }}
                placeholder="Montant initial"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-11"
              />
            </div>

            {/* StartDate */}
            <div className="grid gap-1.5">
              <label className="text-xs text-slate-700 font-semibold">
                Date de début
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
                Date de fin
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

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="submit"
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20 text-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ajout en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Enregistrer le Client
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
