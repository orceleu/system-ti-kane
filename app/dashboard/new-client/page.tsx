"use client";
import { db } from "@/app/firebase/config";
import { generateData } from "@/app/function/function";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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
      alert("Client ajouté avec succès");

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
      // setDisableEnd(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Ajouter un client
        </h1>

        <h2 className="text-xl underline text-gray-700 font-bold text-center my-5">
          Durée
        </h2>

        <div className="flex justify-center mx-auto my-5 items-center">
          <Tabs defaultValue="100jours">
            <TabsList>
              <TabsTrigger
                value="100jours"
                onClick={() => {
                  handleChange("Plan", PLAN1);
                  handleChange("EndDate", addDaysToDate(form.StartDate, PLAN1));
                }}
              >
                100 jours
              </TabsTrigger>
              <TabsTrigger
                value="200jours"
                onClick={() => {
                  handleChange("Plan", PLAN2);
                  handleChange("EndDate", addDaysToDate(form.StartDate, PLAN2));
                }}
              >
                200 jours
              </TabsTrigger>
              <TabsTrigger
                value="300jours"
                onClick={() => {
                  handleChange("Plan", PLAN3);
                  handleChange("EndDate", addDaysToDate(form.StartDate, PLAN3));
                }}
              >
                300 jours
              </TabsTrigger>
              <TabsTrigger
                value="365jours"
                onClick={() => {
                  handleChange("Plan", PLAN4);
                  handleChange("EndDate", addDaysToDate(form.StartDate, PLAN4));
                }}
              >
                365 jours
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-gray-700 font-bold mx-3">= {money} $ht</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid gap-10">
            <div className="grid grid-cols-2 gap-4">
              {/* Daily */}
              <div className="grid gap-2">
                <p>Carte de:</p>
                <Input
                  type="number"
                  value={form.DailyMoney}
                  onChange={(e) => handleChange("DailyMoney", e.target.value)}
                  placeholder="Montant ($ht)"
                  required
                />
              </div>

              {/* Balance */}
              <div className="grid gap-2">
                <p>Ajouté :</p>
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
                        "dep",
                      ),
                    );
                  }}
                  placeholder="Montant initial"
                  required
                />
              </div>

              {/* StartDate */}
              <div className="grid gap-2">
                <p>Début</p>
                <Input
                  value={form.StartDate}
                  onChange={(e) => handleChange("StartDate", e.target.value)}
                  type="datetime-local"
                  required
                />
              </div>

              {/* EndDate */}
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <p>Fin</p>
                </div>

                <Input
                  value={form.EndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  type="datetime-local"
                />
              </div>

              {/* Nom */}
              <Input
                value={form.Nom}
                onChange={(e) => handleChange("Nom", e.target.value)}
                placeholder="Nom"
                required
              />

              {/* Prenom */}
              <Input
                value={form.Prenom}
                onChange={(e) => handleChange("Prenom", e.target.value)}
                placeholder="Prenom"
                required
              />

              {/* NIF */}
              <Input
                value={form.NIF}
                onChange={(e) => handleChange("NIF", e.target.value)}
                placeholder="NIF"
                required
              />

              {/* Phone */}
              <Input
                value={form.Phone}
                onChange={(e) => handleChange("Phone", e.target.value)}
                placeholder="+509"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Ajout en cours...
                </span>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
