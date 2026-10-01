"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Trash2,
  Search,
  RefreshCw,
  Clock,
  PlusCircle,
  MinusCircle,
  XCircle,
  AlertTriangle,
  HandCoins,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  getHistory,
  clearHistory,
  HistoryEntry,
} from "../../function/history";

const TYPE_CONFIG: Record<
  HistoryEntry["type"],
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  creation: {
    label: "Création",
    icon: <PlusCircle className="w-4 h-4" />,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  depot: {
    label: "Dépôt",
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  retrait: {
    label: "Retrait",
    icon: <MinusCircle className="w-4 h-4" />,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  suppression: {
    label: "Suppression",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
  },
  destruction: {
    label: "Destruction",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-rose-800",
    bg: "bg-rose-100 border-rose-300",
  },
  pret: {
    label: "Prêt",
    icon: <HandCoins className="w-4 h-4" />,
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
  },
  pret_paiement: {
    label: "Paiement Prêt",
    icon: <Activity className="w-4 h-4" />,
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
  },
  autre: {
    label: "Autre",
    icon: <Clock className="w-4 h-4" />,
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}

export default function HistoriquePage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<HistoryEntry["type"] | "tous">(
    "tous"
  );
  const [confirmClear, setConfirmClear] = useState(false);

  const reload = useCallback(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  const filtered = history.filter((entry) => {
    const matchSearch =
      entry.description.toLowerCase().includes(search.toLowerCase()) ||
      (entry.details || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "tous" || entry.type === filterType;
    return matchSearch && matchType;
  });

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  const counts = Object.keys(TYPE_CONFIG).reduce(
    (acc, type) => {
      acc[type as HistoryEntry["type"]] = history.filter(
        (h) => h.type === type
      ).length;
      return acc;
    },
    {} as Record<HistoryEntry["type"], number>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <History className="w-5 h-5" />
            </div>
            Historique des Actions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité des opérations financières et modifications
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={reload}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-2 h-10 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>

          {!confirmClear ? (
            <Button
              variant="outline"
              onClick={() => setConfirmClear(true)}
              className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl gap-2 h-10 text-xs font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Effacer tout
            </Button>
          ) : (
            <div className="flex gap-2 items-center bg-rose-50 border border-rose-200 rounded-xl px-3 py-1">
              <span className="text-xs font-semibold text-rose-700">Confirmer ?</span>
              <button
                onClick={handleClear}
                className="text-xs text-rose-700 hover:underline font-bold"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs text-slate-500 hover:underline"
              >
                Non
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("tous")}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            filterType === "tous"
              ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Tout ({history.length})
        </button>

        {(
          Object.entries(TYPE_CONFIG) as [
            HistoryEntry["type"],
            (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG]
          ][]
        ).map(
          ([type, cfg]) =>
            counts[type] > 0 && (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === type
                    ? `${cfg.bg} ${cfg.color} border-current shadow-2xs`
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cfg.icon}
                {cfg.label} ({counts[type]})
              </button>
            )
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 rounded-xl h-11 text-sm shadow-2xs"
          placeholder="Rechercher une opération..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* History list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <History className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-800 font-bold text-base">
            {history.length === 0
              ? "Aucune action enregistrée"
              : "Aucun résultat trouvé"}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Les opérations effectuées apparaîtront ici automatiquement
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-8">
          {filtered.map((entry, idx) => {
            const cfg = TYPE_CONFIG[entry.type];
            return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:border-violet-200 shadow-2xs transition-all"
              >
                <div className="flex-shrink-0 w-6 text-center pt-1">
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {filtered.length - idx}
                  </span>
                </div>

                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <p className="text-sm text-slate-900 font-bold truncate">
                      {entry.description}
                    </p>
                  </div>
                  {entry.details && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                      {entry.details}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {timeAgo(entry.timestamp)}
                  </p>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap mt-0.5 hidden sm:block">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
