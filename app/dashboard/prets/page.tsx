"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  HandCoins,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  UserCheck,
  Check,
  Sparkles,
  ArrowRight,
  CreditCard,
  Phone,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { addHistoryEntry } from "../../function/history";

export interface Pret {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  nif?: string;
  montant: number;
  tauxInteret: number; // % annuel ou mensuel selon le type
  typeTaux: "mensuel" | "annuel";
  dateDebut: string;
  dureesMois: number;
  statut: "actif" | "rembourse" | "retard";
  montantRembourse: number;
  notes: string;
  createdAt?: Timestamp;
}

export interface PlanClient {
  id: string;
  Nom: string;
  Prenom: string;
  Phone: string;
  NIF: string;
  Plan: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Detruit: string;
}

type PretFormData = Omit<Pret, "id" | "createdAt">;

const STORAGE_KEY_TAUX = "mario_cash_taux_interet";

const defaultForm: PretFormData = {
  nom: "",
  prenom: "",
  phone: "",
  nif: "",
  montant: 0,
  tauxInteret: 5,
  typeTaux: "mensuel",
  dateDebut: new Date().toISOString().split("T")[0],
  dureesMois: 12,
  statut: "actif",
  montantRembourse: 0,
  notes: "",
};

function PretsContent() {
  const searchParams = useSearchParams();
  const [prets, setPrets] = useState<Pret[]>([]);
  const [planClients, setPlanClients] = useState<PlanClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openPaiement, setOpenPaiement] = useState(false);
  const [selectedPret, setSelectedPret] = useState<Pret | null>(null);
  const [form, setForm] = useState<PretFormData>(defaultForm);
  const [paiementMontant, setPaiementMontant] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [globalTaux, setGlobalTaux] = useState("5");
  const [tauxSavedNotice, setTauxSavedNotice] = useState(false);

  // Client search and selection
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(true);

  // Computed stats
  const totalPrete = prets.reduce((s, p) => s + p.montant, 0);
  const totalRembourse = prets.reduce((s, p) => s + p.montantRembourse, 0);
  const totalInterets = prets.reduce((s, p) => s + calcInterets(p), 0);
  const actifs = prets.filter((p) => p.statut === "actif").length;

  function calcInterets(pret: Pret): number {
    const taux =
      pret.typeTaux === "annuel" ? pret.tauxInteret / 12 : pret.tauxInteret;
    return (pret.montant * taux * pret.dureesMois) / 100;
  }

  function calcTotalDu(pret: Pret): number {
    return pret.montant + calcInterets(pret);
  }

  function calcMensualite(pret: Pret): number {
    if (pret.dureesMois <= 0) return 0;
    return calcTotalDu(pret) / pret.dureesMois;
  }

  function getStatutBadge(statut: string) {
    if (statut === "actif") {
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Clock className="w-3 h-3 text-blue-600" />,
        label: "Actif",
      };
    }
    if (statut === "rembourse") {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
        label: "Remboursé",
      };
    }
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
      label: "En retard",
    };
  }

  // 1. Load interest rate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAUX);
      if (saved) {
        setGlobalTaux(saved);
        setForm((prev) => ({
          ...prev,
          tauxInteret: Number(saved) || 5,
        }));
      }
    } catch (e) {
      console.error("Erreur lecture localStorage:", e);
    }
  }, []);

  // Update interest rate and save to localStorage
  const handleUpdateGlobalTaux = (val: string) => {
    setGlobalTaux(val);
    try {
      localStorage.setItem(STORAGE_KEY_TAUX, val);
      setTauxSavedNotice(true);
      setTimeout(() => setTauxSavedNotice(false), 2000);
    } catch (e) {
      console.error("Erreur écriture localStorage:", e);
    }
  };

  // 2. Fetch Loans
  async function fetchPrets() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "prets"));
      const data: Pret[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Pret, "id">),
      }));
      data.sort((a, b) =>
        new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
      );
      setPrets(data);
    } catch (e) {
      console.error("Erreur fetch prets:", e);
    } finally {
      setLoading(false);
    }
  }

  // 3. Fetch Plan Clients from "doc"
  async function fetchPlanClients() {
    setLoadingClients(true);
    try {
      const snap = await getDocs(collection(db, "doc"));
      const clientsData: PlanClient[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setPlanClients(clientsData);
    } catch (e) {
      console.error("Erreur fetch plan clients:", e);
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    fetchPrets();
    fetchPlanClients();
  }, []);

  // Check URL query parameters (e.g. redirected from dashboard / open-doc)
  useEffect(() => {
    const nom = searchParams.get("nom");
    const prenom = searchParams.get("prenom");
    const phone = searchParams.get("phone");
    const nif = searchParams.get("nif");
    const montant = searchParams.get("montant");

    if (nom || prenom) {
      setForm((prev) => ({
        ...prev,
        nom: nom || "",
        prenom: prenom || "",
        phone: phone || "",
        nif: nif || "",
        montant: montant ? Number(montant) : prev.montant,
        tauxInteret: Number(globalTaux) || 5,
      }));
      setOpenForm(true);
    }
  }, [searchParams, globalTaux]);

  // Handle client selection to autofill
  function handleSelectClient(client: PlanClient) {
    setSelectedClientId(client.id);
    setForm((prev) => ({
      ...prev,
      nom: client.Nom || "",
      prenom: client.Prenom || "",
      phone: client.Phone || "",
      nif: client.NIF || "",
      tauxInteret: Number(globalTaux) || 5,
    }));
  }

  function handleResetClientSelection() {
    setSelectedClientId("");
    setForm((prev) => ({
      ...prev,
      nom: "",
      prenom: "",
      phone: "",
      nif: "",
    }));
  }

  function openCreateLoanForClient(client: PlanClient) {
    handleSelectClient(client);
    setOpenForm(true);
  }

  // Filtered clients for quick suggestions
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return planClients;
    const q = clientSearchQuery.toLowerCase();
    return planClients.filter(
      (c) =>
        c.Nom?.toLowerCase().includes(q) ||
        c.Prenom?.toLowerCase().includes(q) ||
        c.Phone?.toLowerCase().includes(q) ||
        c.NIF?.toLowerCase().includes(q)
    );
  }, [planClients, clientSearchQuery]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        nif: form.nif || "",
        montant: Number(form.montant),
        tauxInteret: Number(form.tauxInteret),
        dureesMois: Number(form.dureesMois),
        montantRembourse: Number(form.montantRembourse),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "prets"), payload);
      const newPret: Pret = { ...payload, id: ref.id } as Pret;
      setPrets((prev) => [newPret, ...prev]);
      addHistoryEntry({
        type: "pret",
        description: `Prêt créé: ${form.nom} ${form.prenom}`,
        details: `Montant: ${form.montant}$ · Taux: ${form.tauxInteret}% ${form.typeTaux} · NIF: ${form.nif || "N/A"} · Durée: ${form.dureesMois} mois`,
      });
      setOpenForm(false);
      setForm({ ...defaultForm, tauxInteret: Number(globalTaux) || 5 });
      setSelectedClientId("");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création du prêt");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedPret) return;
    try {
      await deleteDoc(doc(db, "prets", selectedPret.id));
      setPrets((prev) => prev.filter((p) => p.id !== selectedPret.id));
      addHistoryEntry({
        type: "suppression",
        description: `Prêt supprimé: ${selectedPret.nom} ${selectedPret.prenom}`,
        details: `Montant: ${selectedPret.montant}$`,
      });
    } finally {
      setOpenDelete(false);
      setSelectedPret(null);
    }
  }

  async function handlePaiement() {
    if (!selectedPret || !paiementMontant) return;
    const montantPaye = Number(paiementMontant);
    const newRembourse = selectedPret.montantRembourse + montantPaye;
    const totalDu = calcTotalDu(selectedPret);
    const newStatut: Pret["statut"] =
      newRembourse >= totalDu ? "rembourse" : "actif";
    try {
      await updateDoc(doc(db, "prets", selectedPret.id), {
        montantRembourse: newRembourse,
        statut: newStatut,
      });
      setPrets((prev) =>
        prev.map((p) =>
          p.id === selectedPret.id
            ? { ...p, montantRembourse: newRembourse, statut: newStatut }
            : p
        )
      );
      addHistoryEntry({
        type: "pret_paiement",
        description: `Paiement prêt: ${selectedPret.nom} ${selectedPret.prenom}`,
        details: `Payé: ${montantPaye}$ · Total remboursé: ${newRembourse}$ / ${totalDu.toFixed(2)}$`,
      });
    } finally {
      setOpenPaiement(false);
      setPaiementMontant("");
      setSelectedPret(null);
    }
  }

  async function handleChangeStatut(pret: Pret, statut: Pret["statut"]) {
    await updateDoc(doc(db, "prets", pret.id), { statut });
    setPrets((prev) =>
      prev.map((p) => (p.id === pret.id ? { ...p, statut } : p))
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-xs">
              <HandCoins className="w-5 h-5" />
            </div>
            Gestion des Prêts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Proposez et suivez tous les prêts accordés aux clients du plan
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Taux global sauvegardé dans localStorage */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Percent className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-slate-600">Taux par défaut:</span>
            <Input
              type="number"
              step="0.5"
              value={globalTaux}
              onChange={(e) => handleUpdateGlobalTaux(e.target.value)}
              className="w-16 h-8 text-sm font-bold bg-white border-slate-300 text-slate-900 px-2 py-0 focus-visible:ring-violet-500 rounded-lg text-center"
              placeholder="5"
            />
            <span className="text-xs text-slate-500 font-semibold">%</span>
            {tauxSavedNotice && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3" /> Sauvegardé
              </span>
            )}
          </div>

          <Button
            onClick={() => {
              setForm({
                ...defaultForm,
                tauxInteret: Number(globalTaux) || 5,
              });
              setSelectedClientId("");
              setOpenForm(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 shadow-md shadow-violet-500/20 font-semibold h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            Nouveau Prêt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Prêts Actifs</p>
            <p className="text-xl font-bold text-slate-900">{actifs}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Prêté</p>
            <p className="text-xl font-bold text-slate-900">
              {totalPrete.toLocaleString()}$
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Remboursé</p>
            <p className="text-xl font-bold text-slate-900">
              {totalRembourse.toLocaleString()}$
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Intérêts Prévisionnels</p>
            <p className="text-xl font-bold text-slate-900">
              {totalInterets.toFixed(0)}$
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Propose loans from Plan Clients */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Proposer un prêt aux clients du plan
              </h2>
              <p className="text-xs text-slate-500">
                Sélectionnez un client du tableau de bord pour pré-remplir automatiquement son nom, téléphone et NIF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un client du plan..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClientSuggestions(!showClientSuggestions)}
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              {showClientSuggestions ? "Masquer" : "Afficher"}
            </Button>
          </div>
        </div>

        {showClientSuggestions && (
          <div>
            {loadingClients ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chargement des clients du tableau de bord...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Aucun client trouvé dans le tableau de bord.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredClients.map((client) => {
                  const hasLoan = prets.some(
                    (p) =>
                      p.nom.toLowerCase() === client.Nom?.toLowerCase() &&
                      p.prenom.toLowerCase() === client.Prenom?.toLowerCase()
                  );

                  return (
                    <div
                      key={client.id}
                      className="bg-slate-50 hover:bg-violet-50/50 border border-slate-200/80 hover:border-violet-300 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 text-sm group-hover:text-violet-900">
                            {client.Nom} {client.Prenom}
                          </p>
                          {hasLoan && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                              Prêt actif
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                          <span className="truncate">
                            <span className="text-slate-400">Tel:</span>{" "}
                            {client.Phone || "—"}
                          </span>
                          <span className="truncate">
                            <span className="text-slate-400">NIF:</span>{" "}
                            {client.NIF || "—"}
                          </span>
                          <span>
                            <span className="text-slate-400">Plan:</span>{" "}
                            {client.Plan} jours
                          </span>
                          <span>
                            <span className="text-slate-400">Carte:</span>{" "}
                            {client.DailyMoney}$ht
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => openCreateLoanForClient(client)}
                        className="w-full h-8 text-xs font-semibold bg-white hover:bg-violet-600 text-violet-700 hover:text-white border border-violet-200 hover:border-violet-600 transition-all rounded-lg gap-1.5 shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Accorder un prêt
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prets list header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Liste des Prêts en cours</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {prets.length}
          </span>
        </h2>
      </div>

      {/* Prets list */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mb-3">
            <HandCoins className="w-7 h-7" />
          </div>
          <p className="text-slate-800 font-bold text-base">Aucun prêt enregistré</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            Accordez un prêt à un client du plan ci-dessus ou cliquez sur Nouveau Prêt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
          {prets.map((pret) => {
            const totalDu = calcTotalDu(pret);
            const interets = calcInterets(pret);
            const mensualite = calcMensualite(pret);
            const progressPct =
              totalDu > 0
                ? Math.min(100, Math.round((pret.montantRembourse / totalDu) * 100))
                : 0;
            const badge = getStatutBadge(pret.statut);

            return (
              <div
                key={pret.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-violet-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-slate-900 text-base">
                        {pret.nom} {pret.prenom}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        {pret.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {pret.phone}
                          </span>
                        )}
                        {pret.nif && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200">
                            NIF: {pret.nif}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 my-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Montant Prêté</span>
                      <span className="text-base font-bold text-slate-900">
                        {pret.montant.toLocaleString()} $
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Dû</span>
                      <span className="text-base font-bold text-violet-700">
                        {totalDu.toFixed(2)} $
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Taux & Durée</span>
                      <span className="font-semibold text-slate-800">
                        {pret.tauxInteret}% {pret.typeTaux} · {pret.dureesMois} mois
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mensualité</span>
                      <span className="font-semibold text-emerald-700">
                        {mensualite.toFixed(2)} $/mois
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Remboursement</span>
                      <span className="font-bold text-slate-800">
                        {pret.montantRembourse.toFixed(0)} $ / {totalDu.toFixed(0)} $ ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressPct >= 100
                            ? "bg-emerald-500"
                            : progressPct > 50
                            ? "bg-violet-600"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {pret.notes && (
                    <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100 mb-3">
                      Note: {pret.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPret(pret);
                      setPaiementMontant("");
                      setOpenPaiement(true);
                    }}
                    className="flex-1 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                    Paiement
                  </Button>

                  <select
                    value={pret.statut}
                    onChange={(e) =>
                      handleChangeStatut(pret, e.target.value as Pret["statut"])
                    }
                    className="h-8 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 font-medium focus:ring-violet-500 focus:outline-hidden"
                  >
                    <option value="actif">Actif</option>
                    <option value="rembourse">Remboursé</option>
                    <option value="retard">En retard</option>
                  </select>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedPret(pret);
                      setOpenDelete(true);
                    }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Pret Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              Nouveau Prêt
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Remplissez les informations ou choisissez un client du tableau de bord
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Select Client from Plan */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                  Choisir un client du plan (Auto-remplissage)
                </span>
                {selectedClientId && (
                  <button
                    type="button"
                    onClick={handleResetClientSelection}
                    className="text-[11px] text-violet-600 hover:underline font-normal"
                  >
                    Saisie libre / Effacer
                  </button>
                )}
              </label>

              <select
                value={selectedClientId}
                onChange={(e) => {
                  const c = planClients.find((cl) => cl.id === e.target.value);
                  if (c) handleSelectClient(c);
                  else handleResetClientSelection();
                }}
                className="w-full h-9 rounded-lg bg-white border border-slate-200 text-slate-800 px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
              >
                <option value="">-- Sélectionner un client de la liste --</option>
                {planClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.Nom} {c.Prenom} — {c.Phone || "Sans tel"} (NIF: {c.NIF || "—"})
                  </option>
                ))}
              </select>

              {selectedClientId && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Données du client remplies automatiquement !
                </div>
              )}
            </div>

            {/* Nom & Prenom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Nom *
                </label>
                <Input
                  placeholder="Nom de famille"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Prénom
                </label>
                <Input
                  placeholder="Prénom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Phone & NIF */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Téléphone (# tel)
                </label>
                <Input
                  placeholder="Ex: 509-3700-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  NIF / CIN
                </label>
                <Input
                  placeholder="Ex: 000-000-000-0"
                  value={form.nif || ""}
                  onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Montant */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Montant du prêt ($) *
              </label>
              <Input
                type="number"
                placeholder="Ex: 10000"
                value={form.montant || ""}
                onChange={(e) =>
                  setForm({ ...form, montant: Number(e.target.value) })
                }
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                required
              />
            </div>

            {/* Taux d'intérêt configuré & Type */}
            <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-violet-600" />
                  Taux d&apos;Intérêt
                </p>
                <span className="text-[11px] text-slate-500">
                  (Défaut mémorisé: {globalTaux}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                    Taux (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 5"
                    value={form.tauxInteret}
                    onChange={(e) =>
                      setForm({ ...form, tauxInteret: Number(e.target.value) })
                    }
                    className="bg-white border-slate-200 text-slate-900 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                    Périodicité
                  </label>
                  <select
                    value={form.typeTaux}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        typeTaux: e.target.value as "mensuel" | "annuel",
                      })
                    }
                    className="w-full h-10 rounded-xl bg-white border border-slate-200 text-slate-900 px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
                  >
                    <option value="mensuel">Mensuel</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
              </div>

              {/* Simulation Preview */}
              {form.montant > 0 && form.tauxInteret > 0 && form.dureesMois > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-violet-200">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Intérêts</p>
                    <p className="text-xs font-bold text-amber-600">
                      {(
                        (form.montant *
                          (form.typeTaux === "annuel"
                            ? form.tauxInteret / 12
                            : form.tauxInteret) *
                          form.dureesMois) /
                        100
                      ).toFixed(2)}$
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Total dû</p>
                    <p className="text-xs font-bold text-violet-700">
                      {(
                        form.montant +
                        (form.montant *
                          (form.typeTaux === "annuel"
                            ? form.tauxInteret / 12
                            : form.tauxInteret) *
                          form.dureesMois) /
                          100
                      ).toFixed(2)}$
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Mensualité</p>
                    <p className="text-xs font-bold text-emerald-700">
                      {(
                        (form.montant +
                          (form.montant *
                            (form.typeTaux === "annuel"
                              ? form.tauxInteret / 12
                              : form.tauxInteret) *
                            form.dureesMois) /
                            100) /
                        form.dureesMois
                      ).toFixed(2)}$
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Duree & Date debut */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Durée (mois) *
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  value={form.dureesMois}
                  onChange={(e) =>
                    setForm({ ...form, dureesMois: Number(e.target.value) })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) =>
                    setForm({ ...form, dateDebut: e.target.value })
                  }
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Notes / Remarques
              </label>
              <Input
                placeholder="Garantie, observations particulières..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setOpenForm(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button
              disabled={submitting || !form.nom || form.montant <= 0}
              onClick={handleSubmit}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md shadow-violet-500/20"
            >
              {submitting ? "Création en cours..." : "Créer le Prêt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paiement Dialog */}
      <Dialog open={openPaiement} onOpenChange={setOpenPaiement}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-lg font-bold">
              Enregistrer un paiement
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Client:{" "}
              <strong className="text-slate-800">
                {selectedPret?.nom} {selectedPret?.prenom}
              </strong>{" "}
              · Restant à payer:{" "}
              <span className="text-violet-700 font-bold">
                {selectedPret
                  ? (
                      calcTotalDu(selectedPret) - selectedPret.montantRembourse
                    ).toFixed(2)
                  : 0}
                $
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Montant payé ($) *
            </label>
            <Input
              type="number"
              placeholder="Ex: 500"
              value={paiementMontant}
              onChange={(e) => setPaiementMontant(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 text-base font-bold"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenPaiement(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button
              disabled={!paiementMontant || Number(paiementMontant) <= 0}
              onClick={handlePaiement}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-lg font-bold">
              Supprimer le prêt
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Êtes-vous sûr de vouloir supprimer définitivement le prêt de{" "}
              <strong className="text-slate-900">
                {selectedPret?.nom} {selectedPret?.prenom}
              </strong>{" "}
              d&apos;un montant de {selectedPret?.montant}$ ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenDelete(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PretsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PretsContent />
    </Suspense>
  );
}
