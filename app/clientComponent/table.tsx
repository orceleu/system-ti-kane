"use client";

import React, { useMemo } from "react";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
} from "../function/function";
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type Props = {
  plan: number; // nombre total de casiers
  data: string; // "date,montant,jours,action;..."
};

export default function LockerTable({ plan, data }: Props) {
  // Transforme STRING → MAP
  const parsed = useMemo(() => {
    if (!data || data.trim() === "") return {};

    const entries = data.split(";").map((item) => item.trim());

    const map: Record<
      number,
      { date: string; amount: number; days: number; action: string }
    > = {};

    entries.forEach((item, index) => {
      const [date, amount, days, action] = item.split(",");
      if (date && amount && days && action) {
        map[index + 1] = {
          date,
          amount: Number(amount),
          days: Number(days),
          action,
        };
      }
    });

    return map;
  }, [data]);

  // Total des jours payés
  const totalDays = useMemo(() => {
    return Object.values(parsed).reduce(
      (acc, row) => acc + (row.action === "dep" ? row.days : 0),
      0
    );
  }, [parsed]);

  const totalDaysRetr = useMemo(() => {
    return Object.values(parsed).reduce(
      (acc, row) => acc + (row.action === "retr" ? row.days : 0),
      0
    );
  }, [parsed]);

  const netDays = Math.max(0, totalDays - totalDaysRetr);
  const percentage = plan > 0 ? Math.min(100, Math.round((netDays / plan) * 100)) : 0;

  return (
    <div className="w-full space-y-3">
      {/* Summary metric */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 font-medium">Progression du plan :</span>{" "}
            <strong className="text-slate-900 text-sm">{netDays} / {plan} jours</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-32 h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="font-bold text-emerald-700">{percentage}%</span>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 text-center w-16">Jour #</th>
              <th className="py-2.5 px-4">Date de transaction</th>
              <th className="py-2.5 px-4 text-right">Montant</th>
              <th className="py-2.5 px-4 text-center">Jours crédités/déduits</th>
              <th className="py-2.5 px-4 text-center">Type d&apos;opération</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {Array.from({ length: plan }, (_, i) => {
              const id = i + 1;
              const row = parsed[id];
              const isPaid = id <= netDays;

              return (
                <tr
                  key={id}
                  className={`transition-colors ${
                    isPaid ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-6 rounded-md font-bold text-xs ${
                        isPaid
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {id}
                    </span>
                  </td>

                  <td className="py-2 px-4 font-medium text-slate-800">
                    {row
                      ? formatReadableDate(getLocalISOWithoutSeconds(row.date))
                      : <span className="text-slate-300">—</span>}
                  </td>

                  <td className="py-2 px-4 text-right font-bold text-slate-900">
                    {row ? `${row.amount.toLocaleString()} $ht` : <span className="text-slate-300 font-normal">—</span>}
                  </td>

                  <td className="py-2 px-4 text-center font-medium">
                    {row ? `${row.days} j` : <span className="text-slate-300">—</span>}
                  </td>

                  <td className="py-2 px-4 text-center">
                    {row ? (
                      row.action === "dep" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <ArrowDownCircle className="w-3 h-3 text-emerald-600" /> Dépôt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                          <ArrowUpCircle className="w-3 h-3 text-rose-600" /> Retrait
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
