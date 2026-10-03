"use client";

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
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  DeleteIcon,
  Key,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  RotateCcw,
  Eye,
  EyeOff,
  HandCoins,
  ArrowRight,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  formatReadableDate,
  getLocalISOWithoutSeconds,
  getNumericProgress,
  useProgress,
} from "../function/function";
import { addHistoryEntry } from "../function/history";

interface Documents {
  Nom: string;
  Prenom: string;
  EndDate: string;
  StartDate: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Plan: string;
  PlanType?: "jour" | "semaine" | "mois";
  ContributionAmount?: string;
  Detruit: string;
  Phone?: string;
  NIF?: string;
}

type DocumentsWithId = Documents & { id: string };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [doc1, setDoc] = useState<DocumentsWithId[]>([]);
  const password = useRef("");
  const [searchQuery, setSearchQuery] = useState("");
  const [passDelete, setPassDelete] = useState("");
  const [passDeleteOk, setPassDeleteOk] = useState(false);

  // date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exactDate, setExactDate] = useState("");
  const [filterDailyMoney, setFilterDailyMoney] = useState("");
  const [filterPlanDays, setFilterPlanDays] = useState("");

  const [show, setshow] = useState(false);
  const [percent, setPercent] = useState("1");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setPassDeleteOk(passDelete === password.current);
  }, [passDelete, password.current]);

  const [selectedDoc, setSelectedDoc] = useState<DocumentsWithId | null>(null);
  const [openConfirmPopup, setOpenConfirmPopup] = useState(false);
  const [openChangePassWord, setOpenChangePassWord] = useState(false);
  const [openConfirmPopupDestroy, setOpenConfirmPopupDestroy] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordshow, setPasswordshow] = useState("");

  const router = useRouter();

  const handleChangePassword = async () => {
    setError("");
    setLoading(true);
    if (user?.email) {
      try {
        const userRef = doc(db, "user", user?.email);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setError("Utilisateur non trouvé");
          return;
        }

        const userData = snap.data();

        if (userData.password !== oldPassword) {
          setError("Ancien mot de passe incorrect");
          return;
        }

        await updateDoc(userRef, {
          password: newPassword,
          updatedAt: new Date(),
        });

        setOpenChangePassWord(false);
        setOldPassword("");
        setNewPassword("");
        alert("Mot de passe mis à jour avec succès");
        window.location.reload();
      } catch (err) {
        console.error(err);
        setError("Échec de la mise à jour");
      } finally {
        setLoading(false);
      }
    }
  };

  const destroyedCount = doc1.filter((d) => d.Detruit === "oui").length;

  const filteredData = doc1.filter((data) => {
    const docDate = data.StartDate ? data.StartDate.split(" ")[0] : "";
    const nameMatch =
      data.Nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      data.Prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.NIF && data.NIF.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (data.Phone && data.Phone.includes(searchQuery));
    let exactMatch = true;
    let rangeMatch = true;
    if (exactDate) exactMatch = docDate === exactDate;
    if (startDate) rangeMatch = docDate >= startDate;
    if (endDate) rangeMatch = rangeMatch && docDate <= endDate;
    const cardMatch =
      filterDailyMoney === "" ||
      Number(data.DailyMoney) === Number(filterDailyMoney);
    const planMatch =
      filterPlanDays === "" || Number(data.Plan) === Number(filterPlanDays);
    return nameMatch && exactMatch && rangeMatch && cardMatch && planMatch;
  });

  filteredData.sort((a, b) => {
    const dateA = new Date(a.StartDate);
    const dateB = new Date(b.StartDate);
    return dateB.getTime() - dateA.getTime();
  });

  const totalBalanceSum = filteredData.reduce(
    (acc, item) => acc + Number(item.Balance || 0),
    0
  );
  const totalExpectedSum = filteredData.reduce(
    (acc, item) => acc + Number(item.TotalBalance || 0),
    0
  );
  const tri = doc1.filter((d) => d.Detruit === "oui");
  const totaldetruit = tri.reduce(
    (acc, item) => acc + Number(item.TotalBalance || 0),
    0
  );

  const deleteDocument = async (collectionName: string, docId: string) => {
    const docToDelete = doc1.find((d) => d.id === docId);
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      setDoc((prev) => prev.filter((doc) => doc.id !== docId));
      if (docToDelete) {
        addHistoryEntry({
          type: "suppression",
          description: `Client supprimé: ${docToDelete.Nom} ${docToDelete.Prenom}`,
          details: `Balance: ${docToDelete.Balance}$ht`,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  const getCustomerdata = async () => {
    const querySnapshot = await getDocs(collection(db, "doc"));
    const docs: DocumentsWithId[] = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as DocumentsWithId[];

    setDoc(docs);

    const userRef = doc(db, "user", "test4321@gmail.com");
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const userData = snap.data();
      password.current = userData?.password;
      setPasswordshow(userData?.password);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        getCustomerdata();
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  async function termitatePlan(id: string, name: string) {
    if (!doc1) return;
    setPassDeleteOk(false);
    setPassDelete("");
    try {
      const ref = doc(db, "doc", id);
      await updateDoc(ref, { Detruit: "oui" });
      addHistoryEntry({
        type: "destruction",
        description: `Carnet détruit: ${name}`,
        details: "Plan terminé manuellement",
      });
      alert(`Vous avez détruit le carnet de: ${name} !`);
      window.location.reload();
    } catch (err) {
      console.error("Erreur destruction carnet:", err);
    }
  }

  const resetFilters = () => {
    setExactDate("");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setFilterPlanDays("");
    setFilterDailyMoney("");
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Clients affichés</p>
            <p className="text-xl font-bold text-slate-900">{filteredData.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Collecté</p>
            <p className="text-xl font-bold text-slate-900">
              {totalBalanceSum.toLocaleString()} $ht
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Attendu</p>
            <p className="text-xl font-bold text-slate-900">
              {totalExpectedSum.toLocaleString()} $ht
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <DeleteIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Carnets Détruits</p>
            <p className="text-xl font-bold text-slate-900">{destroyedCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 rounded-xl h-11 shadow-2xs text-sm"
            placeholder="Rechercher par nom, téléphone, NIF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl gap-2 h-11 border-slate-200 font-medium text-xs ${
              showFilters
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
          </Button>

          <Button
            variant="outline"
            onClick={() => setshow(!show)}
            className={`rounded-xl gap-2 h-11 border-slate-200 font-medium text-xs ${
              show
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Calculs
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenChangePassWord(true)}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-2 h-11 font-medium text-xs"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-2 lg:grid-cols-5 gap-4 shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Début</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl text-xs h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl text-xs h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Date exacte</label>
            <Input
              type="date"
              value={exactDate}
              onChange={(e) => setExactDate(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl text-xs h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Carte ($)</label>
            <Input
              type="number"
              placeholder="Ex: 100"
              value={filterDailyMoney}
              onChange={(e) => setFilterDailyMoney(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl text-xs h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Jours</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Ex: 100"
                value={filterPlanDays}
                onChange={(e) => setFilterPlanDays(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-800 rounded-xl text-xs h-9"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={resetFilters}
                className="bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 h-9 w-9 rounded-xl flex-shrink-0"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculs Panel */}
      {show && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">
            Résumé & Prévisions Financières
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Collecté</p>
              <p className="text-2xl font-black text-emerald-600">
                {totalBalanceSum.toLocaleString()}$ht
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                sur {totalExpectedSum.toLocaleString()}$ht attendu
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Pourcentage de calcul</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="w-20 bg-slate-50 border-slate-200 text-slate-900 text-center h-8 text-sm font-bold rounded-lg"
                />
                <span className="text-slate-600 font-bold text-sm">%</span>
              </div>
              <p className="text-xs text-violet-700 font-semibold mt-1">
                = {((Number(percent) * totalExpectedSum) / 100).toFixed(2)}$ht
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Carnets Détruits</p>
              <p className="text-2xl font-black text-rose-600">{destroyedCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                ({((totaldetruit * Number(percent)) / 100).toFixed(2)}$ht)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total de carnets</p>
              <p className="text-2xl font-black text-blue-600">{filteredData.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">sur {doc1.length} enregistrés</p>
            </div>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
        {filteredData.map((data) => {
          const timeProgress = useProgress(data.StartDate, data.EndDate);
          const moneyProgress = getNumericProgress(data.Balance, data.TotalBalance);
          const isDestroyed = data.Detruit === "oui";
          const isComplete = timeProgress >= 99 || moneyProgress >= 99;

          return (
            <div
              key={data.id}
              className={`
                relative rounded-2xl border p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between
                ${
                  isDestroyed
                    ? "bg-rose-50/40 border-rose-200"
                    : isComplete
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-white border-slate-200 hover:border-violet-300 shadow-xs"
                }
              `}
            >
              {/* Status badge */}
              {isDestroyed && (
                <span className="absolute top-4 right-4 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Détruit
                </span>
              )}
              {isComplete && !isDestroyed && (
                <span className="absolute top-4 right-4 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Complété
                </span>
              )}

              {/* Main Info */}
              <div>
                <div
                  className="cursor-pointer mb-3"
                  onClick={() => router.push(`/open-doc/${data.id}`)}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        data.PlanType === "semaine"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : data.PlanType === "mois"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}
                    >
                      {data.PlanType === "semaine"
                        ? "Plan Hebdo"
                        : data.PlanType === "mois"
                        ? "Plan Mensuel"
                        : "Plan Quotidien"}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 text-base hover:text-violet-600 transition-colors">
                    {data.Nom} {data.Prenom}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    {data.Phone && <span>Tel: {data.Phone}</span>}
                    {data.NIF && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                        NIF: {data.NIF}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div
                  className="cursor-pointer space-y-3"
                  onClick={() => router.push(`/open-doc/${data.id}`)}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatReadableDate(getLocalISOWithoutSeconds(data.StartDate))}
                    </span>
                    <span>→ {formatReadableDate(getLocalISOWithoutSeconds(data.EndDate))}</span>
                  </div>

                  {/* Time progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Temps écoulé</span>
                      <span className="text-violet-600 font-bold">{timeProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all"
                        style={{ width: `${timeProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Money progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span className="font-medium text-slate-700">
                        {data.Balance}$ht / {data.TotalBalance}$ht
                      </span>
                      <span className="text-emerald-600 font-bold">{moneyProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${moneyProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Plan metrics */}
                  <div className="flex items-center justify-between text-xs pt-1.5 text-slate-600 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cotisation</span>
                      <strong className="text-slate-900 font-bold">
                        {data.PlanType === "semaine"
                          ? `${data.ContributionAmount || (Number(data.DailyMoney) * 7).toString()}$ht / sem`
                          : data.PlanType === "mois"
                          ? `${data.ContributionAmount || (Number(data.DailyMoney) * 30).toString()}$ht / mois`
                          : `${data.DailyMoney}$ht / jour`}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Durée Plan</span>
                      <strong className="text-slate-900 font-bold">
                        {data.PlanType === "semaine"
                          ? `${Math.round(Number(data.Plan) / 7)} sem. (${data.Plan}j)`
                          : data.PlanType === "mois"
                          ? `${Math.round(Number(data.Plan) / 30)} mois (${data.Plan}j)`
                          : `${data.Plan} jours`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                {/* 1-Click Proposer Prêt Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `/dashboard/prets?clientId=${data.id}&nom=${encodeURIComponent(
                      data.Nom
                    )}&prenom=${encodeURIComponent(
                      data.Prenom
                    )}&phone=${encodeURIComponent(
                      data.Phone || ""
                    )}&nif=${encodeURIComponent(data.NIF || "")}`;
                    router.push(url);
                  }}
                  className="flex-1 h-8 text-xs font-semibold rounded-lg bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-600 hover:text-white transition-colors"
                  title="Accorder un prêt à ce client"
                >
                  <HandCoins className="w-3.5 h-3.5 mr-1" />
                  Prêt
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-lg text-slate-600 hover:bg-slate-100 border-slate-200"
                  onClick={() => router.push(`/open-doc/${data.id}`)}
                >
                  Carnet
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-lg bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  onClick={() => {
                    setSelectedDoc(data);
                    setOpenConfirmPopupDestroy(true);
                  }}
                  title="Détruire ou clôturer ce carnet"
                >
                  Vider
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  onClick={() => {
                    setSelectedDoc(data);
                    setOpenConfirmPopup(true);
                  }}
                  title="Supprimer ce client"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit info */}
      <p className="text-center text-xs text-slate-400">
        développé par ING Orcel Euler · No 47656226
      </p>

      {/* Dialog: Change Password */}
      <Dialog open={openChangePassWord} onOpenChange={setOpenChangePassWord}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-lg">
              Changer le mot de passe{" "}
              <span className="text-slate-400 font-mono text-xs">
                ({passwordshow?.slice(0, 3) || ""}****)
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Ancien mot de passe
              </label>
              <Input
                type="password"
                placeholder="Ancien mot de passe"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenChangePassWord(false)}
              className="border-slate-200 text-slate-600"
            >
              Annuler
            </Button>
            <Button
              disabled={loading || !oldPassword || !newPassword}
              onClick={handleChangePassword}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              {loading ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Client */}
      <Dialog open={openConfirmPopup} onOpenChange={setOpenConfirmPopup}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-lg">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Supprimer définitivement le client{" "}
              <strong className="text-slate-900">
                {selectedDoc?.Nom} {selectedDoc?.Prenom}
              </strong>{" "}
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Entrez votre mot de passe pour autoriser :
            </label>
            <Input
              type="password"
              placeholder="Mot de passe gestionnaire"
              value={passDelete}
              onChange={(e) => setPassDelete(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900"
              autoFocus
            />
            {passDelete && (
              <p
                className={`text-xs font-semibold ${
                  passDeleteOk ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {passDeleteOk ? "✓ Suppression autorisée" : "⚠ Mot de passe requis"}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
              className="border-slate-200 text-slate-600"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!passDeleteOk}
              onClick={() => {
                if (selectedDoc) deleteDocument("doc", selectedDoc.id);
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Destroy Plan */}
      <Dialog open={openConfirmPopupDestroy} onOpenChange={setOpenConfirmPopupDestroy}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-lg">
              Confirmer la Destruction du carnet
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Clôturer et détruire le carnet de{" "}
              <strong className="text-slate-900">
                {selectedDoc?.Nom} {selectedDoc?.Prenom}
              </strong>{" "}
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Entrez votre mot de passe pour autoriser :
            </label>
            <Input
              type="password"
              placeholder="Mot de passe gestionnaire"
              value={passDelete}
              onChange={(e) => setPassDelete(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900"
              autoFocus
            />
            {passDelete && (
              <p
                className={`text-xs font-semibold ${
                  passDeleteOk ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {passDeleteOk ? "✓ Destruction autorisée" : "⚠ Mot de passe requis"}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmPopupDestroy(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
              className="border-slate-200 text-slate-600"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!passDeleteOk}
              onClick={() => {
                if (selectedDoc)
                  termitatePlan(
                    selectedDoc.id,
                    `${selectedDoc.Nom} ${selectedDoc.Prenom}`
                  );
                setOpenConfirmPopupDestroy(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Détruire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
