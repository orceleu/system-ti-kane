"use client";

import React, { useMemo, useState } from "react";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
  parseHistoric,
  TransactionItem,
} from "../function/function";
import {
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  CalendarDays,
  Coins,
  History as HistoryIcon,
  Grid3X3,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  plan: number; // nombre total de casiers
  data: string; // "date,montant,jours,action;..."
  dailyMoney?: number;
  planType?: "jour" | "semaine" | "mois";
};

export default function LockerTable({
  plan,
  data,
  dailyMoney = 0,
  planType = "jour",
}: Props) {
  const [viewMode, setViewMode] = useState<"journal" | "grille">("journal");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Parse transactions using the enhanced parser
  const transactions = useMemo(() => {
    return parseHistoric(data, dailyMoney);
  }, [data, dailyMoney]);

  // Compute running balance for each transaction chronologically (from oldest to newest)
  const transactionsWithRunningBalance = useMemo(() => {
    let running = 0;
    return transactions.map((t) => {
      if (t.action === "dep") {
        running += t.amount;
      } else {
        running = Math.max(0, running - t.amount);
      }
      return {
        ...t,
        runningBalance: running,
      };
    });
  }, [transactions]);

  // Sorted list according to user preference
  const displayedTransactions = useMemo(() => {
    const list = [...transactionsWithRunningBalance];
    if (sortOrder === "desc") {
      return list.reverse();
    }
    return list;
  }, [transactionsWithRunningBalance, sortOrder]);

  // Compute total days and amounts
  const totalDays = useMemo(() => {
    return transactions.reduce(
      (acc, row) => acc + (row.action === "dep" ? row.days : 0),
      0
    );
  }, [transactions]);

  const totalDaysRetr = useMemo(() => {
    return transactions.reduce(
      (acc, row) => acc + (row.action === "retr" ? row.days : 0),
      0
    );
  }, [transactions]);

  const totalDeposits = useMemo(() => {
    return transactions.reduce(
      (acc, row) => acc + (row.action === "dep" ? row.amount : 0),
      0
    );
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions.reduce(
      (acc, row) => acc + (row.action === "retr" ? row.amount : 0),
      0
    );
  }, [transactions]);

  const netDays = Math.max(0, totalDays - totalDaysRetr);
  const netAmount = Math.max(0, totalDeposits - totalWithdrawals);
  const percentage =
    plan > 0 ? Math.min(100, Math.round((netDays / plan) * 100)) : 0;

  const weeksEquivalent = (netDays / 7).toFixed(1);
  const monthsEquivalent = (netDays / 30).toFixed(1);

  // Helper to format mode badge
  const renderModeBadge = (item: TransactionItem) => {
    switch (item.mode) {
      case "jour":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Calendar className="w-3 h-3 text-sky-600" />
            Par Jour ({item.quantite}j)
          </span>
        );
      case "semaine":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-3 h-3 text-indigo-600" />
            Par Semaine ({item.quantite} sem / {item.days}j)
          </span>
        );
      case "mois":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <CalendarDays className="w-3 h-3 text-violet-600" />
            Par Mois ({item.quantite} mois / {item.days}j)
          </span>
        );
      case "libre":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Coins className="w-3 h-3 text-slate-500" />
            Montant libre ({Number(item.days.toFixed(1))}j)
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Multi-Period Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
            Jours Cotisés
          </span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base sm:text-lg font-bold text-slate-900">
              {Number(netDays.toFixed(1))}
            </strong>
            <span className="text-xs text-slate-400">/ {plan} jours</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            {percentage}% du plan
          </span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
            Équivalent Semaines
          </span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base sm:text-lg font-bold text-indigo-700">
              {weeksEquivalent}
            </strong>
            <span className="text-xs text-slate-400">
              / {(plan / 7).toFixed(1)} sem.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            1 sem. = 7 jours
          </span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
            Équivalent Mois
          </span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base sm:text-lg font-bold text-violet-700">
              {monthsEquivalent}
            </strong>
            <span className="text-xs text-slate-400">
              / {(plan / 30).toFixed(1)} mois
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            1 mois = 30 jours
          </span>
        </div>

        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <span className="text-[11px] font-medium text-emerald-700 block mb-0.5">
            Solde Net Déposé
          </span>
          <div className="flex items-baseline gap-1">
            <strong className="text-base sm:text-lg font-black text-emerald-800">
              {netAmount.toLocaleString()}
            </strong>
            <span className="text-xs text-emerald-600 font-semibold">$ht</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
            {transactions.length} opération{transactions.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Progression du carnet :</span>
            <strong className="text-slate-900">
              {Number(netDays.toFixed(1))} jours couverts sur {plan}
            </strong>
          </div>
          <span className="font-bold text-emerald-700">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* View Switcher & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("journal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "journal"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-violet-600" />
            Journal des versements ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode("grille")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "grille"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-emerald-600" />
            Grille des casiers ({plan} cases)
          </button>
        </div>

        {viewMode === "journal" && transactions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="h-8 text-xs font-medium text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5 rounded-lg"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            {sortOrder === "desc"
              ? "Plus récents d'abord"
              : "Plus anciens d'abord"}
          </Button>
        )}
      </div>

      {/* VIEW 1: Journal des Versements (Table claire et ordonnée) */}
      {viewMode === "journal" && (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-4">Date de l&apos;opération</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-4">Mode / Fréquence</th>
                <th className="py-2.5 px-3 text-center">Jours crédités</th>
                <th className="py-2.5 px-4 text-right">Montant</th>
                <th className="py-2.5 px-4 text-right">Solde cumulé</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    <HistoryIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">
                      Aucun versement enregistré pour le moment
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Effectuez un dépôt par jour, semaine ou mois ci-dessus pour
                      commencer.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((row) => {
                  const isDeposit = row.action === "dep";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                        {row.id}
                      </td>

                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {formatReadableDate(getLocalISOWithoutSeconds(row.date))}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isDeposit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <ArrowDownCircle className="w-3 h-3 text-emerald-600" />{" "}
                            Dépôt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            <ArrowUpCircle className="w-3 h-3 text-rose-600" />{" "}
                            Retrait
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">{renderModeBadge(row)}</td>

                      <td className="py-2.5 px-3 text-center font-semibold">
                        <span
                          className={
                            isDeposit ? "text-emerald-700" : "text-rose-700"
                          }
                        >
                          {isDeposit ? "+" : "-"}
                          {Number(row.days.toFixed(1))} j
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-bold text-sm">
                        <span
                          className={
                            isDeposit ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isDeposit ? "+" : "-"}
                          {row.amount.toLocaleString()} $ht
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {row.runningBalance.toLocaleString()} $ht
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {displayedTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/90 font-bold text-xs text-slate-800 border-t-2 border-slate-200">
                  <td colSpan={4} className="py-3 px-4">
                    Total des opérations ({transactions.length})
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                    {Number(netDays.toFixed(1))} j nets
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-black text-sm">
                    {netAmount.toLocaleString()} $ht net
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900">
                    {netAmount.toLocaleString()} $ht
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* VIEW 2: Grille des Casiers (Carnet Ti-kanè traditionnel) */}
      {viewMode === "grille" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
            <div>
              <h4 className="font-bold text-slate-800">
                Grille des {plan} casiers du carnet
              </h4>
              <p className="text-slate-500 text-[11px]">
                Chaque case cochée en vert représente un jour de cotisation
                validé
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600 inline-block" />
                Validé ({Math.min(plan, Math.floor(netDays))})
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-300 inline-block" />
                Restant ({Math.max(0, plan - Math.floor(netDays))})
              </span>
            </div>
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-20 gap-1.5 max-h-[460px] overflow-y-auto pr-1">
            {Array.from({ length: plan }, (_, i) => {
              const dayNum = i + 1;
              const isPaid = dayNum <= Math.floor(netDays);
              const isPartial =
                !isPaid &&
                dayNum === Math.floor(netDays) + 1 &&
                netDays % 1 > 0;

              return (
                <div
                  key={dayNum}
                  title={`Jour ${dayNum} : ${
                    isPaid
                      ? "Cotisé"
                      : isPartial
                      ? `Partiel (${Math.round((netDays % 1) * 100)}%)`
                      : "En attente"
                  }`}
                  className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all aspect-square select-none ${
                    isPaid
                      ? "bg-emerald-600 border-emerald-600 text-white font-bold shadow-2xs"
                      : isPartial
                      ? "bg-amber-100 border-amber-300 text-amber-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] leading-none font-bold">
                    {dayNum}
                  </span>
                  {isPaid ? (
                    <CheckCircle2 className="w-2.5 h-2.5 mt-0.5 text-emerald-100" />
                  ) : (
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">
                      j
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>
              Total validé : <strong>{Number(netDays.toFixed(1))}</strong> sur{" "}
              <strong>{plan}</strong> jours
            </span>
            <span>
              Reste à compléter :{" "}
              <strong>{Math.max(0, plan - Math.floor(netDays))}</strong> jours
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
