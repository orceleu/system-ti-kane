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
import { onAuthStateChanged, signOut, User } from "firebase/auth";
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
  LogOut,
  PlusIcon,
  SidebarCloseIcon,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase/config";
import Image from "next/image";
import logo from "@/public/cash.png";
import { Progress } from "@/components/ui/progress";
import {
  addAllDocs,
  formatReadableDate,
  getLocalISOWithoutSeconds,
  getNumericProgress,
  useProgress,
} from "../function/function";

interface Documents {
  Nom: string;
  Prenom: string;
  EndDate: string;
  StartDate: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Plan: string;
  Detruit: string; // "oui" ou "non"
}
interface FormData {
  id: string;
  Nom: string;
  Prenom: string;
  StartDate: string;
  EndDate: string;
  NIF: string;
  Phone: string;
  Plan: string;
  DailyMoney: string;
  Balance: string;
  TotalBalance: string;
  Historic: string;
  Detruit: string;
}

type DocumentsWithId = Documents & { id: string };
//export const PASS_DELETE = "mario4321=";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [doc1, setDoc] = useState<DocumentsWithId[]>([]);
  // const [copy, setCopy] = useState<DocumentsWithId[]>([]);
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

  /*const allMorioData = [
    {
      id: "0JmHn6TkCXcmXEkHXgBl",
      StartDate: "2025-12-09T02:00:00.964Z",
      EndDate: "2026-03-18T21:00",
      DailyMoney: "50",
      Plan: 100,
      Nom: "Trofort",
      NIF: "105",
      TotalBalance: "5000",
      Phone: "",
      Balance: "100",
      Historic: "2025-12-09T02:00:12.086Z,100,2,dep;",
      Prenom: "Rolando",
    },
    {
      id: "0UwFQ3GmTWf0S4upG1to",
      Phone: "",
      StartDate: "2025-12-09T17:06:52.277Z",
      EndDate: "2026-03-19T09:06",
      TotalBalance: "20000",
      Detruit: "non",
      DailyMoney: "200",
      Plan: 100,
      Nom: "Tamis",
      Prenom: "Metelus",
      Balance: "1000",
      NIF: "0118",
      Historic:
        "2025-12-09T17:07:41.547Z,600,3,dep;2025-12-10T22:20:00.848Z,200,1,dep;2025-12-11T17:44:58.451Z,200,1,dep;",
    },
    {
      id: "18mfUVRqidcWXqjMszUW",
      TotalBalance: "2000",
      EndDate: "2026-03-18T20:57",
      StartDate: "2025-12-09T01:57:43.993Z",
      Historic:
        "2025-12-09T01:57:56.682Z,180,9,dep;2025-12-10T20:53:09.472Z,100,5,dep;2025-12-10T20:54:16.304Z,100,5,dep;",
      Phone: "",
      Nom: "Denat",
      NIF: "104",
      Balance: "380",
      DailyMoney: "20",
      Prenom: "Bettie",
      Plan: 100,
    },
    {
      id: "1wpO1SaxaPiufNh9LSp9",
      DailyMoney: "50",
      Plan: 100,
      Prenom: "Wilzlin",
      EndDate: "2026-03-18T19:04",
      TotalBalance: "5000",
      StartDate: "2025-12-09T00:04:45.610Z",
      Nom: "Appetihomme",
      Balance: "200",
      Historic: "2025-12-09T00:04:55.223Z,200,4,dep;",
      Phone: "",
      NIF: "093",
    },
    {
      id: "2LRYApYErLWF9oyJ6pdb",
      Plan: 100,
      Phone: "",
      Nom: "Chery",
      NIF: "098",
      DailyMoney: "100",
      EndDate: "2026-03-18T20:18",
      Prenom: "Davidson",
      Balance: "2400",
      TotalBalance: "10000",
      StartDate: "2025-12-09T01:18:03.644Z",
      Historic:
        "2025-12-09T01:18:37.725Z,3000,30,dep;2025-12-09T01:20:22.494Z,600,6,retr;",
    },
    {
      id: "3UriUjF2YNawRdgd3we8",
      TotalBalance: "10000",
      Nom: "Antenor",
      NIF: "107",
      Prenom: "Resiane",
      Phone: "",
      EndDate: "2026-03-18T21:09",
      StartDate: "2025-12-09T02:09:35.584Z",
      DailyMoney: "100",
      Balance: "100",
      Plan: 100,
      Historic: "2025-12-09T02:10:03.951Z,100,1,dep;",
    },
    {
      id: "4c0rMdk6E0QIRfXKJKcE",
      Nom: "Pierre",
      TotalBalance: "50000",
      NIF: "094",
      Prenom: "Steevens",
      Phone: "",
      EndDate: "2026-03-18T19:16",
      DailyMoney: "500",
      StartDate: "2025-12-09T00:16:26.072Z",
      Balance: "3000",
      Plan: 100,
      Historic: "2025-12-09T00:16:55.223Z,3000,6,dep;",
    },
    {
      id: "4mjwrivy4dELLKBwKVTB",
      StartDate: "2025-12-09T01:47:33.885Z",
      Nom: "Blanchard",
      Historic:
        "2025-12-09T01:47:48.037Z,500,5,dep;2025-12-09T15:21:32.538Z,200,2,dep;2025-12-11T20:50:07.511Z,200,2,dep;",
      DailyMoney: "100",
      Balance: "900",
      NIF: "102",
      TotalBalance: "10000",
      EndDate: "2026-03-18T20:47",
      Prenom: "Ellevela",
      Plan: 100,
      Phone: "",
    },
    {
      id: "5W7ilz3iE63inYUreh7p",
      Historic:
        "2025-12-10T16:34:13.577Z,650,13,dep;2025-12-10T16:36:34.577Z,500,10,dep;",
      NIF: "053",
      StartDate: "2025-12-10T16:33:39.548Z",
      Balance: "1150",
      Plan: 100,
      Nom: "Saintil",
      Detruit: "non",
      TotalBalance: "5000",
      DailyMoney: "50",
      Phone: "",
      EndDate: "2026-03-20T08:33",
      Prenom: "Islande",
    },
    {
      id: "7QdgGSEGi5BsCKGBk3fo",
      Plan: 100,
      Nom: "Toussaint",
      Phone: "",
      NIF: "098",
      DailyMoney: "30",
      EndDate: "2026-03-18T19:55",
      Prenom: "Aloude",
      TotalBalance: "3000",
      Balance: "480",
      StartDate: "2025-12-09T00:55:27.565Z",
      Historic: "2025-12-09T01:08:51.765Z,480,16,dep;",
    },
    {
      id: "8DHjgeAgs7CBwWhaA1wj",
      Nom: "Ralf",
      StartDate: "2025-12-09T00:23:12.909Z",
      Historic: "2025-12-09T00:23:56.717Z,400,20,dep;",
      DailyMoney: "20",
      Balance: "400",
      NIF: "095",
      TotalBalance: "2000",
      Prenom: "Steevens",
      EndDate: "2026-03-18T19:23",
      Phone: "",
      Plan: 100,
    },
    {
      id: "8c1UkIfC5Kwc3a4r69rc",
      TotalBalance: "10000",
      Prenom: "Fils joel",
      Plan: 100,
      Balance: "1200",
      EndDate: "2026-03-18T20:44",
      StartDate: "2025-12-09T01:44:17.756Z",
      Nom: "Charles",
      Phone: "",
      Historic:
        "2025-12-09T01:44:46.083Z,1000,10,dep;2025-12-11T01:02:38.355Z,200,2,dep;",
      NIF: "102",
      DailyMoney: "100",
    },
    {
      id: "AwOOPiSEXmCHPeEK3v1S",
      DailyMoney: "20",
      StartDate: "2025-12-09T14:15:32.843Z",
      EndDate: "2026-03-19T06:15",
      Detruit: "non",
      Nom: "lector",
      Balance: "500",
      TotalBalance: "2000",
      NIF: "101",
      Plan: 100,
      Phone: "",
      Historic: "2025-12-09T14:17:30.436Z,500,25,dep;",
      Prenom: "roselor",
    },
    {
      id: "BJ2F9xWfZ8Jm1Qm1nKQX",
      Prenom: "Fedens",
      NIF: ",105",
      StartDate: "2025-12-09T01:59:02.056Z",
      DailyMoney: "50",
      Nom: "Joseph",
      Plan: 100,
      Balance: "300",
      Historic:
        "2025-12-09T01:59:13.483Z,150,3,dep;2025-12-10T14:54:21.242Z,150,3,dep;",
      Phone: "",
      EndDate: "2026-03-18T20:59",
      TotalBalance: "5000",
    },
    {
      id: "BRSaYMMzLFoyxfgZocrc",
      Prenom: "Rivierlino",
      Historic:
        "2025-12-09T22:42:33.656Z,7000,70,dep;2025-12-11T22:09:04.710Z,100,1,dep;",
      Nom: "Douce",
      DailyMoney: "100",
      Balance: "7100",
      Plan: 100,
      NIF: "081",
      Phone: "",
      Detruit: "non",
      StartDate: "2025-12-09T22:42:25.197Z",
      TotalBalance: "10000",
      EndDate: "2026-03-19T17:42",
    },
    {
      id: "Bj4oT0JMPzinVM3q4TjB",
      Prenom: "Jade",
      TotalBalance: "10000",
      Plan: 100,
      DailyMoney: "100",
      Historic:
        "2025-12-09T00:07:52.372Z,1600,16,dep;2025-12-09T21:05:38.522Z,100,1,dep;2025-12-11T16:31:52.603Z,200,2,dep;",
      Phone: "",
      EndDate: "2026-03-18T19:07",
      NIF: "093",
      Balance: "1900",
      Nom: "Judicaelle",
      StartDate: "2025-12-09T00:07:15.755Z",
    },
    {
      id: "CFMmrg3JPT9tTz5eJKZ3",
      StartDate: "2025-12-09T01:54:07.855Z",
      Plan: 100,
      Phone: "",
      EndDate: "2026-03-18T20:54",
      NIF: "104",
      Balance: "400",
      Historic:
        "2025-12-09T01:54:23.859Z,1400,7,dep;2025-12-09T01:56:03.567Z,1000,5,retr;",
      TotalBalance: "20000",
      DailyMoney: "200",
      Nom: "Jean bar",
      Prenom: "Frantz",
    },
    {
      id: "CPVhIe14JpTeS6Z40OPh",
      TotalBalance: "2000",
      Nom: "benjamin",
      EndDate: "2026-03-17T14:17",
      StartDate: "2025-12-07T22:17:15.204Z",
      NIF: "090",
      DailyMoney: "20",
      Plan: 100,
      Prenom: "scheither",
      Phone: "",
      Balance: "280",
      Historic: "2025-12-07T22:19:07.419Z,280,14,dep;",
    },
    {
      id: "CQa8W7ABIajEnjZpOYZ5",
      Balance: "3600",
      DailyMoney: "100",
      Historic: "2025-12-09T02:08:51.479Z,3600,36,dep;",
      Plan: 100,
      Prenom: "Bertrand",
      EndDate: "2026-03-18T21:07",
      Phone: "",
      StartDate: "2025-12-09T02:07:36.296Z",
      Nom: "Souveni",
      NIF: "107",
      TotalBalance: "10000",
    },
    {
      id: "CRk0pCJOgYJr61jeQ609",
      StartDate: "2025-12-09T00:11:40.523Z",
      Historic: "2025-12-09T00:12:03.701Z,350,7,dep;",
      Nom: "Farest",
      TotalBalance: "5000",
      Plan: 100,
      NIF: "093",
      Balance: "350",
      Phone: "",
      Prenom: "Farest",
      EndDate: "2026-03-18T19:11",
      DailyMoney: "50",
    },
    {
      id: "DPLioBNGrHrUYPoBmnk1",
      Plan: 100,
      EndDate: "2026-03-22T10:08",
      Nom: "Lindor",
      NIF: "080",
      DailyMoney: "50",
      StartDate: "2025-12-12T15:08:10.909Z",
      Phone: "",
      Balance: "4200",
      Prenom: "Christela",
      TotalBalance: "5000",
      Historic: "2025-12-12T15:08:50.938Z,4200,84,dep;",
      Detruit: "non",
    },
    {
      id: "Dtu35Z5HC7v6ALUSbvXx",
      TotalBalance: "10000",
      EndDate: "2026-03-21T17:40",
      StartDate: "2025-12-11T22:40:38.639Z",
      Historic: "2025-12-11T22:41:22.940Z,6700,67,dep;",
      Phone: "",
      Nom: "Olivier",
      NIF: "082",
      Balance: "6700",
      DailyMoney: "100",
      Detruit: "non",
      Prenom: "Frantz",
      Plan: 100,
    },
    {
      id: "DxZgY9c8j1rBXkC3UAvE",
      Prenom: "Pironositha",
      Phone: "",
      Nom: "Sitha",
      EndDate: "2026-03-21T11:59",
      NIF: "083",
      TotalBalance: "2000",
      DailyMoney: "20",
      Plan: 100,
      StartDate: "2025-12-11T16:59:46.933Z",
      Historic:
        "2025-12-11T17:00:40.923Z,1200,60,dep;2025-12-11T17:01:51.977Z,200,10,dep;",
      Detruit: "non",
      Balance: "1400",
    },
    {
      id: "EZ2ni6KYagZjh95LFqW7",
      StartDate: "2025-12-09T14:19:31.881Z",
      Balance: "3300",
      Prenom: "gregory",
      EndDate: "2026-03-19T06:19",
      Nom: "jean Michel",
      Historic: "2025-12-09T14:24:30.277Z,3300,33,dep;",
      NIF: "088",
      TotalBalance: "10000",
      Plan: 100,
      Detruit: "non",
      Phone: "",
      DailyMoney: "100",
    },
    {
      id: "Gdu2cemPgE2I6IbcBZbP",
      Prenom: "Gedeon",
      DailyMoney: "100",
      Nom: "Andral",
      StartDate: "2025-12-10T14:11:03.136Z",
      NIF: "076",
      EndDate: "2026-03-20T06:11",
      Phone: "",
      Balance: "9900",
      Historic: "2025-12-10T14:11:52.689Z,9900,99,dep;",
      Plan: 100,
      TotalBalance: "10000",
      Detruit: "non",
    },
    {
      id: "HCtbhNV9VVdGTQ5Sfb3M",
      StartDate: "2025-12-08T23:51:24.494Z",
      TotalBalance: "5000",
      Nom: "Derolin",
      NIF: "091",
      EndDate: "2026-03-18T18:51",
      DailyMoney: "50",
      Balance: "850",
      Prenom: "Julnord",
      Plan: 100,
      Historic:
        "2025-12-08T23:51:58.983Z,750,15,dep;2025-12-11T22:14:17.004Z,100,2,dep;",
      Phone: "",
    },
    {
      id: "HNhyT9TmHzOLIYCwGnFj",
      NIF: "118",
      TotalBalance: "20000",
      Balance: "200",
      DailyMoney: "200",
      Phone: "",
      Historic: "2025-12-10T18:35:31.678Z,200,1,dep;",
      Nom: "Belfort",
      EndDate: "2026-03-20T10:30",
      StartDate: "2025-12-10T18:30:51.486Z",
      Plan: 100,
      Detruit: "non",
      Prenom: "Alex",
    },
    {
      id: "ICeYQvDbth6nkbsov4XJ",
      Prenom: "Julienne",
      DailyMoney: "100",
      EndDate: "2026-03-21T12:10",
      Phone: "",
      Detruit: "non",
      StartDate: "2025-12-11T17:10:17.437Z",
      Historic: "2025-12-11T17:10:23.017Z,1000,10,dep;",
      Nom: "Desius",
      NIF: "086",
      Balance: "1000",
      TotalBalance: "10000",
      Plan: 100,
    },
    {
      id: "IiWdhbCXYFtESgJgFDmr",
      DailyMoney: "30",
      Prenom: "Daphline",
      NIF: "088",
      EndDate: "2026-03-19T11:55",
      Plan: 100,
      StartDate: "2025-12-09T19:55:12.381Z",
      Historic:
        "2025-12-09T19:57:11.488Z,1500,50,dep;2025-12-12T14:15:38.031Z,180,6,dep;",
      TotalBalance: "3000",
      Phone: "",
      Detruit: "non",
      Nom: "Senatus",
      Balance: "1680",
    },
    {
      id: "IqV217ax7vd3X9eMmIwQ",
      Prenom: "Guerby",
      Plan: 100,
      Phone: "",
      Historic: "2025-12-09T00:52:54.107Z,200,2,dep;",
      Nom: "Adeska",
      EndDate: "2026-03-18T19:52",
      Balance: "200",
      TotalBalance: "10000",
      DailyMoney: "100",
      NIF: "097",
      StartDate: "2025-12-09T00:52:29.269Z",
    },
    {
      id: "JPNAR0EsYmEnYjLvFcAN",
      Historic: "2025-12-12T15:07:27.073Z,200,4,dep;",
      EndDate: "2026-03-22T10:07",
      Detruit: "non",
      TotalBalance: "5000",
      Plan: 100,
      StartDate: "2025-12-12T15:07:11.970Z",
      DailyMoney: "50",
      Prenom: "Derline",
      Phone: "",
      NIF: "124",
      Nom: "Denat",
      Balance: "200",
    },
    {
      id: "JjFXwE0Um3NSH8LgIAIl",
      EndDate: "2026-03-18T20:43",
      DailyMoney: "100",
      Phone: "",
      StartDate: "2025-12-09T01:43:29.276Z",
      Historic: "2025-12-09T01:43:49.313Z,200,2,dep;",
      NIF: "101",
      Prenom: "Edwin",
      TotalBalance: "10000",
      Nom: "Bazil",
      Balance: "200",
      Plan: 100,
    },
    {
      id: "JpLUDKena2Q7soL5jNTQ",
      Nom: "Amenus",
      DailyMoney: "50",
      TotalBalance: "5000",
      StartDate: "2025-12-11T17:03:07.632Z",
      Plan: 100,
      Phone: "",
      Prenom: "Gabriel ",
      NIF: "121",
      Detruit: "non",
      Balance: "150",
      Historic: "2025-12-11T17:03:22.004Z,150,3,dep;",
      EndDate: "2026-03-21T12:03",
    },
    {
      id: "K3N5scA0n2vE1yCW5QTs",
      StartDate: "2025-12-09T20:33:59.574Z",
      TotalBalance: "10000",
      Nom: "clement",
      NIF: "089",
      EndDate: "2026-03-19T12:33",
      DailyMoney: "100",
      Balance: "1600",
      Prenom: "miliance",
      Plan: 100,
      Historic: "2025-12-09T20:34:35.645Z,1600,16,dep;",
      Phone: "",
    },
    {
      id: "K8L2vo22cbviu1SFpEOF",
      Plan: 100,
      Prenom: "Bettie",
      Phone: "",
      Historic: "2025-12-09T01:29:16.431Z,1250,25,dep;",
      Nom: "Denat",
      EndDate: "2026-03-18T20:27",
      Balance: "1250",
      TotalBalance: "5000",
      DailyMoney: "50",
      NIF: "099",
      StartDate: "2025-12-09T01:27:31.918Z",
    },
    {
      id: "KRnEbYacMxWf02g0NVEn",
      EndDate: "2026-03-18T20:41",
      StartDate: "2025-12-09T01:41:21.096Z",
      Nom: "Loreus",
      Phone: "",
      Prenom: "Samantha",
      Historic: "2025-12-09T01:42:04.636Z,400,20,dep;",
      TotalBalance: "2000",
      DailyMoney: "20",
      Plan: 100,
      NIF: "101",
      Balance: "400",
    },
    {
      id: "KZu7DeXoz5eag0CoVRqE",
      NIF: "104",
      StartDate: "2025-12-09T01:53:10.946Z",
      Phone: "",
      Plan: 100,
      Prenom: "Eloi",
      EndDate: "2026-03-18T20:53",
      Historic: "2025-12-09T01:53:30.492Z,180,9,dep;",
      TotalBalance: "2000",
      Balance: "180",
      Nom: "Ste ",
      DailyMoney: "20",
    },
    {
      id: "KuqvBOTh5qm8SG77b8aY",
      DailyMoney: "20",
      Plan: 100,
      Prenom: "Jeffter",
      EndDate: "2026-03-18T20:30",
      TotalBalance: "2000",
      StartDate: "2025-12-09T01:30:18.125Z",
      Nom: "Alexendre",
      Balance: "1200",
      Historic:
        "2025-12-09T01:31:06.674Z,1000,50,dep;2025-12-10T22:28:46.497Z,200,10,dep;",
      Phone: "",
      NIF: "099",
    },
    {
      id: "L1fi1hON1J2YRHOSquwO",
      TotalBalance: "5000",
      Prenom: "kenny",
      Nom: "Innocent",
      Historic:
        "2025-12-07T21:30:29.985Z,1000,20,dep;2025-12-07T21:33:38.247Z,600,12,dep;",
      StartDate: "2025-12-07T21:29:22.183Z",
      EndDate: "2026-03-17T13:29",
      Balance: "1600",
      DailyMoney: "50",
      NIF: "105",
      Plan: 100,
      Phone: "",
    },
    {
      id: "LbW9o3LkP4vZ7XgmaLWl",
      Prenom: "Richcardy",
      DailyMoney: "20",
      Nom: "Jean Denis ",
      StartDate: "2025-12-09T21:10:41.061Z",
      NIF: "086",
      EndDate: "2026-03-19T13:10",
      Phone: "",
      Historic: "2025-12-09T21:10:49.021Z,400,20,dep;",
      Balance: "400",
      Plan: 100,
      Detruit: "non",
      TotalBalance: "2000",
    },
    {
      id: "MWMzH2S5K9ucWMUxBL83",
      NIF: "117",
      Detruit: "non",
      StartDate: "2025-12-09T16:29:01.982Z",
      TotalBalance: "20000",
      DailyMoney: "200",
      Nom: "Decoline",
      Prenom: "Claudy",
      Balance: "10400",
      Phone: "",
      EndDate: "2026-03-19T08:29",
      Plan: 100,
      Historic:
        "2025-12-09T16:30:09.419Z,7000,35,dep;2025-12-09T16:31:13.917Z,2000,10,dep;2025-12-09T16:31:58.351Z,1400,7,dep;",
    },
    {
      id: "MXh4a0Fr5n9tX4ylQ3qL",
      DailyMoney: "40",
      TotalBalance: "4000",
      Nom: "Pierre",
      NIF: "094",
      Phone: "",
      StartDate: "2025-12-09T00:17:44.434Z",
      Balance: "920",
      Plan: 100,
      EndDate: "2026-03-18T19:17",
      Historic: "2025-12-09T00:18:45.157Z,920,23,dep;",
      Prenom: "Judith",
    },
    {
      id: "Mk55IqoZzYS1J5EXELKA",
      Balance: "700",
      TotalBalance: "5000",
      Prenom: "Carol",
      EndDate: "2026-03-18T20:26",
      NIF: "099",
      Plan: 100,
      DailyMoney: "50",
      Historic: "2025-12-09T01:27:05.364Z,700,14,dep;",
      StartDate: "2025-12-09T01:26:31.653Z",
      Phone: "",
      Nom: "Glezil",
    },
    {
      id: "NPgAQDgF6j2tVpXL10MZ",
      Detruit: "non",
      Balance: "7200",
      NIF: "073",
      Plan: 100,
      DailyMoney: "150",
      Nom: "Marie",
      StartDate: "2025-12-10T15:37:09.538Z",
      Prenom: "Michel",
      Historic: "2025-12-10T15:37:55.583Z,7200,48,dep;",
      Phone: "",
      TotalBalance: "15000",
      EndDate: "2026-03-20T07:37",
    },
    {
      id: "NjXLSjmaVi1vSsromv6w",
      Prenom: "Roseberline",
      StartDate: "2025-12-08T17:45:06.486Z",
      TotalBalance: "5000",
      EndDate: "2026-03-18T09:45",
      Nom: "Saintilma",
      Phone: "",
      Historic: "2025-12-08T17:46:05.780Z,50,1,dep;",
      Plan: 100,
      DailyMoney: "50",
      NIF: "112",
      Balance: "50",
    },
    {
      id: "OAbq3yyZCpkjwMhbnpms",
      TotalBalance: "10000",
      DailyMoney: "100",
      EndDate: "2026-03-18T19:24",
      Prenom: "Patrick",
      Historic:
        "2025-12-09T00:29:12.655Z,1100,11,dep;2025-12-10T13:05:54.796Z,400,4,dep;2025-12-11T13:30:11.104Z,100,1,dep;",
      Plan: 100,
      NIF: "096",
      Balance: "1600",
      Nom: "Durosier",
      Phone: "",
      StartDate: "2025-12-09T00:24:59.716Z",
    },
    {
      id: "OTAhNBQqy4yIvBotkcKb",
      DailyMoney: "20",
      StartDate: "2025-12-09T01:48:21.129Z",
      NIF: "102",
      Plan: 100,
      EndDate: "2026-03-18T20:48",
      TotalBalance: "2000",
      Phone: "",
      Prenom: "Catina",
      Balance: "160",
      Historic: "2025-12-09T01:48:35.498Z,160,8,dep;",
      Nom: "Etienne",
    },
    {
      id: "OedzkzHxYwT4eTAblnOO",
      EndDate: "2026-03-21T12:05",
      NIF: "083",
      StartDate: "2025-12-11T17:05:28.025Z",
      Nom: "Theolus",
      DailyMoney: "200",
      Detruit: "non",
      Prenom: "Felix",
      Historic:
        "2025-12-11T17:06:56.654Z,2200,11,dep;2025-12-11T17:09:09.955Z,200,1,dep;",
      Balance: "2400",
      Phone: "",
      Plan: 100,
      TotalBalance: "20000",
    },
    {
      id: "PSwS3xN0H108rfyRf6ws",
      NIF: "094",
      Balance: "60",
      Historic: "2025-12-09T00:15:22.064Z,60,3,dep;",
      StartDate: "2025-12-09T00:14:59.866Z",
      TotalBalance: "2000",
      Prenom: "Marie claude",
      DailyMoney: "20",
      EndDate: "2026-03-18T19:14",
      Nom: "Etienne",
      Phone: "",
      Plan: 100,
    },
    {
      id: "QAqKbhyeWfYupYthHsTO",
      TotalBalance: "5000",
      Historic: "2025-12-11T22:39:22.417Z,250,5,dep;",
      NIF: "123",
      Phone: "",
      EndDate: "2026-03-21T17:38",
      Nom: "Pierre",
      StartDate: "2025-12-11T22:38:58.178Z",
      DailyMoney: "50",
      Detruit: "non",
      Balance: "250",
      Prenom: "Inel",
      Plan: 100,
    },
    {
      id: "QI6HcTi9nsbGPpibawWE",
      Nom: "Myrtil",
      Detruit: "non",
      DailyMoney: "50",
      TotalBalance: "5000",
      NIF: "088",
      EndDate: "2026-03-21T11:47",
      StartDate: "2025-12-11T19:47:17.006Z",
      Plan: 100,
      Phone: "",
      Balance: "650",
      Prenom: "Ricardo",
      Historic: "2025-12-11T19:48:11.584Z,650,13,dep;",
    },
    {
      id: "QQ32ShIKMAFtT8MOubvw",
      NIF: "103",
      TotalBalance: "10000",
      Plan: 100,
      Balance: "1000",
      StartDate: "2025-12-08T19:16:14.133Z",
      DailyMoney: "100",
      EndDate: "2026-03-18T11:16",
      Prenom: "Rodeline",
      Phone: "",
      Nom: "Saint victor",
      Historic:
        "2025-12-08T19:16:35.096Z,500,5,dep;2025-12-12T15:35:56.858Z,500,5,dep;",
    },
    {
      id: "QevsMqHuZqgEI6kpzdZB",
      StartDate: "2025-12-11T19:28:58.117Z",
      Nom: "Saint claire",
      Phone: "",
      TotalBalance: "1000",
      Prenom: "Fenix",
      EndDate: "2026-03-21T14:28",
      Historic:
        "2025-12-11T19:29:15.074Z,450,45,dep;2025-12-12T13:13:22.201Z,50,5,dep;",
      Detruit: "non",
      Plan: 100,
      DailyMoney: "10",
      Balance: "500",
      NIF: "085",
    },
    {
      id: "RbRTxMzZfAJI9EANQXbn",
      NIF: "097",
      Historic: "2025-12-09T00:51:19.138Z,220,11,dep;",
      Nom: "Migael",
      Prenom: "Pamphil",
      Phone: "",
      Balance: "220",
      DailyMoney: "20",
      TotalBalance: "2000",
      StartDate: "2025-12-09T00:50:53.076Z",
      EndDate: "2026-03-18T19:50",
      Plan: 100,
    },
    {
      id: "S13oC4lFwgT4GY4PiYTV",
      Balance: "200",
      Detruit: "non",
      Phone: "",
      Nom: "Evely",
      StartDate: "2025-12-09T16:04:55.051Z",
      Historic: "2025-12-09T16:05:17.035Z,200,2,dep;",
      NIF: "117",
      TotalBalance: "10000",
      EndDate: "2026-03-19T08:04",
      Plan: 100,
      Prenom: "lorard",
      DailyMoney: "100",
    },
    {
      id: "TXChyOWpXBzVnYG5eJCX",
      Balance: "200",
      Plan: 100,
      Detruit: "non",
      Phone: "",
      NIF: "123",
      EndDate: "2026-03-22T08:06",
      Nom: "Marie Charles ",
      Prenom: "Anotte",
      DailyMoney: "20",
      StartDate: "2025-12-12T13:06:50.943Z",
      Historic: "2025-12-12T13:06:57.359Z,200,10,dep;",
      TotalBalance: "2000",
    },
    {
      id: "TsjJGY1SKSQfWZMs5ZJL",
      StartDate: "2025-12-09T00:03:30.912Z",
      DailyMoney: "50",
      Nom: "Antoine",
      Phone: "",
      NIF: "093",
      EndDate: "2026-03-18T19:03",
      Prenom: "Wilgens",
      Plan: 100,
      Balance: "600",
      Historic: "2025-12-09T00:03:49.966Z,600,12,dep;",
      TotalBalance: "5000",
    },
    {
      id: "UBuJSpnFjQ2uX8fJ9ALu",
      TotalBalance: "5000",
      Nom: "Adonis",
      NIF: "101",
      Prenom: "Deliana Polidor",
      Phone: "",
      EndDate: "2026-03-18T20:42",
      DailyMoney: "50",
      StartDate: "2025-12-09T01:42:32.880Z",
      Balance: "300",
      Plan: 100,
      Historic: "2025-12-09T01:42:42.470Z,300,6,dep;",
    },
    {
      id: "UHQWVvcuXWvhiFT0q2Y7",
      EndDate: "2026-03-18T20:35",
      DailyMoney: "30",
      NIF: "100",
      TotalBalance: "3000",
      Nom: "Metelus",
      Phone: "",
      Prenom: "Jean noel",
      Historic: "2025-12-09T01:36:47.715Z,420,14,dep;",
      StartDate: "2025-12-09T01:35:48.846Z",
      Plan: 100,
      Balance: "420",
    },
    {
      id: "UPnhvBW86Tev8xkfYVET",
      Nom: "Val",
      Prenom: "Fenel",
      NIF: "095",
      Phone: "",
      Plan: 100,
      Balance: "2500",
      EndDate: "2026-03-18T19:20",
      Historic:
        "2025-12-09T00:20:29.846Z,2300,23,dep;2025-12-09T22:56:51.045Z,200,2,dep;",
      DailyMoney: "100",
      StartDate: "2025-12-09T00:20:05.388Z",
      TotalBalance: "10000",
    },
    {
      id: "W6neO4O7RYFdJYU0vwvk",
      Prenom: "daphline",
      DailyMoney: "60",
      Nom: "senatus",
      StartDate: "2025-12-09T13:29:16.804Z",
      NIF: "116",
      EndDate: "2026-03-19T05:29",
      Phone: "",
      Plan: 100,
      Historic:
        "2025-12-09T13:29:34.769Z,180,3,dep;2025-12-10T17:37:46.993Z,120,2,dep;2025-12-12T14:23:45.731Z,180,3,dep;",
      Balance: "480",
      TotalBalance: "6000",
      Detruit: "non",
    },
    {
      id: "WYUSZQXug8KIU1o7apGl",
      Nom: "Pierre",
      DailyMoney: "50",
      Balance: "1350",
      TotalBalance: "5000",
      Plan: 100,
      Prenom: "Antoine",
      Historic:
        "2025-12-09T01:17:15.520Z,1150,23,dep;2025-12-11T16:03:37.119Z,200,4,dep;",
      Phone: "",
      StartDate: "2025-12-09T01:16:17.417Z",
      NIF: "098",
      EndDate: "2026-03-18T20:16",
    },
    {
      id: "WnplimkCJJqiGaxYoltX",
      StartDate: "2025-12-09T00:09:53.320Z",
      DailyMoney: "200",
      EndDate: "2026-03-18T19:09",
      Balance: "200",
      Nom: "Desilien",
      Plan: 100,
      TotalBalance: "20000",
      NIF: "093",
      Prenom: "Richnald",
      Historic: "2025-12-09T00:10:03.328Z,200,1,dep;",
      Phone: "",
    },
    {
      id: "WrrxCqFpwOBVVVp4P7hX",
      StartDate: "2025-12-11T18:07:38.590Z",
      Detruit: "non",
      EndDate: "2026-03-21T10:07",
      Balance: "1000",
      TotalBalance: "2000",
      Plan: 100,
      Nom: "Zamy",
      Historic: "2025-12-11T18:09:06.216Z,1000,50,dep;",
      Prenom: "Claudette",
      Phone: "",
      DailyMoney: "20",
      NIF: "075",
    },
    {
      id: "Y8heqUhEal6ONDci4VZw",
      NIF: "082",
      TotalBalance: "2000",
      Balance: "1380",
      Plan: 100,
      StartDate: "2025-12-11T20:51:39.513Z",
      DailyMoney: "20",
      EndDate: "2026-03-21T15:51",
      Detruit: "non",
      Prenom: "Carl",
      Phone: "",
      Historic:
        "2025-12-11T20:52:31.389Z,1280,64,dep;2025-12-11T20:53:34.502Z,100,5,dep;",
      Nom: "Arthur ",
    },
    {
      id: "YmUvOsFBzEjvTvGvjhIj",
      Detruit: "non",
      Nom: "Bernadin",
      Historic: "2025-12-11T16:14:19.513Z,4550,91,dep;",
      NIF: "085",
      DailyMoney: "50",
      Plan: 100,
      Prenom: "Nathalia",
      EndDate: "2026-03-21T11:13",
      Phone: "",
      StartDate: "2025-12-11T16:13:18.231Z",
      Balance: "4550",
      TotalBalance: "5000",
    },
    {
      id: "a0XSVdcEzQM983jaRyUm",
      TotalBalance: "10000",
      Prenom: "George",
      Nom: "Sofia",
      NIF: "107",
      Historic: "2025-12-09T02:07:09.047Z,2800,28,dep;",
      EndDate: "2026-03-18T21:06",
      DailyMoney: "100",
      Balance: "2800",
      StartDate: "2025-12-09T02:06:56.576Z",
      Phone: "",
      Plan: 100,
    },
    {
      id: "aVmwuBBIDXCRvqQIKatG",
      NIF: "116",
      Historic:
        "2025-12-08T21:48:03.744Z,400,8,dep;2025-12-10T21:21:17.240Z,200,4,dep;2025-12-11T16:29:54.804Z,100,2,dep;2025-12-12T14:04:17.166Z,300,6,dep;",
      StartDate: "2025-12-08T21:47:47.237Z",
      Plan: 100,
      Balance: "1000",
      Nom: "jean baptite",
      Phone: "",
      DailyMoney: "50",
      Prenom: "Darline",
      EndDate: "2026-03-18T13:47",
      TotalBalance: "5000",
    },
    {
      id: "ajABBgs9y39XsR07uNW1",
      Plan: 100,
      DailyMoney: "20",
      Historic: "2025-12-09T00:50:29.825Z,60,3,dep;",
      Prenom: "Smith",
      EndDate: "2026-03-18T19:50",
      Balance: "60",
      Phone: "",
      Nom: "Pierre",
      TotalBalance: "2000",
      StartDate: "2025-12-09T00:50:20.269Z",
      NIF: "096",
    },
    {
      id: "akJYb6dwayLz9l7LPrwZ",
      DailyMoney: "20",
      Plan: 100,
      Prenom: "Tina",
      EndDate: "2026-03-18T19:49",
      TotalBalance: "2000",
      StartDate: "2025-12-09T00:49:31.443Z",
      Nom: "Pierre",
      Balance: "340",
      Historic: "2025-12-09T00:49:47.192Z,340,17,dep;",
      Phone: "",
      NIF: "096",
    },
    {
      id: "bMv5L3A50ZiN1LdKKtfQ",
      Historic:
        "2025-12-09T02:01:53.776Z,100,5,dep;2025-12-10T16:15:09.949Z,60,3,dep;2025-12-11T19:49:40.055Z,40,2,dep;",
      TotalBalance: "2000",
      NIF: "106",
      Plan: 100,
      Prenom: "Enelson",
      Balance: "200",
      DailyMoney: "20",
      StartDate: "2025-12-09T02:01:42.285Z",
      Phone: "",
      EndDate: "2026-03-18T21:01",
      Nom: "Pierre",
    },
    {
      id: "bTvIzI5byr515QNVoFal",
      Balance: "280",
      Plan: 100,
      Prenom: "Yclesia",
      StartDate: "2025-12-09T01:49:42.442Z",
      EndDate: "2026-03-18T20:49",
      TotalBalance: "2000",
      Nom: "Vital",
      Historic:
        "2025-12-09T01:49:53.955Z,100,5,dep;2025-12-11T21:39:22.043Z,100,5,dep;2025-12-11T21:41:01.496Z,80,4,dep;",
      Phone: "",
      DailyMoney: "20",
      NIF: "103",
    },
    {
      id: "bckO3ok12LZhRyzsXQ61",
      Phone: "",
      DailyMoney: "200",
      EndDate: "2026-03-18T19:05",
      NIF: "093",
      Historic: "2025-12-09T00:06:26.295Z,800,4,dep;",
      TotalBalance: "20000",
      Prenom: "Micheline",
      Nom: "Senatus",
      StartDate: "2025-12-09T00:05:51.138Z",
      Plan: 100,
      Balance: "800",
    },
    {
      id: "c3taF86waaZobMQeZXvT",
      Prenom: "Sophia",
      DailyMoney: "200",
      Balance: "11000",
      TotalBalance: "20000",
      Phone: "",
      NIF: "086",
      Nom: "Georges",
      StartDate: "2025-12-08T17:21:22.179Z",
      Plan: 100,
      EndDate: "2026-03-18T09:21",
      Historic: "2025-12-08T17:22:24.794Z,11000,55,dep;",
    },
    {
      id: "cBpgKXeW6kf6vs0mRlf6",
      Historic:
        "2025-12-08T23:54:55.214Z,460,23,dep;2025-12-11T18:43:11.452Z,60,3,dep;",
      Prenom: "Julner",
      DailyMoney: "20",
      TotalBalance: "2000",
      EndDate: "2026-03-18T18:54",
      NIF: "091",
      Plan: 100,
      Phone: "",
      Nom: "Jean",
      Balance: "520",
      StartDate: "2025-12-08T23:54:16.855Z",
    },
    {
      id: "cWSdcKoPAfA8gtWCfzjO",
      Historic:
        "2025-12-11T14:00:04.647Z,1350,27,dep;2025-12-11T14:02:03.869Z,500,10,dep;",
      StartDate: "2025-12-11T13:59:49.109Z",
      NIF: "080",
      Detruit: "non",
      TotalBalance: "5000",
      DailyMoney: "50",
      Phone: "",
      Balance: "1850",
      Nom: "Gustin",
      EndDate: "2026-03-21T05:59",
      Plan: 100,
      Prenom: "Lovely",
    },
    {
      id: "daK8otnZXgEAmKmekXxb",
      EndDate: "2026-03-20T09:39",
      TotalBalance: "5000",
      Detruit: "non",
      Balance: "2600",
      Historic:
        "2025-12-10T17:40:40.656Z,1200,24,dep;2025-12-10T17:41:54.080Z,1400,28,dep;",
      StartDate: "2025-12-10T17:39:49.453Z",
      Plan: 100,
      Phone: "",
      Prenom: " pharat",
      DailyMoney: "50",
      NIF: "085",
      Nom: "Senat",
    },
    {
      id: "dtal9wsFbj5iSYVuN1HW",
      Nom: "Alexendre",
      StartDate: "2025-12-09T01:25:17.420Z",
      EndDate: "2026-03-18T20:25",
      TotalBalance: "20000",
      NIF: "099",
      Prenom: "Robertho",
      Phone: "",
      Balance: "1000",
      Plan: 100,
      Historic: "2025-12-09T01:25:58.540Z,1000,5,dep;",
      DailyMoney: "200",
    },
    {
      id: "e91poHjgU35p8Dhae9nS",
      StartDate: "2025-12-11T22:33:10.532Z",
      Plan: 100,
      Phone: "",
      EndDate: "2026-03-21T17:33",
      NIF: "122",
      Detruit: "non",
      Balance: "100",
      TotalBalance: "10000",
      Historic: "2025-12-11T22:33:16.274Z,100,1,dep;",
      DailyMoney: "100",
      Nom: "Tassy",
      Prenom: "Celirat",
    },
    {
      id: "eOxvOaWPfqTTYxUJo3Sh",
      StartDate: "2025-12-08T21:11:54.443Z",
      TotalBalance: "5000",
      Historic:
        "2025-12-08T21:12:21.056Z,500,10,dep;2025-12-08T21:14:45.644Z,50,1,dep;2025-12-08T21:15:16.463Z,100,2,dep;",
      Phone: "",
      NIF: "115",
      Balance: "650",
      EndDate: "2026-03-18T13:11",
      Plan: 100,
      DailyMoney: "50",
      Nom: "Sylvest",
      Prenom: "Saint Juste",
    },
    {
      id: "fiDlX3xkAtAPdab7DhEw",
      Phone: "",
      DailyMoney: "50",
      Plan: 100,
      EndDate: "2026-03-18T20:12",
      TotalBalance: "5000",
      Nom: "Suprien",
      Historic: "2025-12-09T01:13:06.285Z,300,6,dep;",
      Prenom: "Rosette",
      NIF: "097",
      Balance: "300",
      StartDate: "2025-12-09T01:12:58.014Z",
    },
    {
      id: "g5sW5EYWoPpKuPfwlejt",
      Prenom: "Jean linon",
      TotalBalance: "5000",
      Plan: 100,
      DailyMoney: "50",
      Historic: "2025-12-09T01:50:42.107Z,100,2,dep;",
      EndDate: "2026-03-18T20:50",
      Phone: "",
      NIF: "103",
      Nom: "Charles",
      Balance: "100",
      StartDate: "2025-12-09T01:50:28.536Z",
    },
    {
      id: "gA765ZkcFf725xEGKJoH",
      Historic: "2025-12-09T01:34:45.307Z,100,2,dep;",
      EndDate: "2026-03-18T20:33",
      Phone: "",
      Nom: "Anderson",
      NIF: "100",
      Balance: "100",
      StartDate: "2025-12-09T01:33:17.679Z",
      Prenom: "Aristil",
      Plan: 100,
      DailyMoney: "50",
      TotalBalance: "5000",
    },
    {
      id: "gDsjncK3kTggL1VRvjYY",
      EndDate: "2026-03-18T06:10",
      TotalBalance: "8000",
      Balance: "880",
      Historic:
        "2025-12-08T14:10:55.466Z,160,2,dep;2025-12-09T13:31:34.800Z,160,2,dep;2025-12-11T13:41:27.976Z,160,2,dep;2025-12-12T14:30:10.017Z,400,5,dep;",
      StartDate: "2025-12-08T14:10:15.142Z",
      Plan: 100,
      Phone: "",
      Prenom: "Wilner",
      DailyMoney: "80",
      NIF: "111",
      Nom: "Senatus",
    },
    {
      id: "hQ6I0KheLkLmdmeCSL4H",
      Phone: "",
      DailyMoney: "50",
      Balance: "1300",
      NIF: "086",
      EndDate: "2026-03-19T07:28",
      Prenom: "Peterson",
      Plan: 100,
      StartDate: "2025-12-09T12:28:19.376Z",
      Nom: "Dervil",
      Historic:
        "2025-12-09T12:28:40.684Z,750,15,dep;2025-12-09T12:30:08.933Z,200,4,dep;2025-12-11T14:14:06.404Z,350,7,dep;",
      TotalBalance: "5000",
    },
    {
      id: "i7S4FEDeYTZy3qpMBgs2",
      EndDate: "2026-03-18T18:46",
      DailyMoney: "100",
      Phone: "",
      Prenom: "Simeon",
      Nom: "Joly",
      NIF: "090",
      TotalBalance: "10000",
      Historic: "2025-12-08T23:49:45.979Z,100,1,dep;",
      Balance: "100",
      Plan: 100,
      StartDate: "2025-12-08T23:46:36.482Z",
    },
    {
      id: "inN93lwxmKDWErUcIv6i",
      Plan: 200,
      Historic:
        "2025-12-07T22:02:44.262Z,100,4,dep;2025-12-11T21:55:12.480Z,25,1,dep;2025-12-11T21:56:46.237Z,25,1,dep;",
      Prenom: "Claudia",
      DailyMoney: "25",
      EndDate: "2026-06-25T14:03",
      NIF: "110",
      StartDate: "2025-12-07T22:01:46.474Z",
      Phone: "",
      Balance: "150",
      TotalBalance: "5000",
      Nom: "Lindor",
    },
    {
      id: "kH1juduPfGPSmmCZ4tmw",
      EndDate: "2026-03-20T08:47",
      Historic:
        "2025-12-10T16:47:42.358Z,500,5,dep;2025-12-11T18:07:03.423Z,100,1,dep;",
      Detruit: "non",
      DailyMoney: "100",
      Balance: "600",
      StartDate: "2025-12-10T16:47:17.787Z",
      Phone: "",
      Prenom: "Resiane",
      Nom: "Antenor",
      NIF: "119",
      Plan: 100,
      TotalBalance: "10000",
    },
    {
      id: "l8YZqE9RqtJCHoA8GhpS",
      EndDate: "2026-03-21T11:56",
      TotalBalance: "5000",
      DailyMoney: "50",
      NIF: "027",
      Nom: "Joyeux",
      Phone: "",
      Prenom: "Kettelie",
      Historic: "2025-12-11T16:57:21.865Z,4500,90,dep;",
      Detruit: "non",
      StartDate: "2025-12-11T16:56:18.121Z",
      Plan: 100,
      Balance: "4500",
    },
    {
      id: "nipeyv3Fdb0mpBPVninG",
      TotalBalance: "40000",
      Detruit: "non",
      NIF: "120",
      Plan: 200,
      DailyMoney: "200",
      Balance: "800",
      StartDate: "2025-12-10T21:03:11.728Z",
      Nom: "Cadet",
      EndDate: "2026-06-28T13:03",
      Phone: "",
      Prenom: "Fadenet",
      Historic: "2025-12-10T21:03:21.234Z,800,4,dep;",
    },
    {
      id: "nrQJSUlbPz7XpYX7n8Q9",
      Prenom: "Tertullien",
      EndDate: "2026-03-20T14:21",
      NIF: "088",
      DailyMoney: "100",
      Balance: "2300",
      Plan: 100,
      Detruit: "non",
      StartDate: "2025-12-10T22:21:19.495Z",
      Phone: "",
      TotalBalance: "10000",
      Nom: "worlf kelly",
      Historic: "2025-12-10T22:22:58.583Z,2300,23,dep;",
    },
    {
      id: "nyN41G57iLJcW87zcRWK",
      Balance: "200",
      Historic: "2025-12-08T23:53:33.718Z,200,1,dep;",
      Phone: "",
      DailyMoney: "200",
      Plan: 100,
      EndDate: "2026-03-18T18:52",
      NIF: "090",
      Nom: "Jean",
      TotalBalance: "20000",
      StartDate: "2025-12-08T23:52:40.252Z",
      Prenom: "Sylvain ",
    },
    {
      id: "oU2JOeIziPaXYWYCTGdX",
      Phone: "",
      Prenom: "Michelange",
      Detruit: "non",
      Balance: "1500",
      Plan: 100,
      TotalBalance: "5000",
      DailyMoney: "50",
      NIF: "053",
      Historic: "2025-12-11T00:52:35.460Z,1500,30,dep;",
      StartDate: "2025-12-11T00:52:16.033Z",
      EndDate: "2026-03-20T19:52",
      Nom: "Bontemps",
    },
    {
      id: "oXugnWXdS9h602pYA1Js",
      Historic:
        "2025-12-09T01:51:35.842Z,520,13,dep;2025-12-09T19:41:39.178Z,120,3,dep;2025-12-09T19:43:44.095Z,160,4,dep;2025-12-10T20:29:11.832Z,120,3,dep;",
      EndDate: "2026-03-18T20:51",
      Phone: "",
      DailyMoney: "40",
      StartDate: "2025-12-09T01:51:10.064Z",
      Prenom: "Stanley",
      TotalBalance: "4000",
      Plan: 100,
      NIF: "103",
      Nom: "Cadot",
      Balance: "920",
    },
    {
      id: "pJ6NwqY7nf46JW3gTGt8",
      NIF: "092",
      EndDate: "2026-03-18T18:57",
      Prenom: "Augusmar",
      DailyMoney: "50",
      Historic: "2025-12-08T23:58:37.226Z,600,12,dep;",
      Balance: "600",
      StartDate: "2025-12-08T23:57:43.336Z",
      TotalBalance: "5000",
      Plan: 100,
      Nom: "Joseph",
      Phone: "",
    },
    {
      id: "q01rKdafmoV7YygtZZGd",
      NIF: "092",
      EndDate: "2026-03-18T19:02",
      Balance: "1000",
      Phone: "",
      StartDate: "2025-12-09T00:02:35.678Z",
      DailyMoney: "100",
      Plan: 100,
      Prenom: "Azor",
      TotalBalance: "10000",
      Historic: "2025-12-09T00:02:48.886Z,1000,10,dep;",
      Nom: "Paul",
    },
    {
      id: "q0VtaYvJyHR44vyKUW4N",
      Prenom: "Myrlène",
      TotalBalance: "5000",
      NIF: "091",
      Phone: "",
      Balance: "1700",
      EndDate: "2026-03-18T18:55",
      StartDate: "2025-12-08T23:55:25.771Z",
      Historic: "2025-12-08T23:56:33.746Z,1700,34,dep;",
      DailyMoney: "50",
      Plan: 100,
      Nom: "Clervil",
    },
    {
      id: "qPu3uHnxYtUGlmOSqbIB",
      StartDate: "2025-12-11T00:50:08.419Z",
      Detruit: "non",
      Balance: "100",
      NIF: "121",
      Nom: "Alcide",
      EndDate: "2026-03-20T19:50",
      DailyMoney: "25",
      TotalBalance: "2500",
      Phone: "",
      Plan: 100,
      Prenom: "Selmise",
      Historic: "2025-12-11T00:50:24.424Z,100,4,dep;",
    },
    {
      id: "rDtQdQr6ahRE8k4uU0Q5",
      Detruit: "non",
      Plan: 100,
      Nom: "saintfort",
      TotalBalance: "2000",
      NIF: "086",
      StartDate: "2025-12-10T14:34:16.569Z",
      EndDate: "2026-03-20T06:34",
      DailyMoney: "20",
      Balance: "400",
      Prenom: "Fanel",
      Phone: "",
      Historic: "2025-12-10T14:34:45.572Z,400,20,dep;",
    },
    {
      id: "rjbdaDAJnvbBRnjXJIeO",
      Balance: "200",
      StartDate: "2025-12-09T02:03:23.936Z",
      Plan: 100,
      DailyMoney: "20",
      Phone: "",
      Prenom: "Guery",
      NIF: "106",
      EndDate: "2026-03-18T21:03",
      Historic:
        "2025-12-09T02:04:49.440Z,100,5,dep;2025-12-12T12:39:57.737Z,100,5,dep;",
      Nom: "Joseph",
      TotalBalance: "2000",
    },
    {
      id: "sVLrk0x5RoD0ZOruRO4T",
      Detruit: "non",
      Prenom: "Mito",
      StartDate: "2025-12-09T19:47:37.344Z",
      Historic: "2025-12-09T19:49:03.029Z,90,3,dep;",
      TotalBalance: "3000",
      Nom: "Voltaire",
      NIF: "118",
      DailyMoney: "30",
      Phone: "",
      Plan: 100,
      Balance: "90",
      EndDate: "2026-03-19T11:47",
    },
    {
      id: "t5jzBpj1WihSRjyrJSpf",
      Prenom: "Betsaleel",
      EndDate: "2026-03-18T19:13",
      Plan: 100,
      Phone: "",
      TotalBalance: "2000",
      Nom: "Atilus",
      DailyMoney: "20",
      StartDate: "2025-12-09T00:13:41.284Z",
      NIF: "094",
      Historic: "2025-12-09T00:14:14.675Z,940,47,dep;",
      Balance: "940",
    },
    {
      id: "t8R5hJI4v58KlNUbRwJF",
      Historic: "2025-12-09T01:14:28.356Z,400,4,dep;",
      TotalBalance: "10000",
      Phone: "",
      Balance: "400",
      Prenom: "Yvens",
      NIF: "098",
      StartDate: "2025-12-09T01:14:07.838Z",
      EndDate: "2026-03-18T20:14",
      Plan: 100,
      Nom: "Dormena",
      DailyMoney: "100",
    },
    {
      id: "tZWj9W7wAXIJV3MAcAai",
      Prenom: "Excel",
      NIF: "096",
      TotalBalance: "5000",
      Phone: "",
      Balance: "2000",
      StartDate: "2025-12-09T00:30:31.456Z",
      Historic: "2025-12-09T00:30:57.582Z,2000,40,dep;",
      EndDate: "2026-03-18T19:30",
      DailyMoney: "50",
      Plan: 100,
      Nom: "Lundi",
    },
    {
      id: "unu6oW3SMiG9oN76dxQd",
      NIF: "103",
      TotalBalance: "10000",
      Balance: "300",
      Nom: "Profilien",
      Prenom: "Benitho",
      Phone: "",
      StartDate: "2025-12-09T01:49:09.223Z",
      Historic: "2025-12-09T01:49:20.986Z,300,3,dep;",
      DailyMoney: "100",
      Plan: 100,
      EndDate: "2026-03-18T20:49",
    },
    {
      id: "utksv6gHsGYoCKg2h8px",
      Plan: 365,
      Nom: "Jean Paul ",
      NIF: "091",
      Balance: "1800",
      Phone: "",
      Detruit: "non",
      DailyMoney: "150",
      EndDate: "2026-12-10T10:18",
      Prenom: "Poussaint",
      TotalBalance: "54750",
      Historic:
        "2025-12-10T18:21:54.397Z,1500,10,dep;2025-12-10T18:23:46.366Z,300,2,dep;",
      StartDate: "2025-12-10T18:18:04.995Z",
    },
    {
      id: "v7MLSiLXPZN4mag3WLc0",
      EndDate: "2026-03-19T16:00",
      Nom: "Linsa",
      StartDate: "2025-12-09T21:00:31.638Z",
      TotalBalance: "20000",
      Plan: 100,
      Phone: "",
      Balance: "14400",
      NIF: "060",
      Detruit: "non",
      Prenom: "Joseph",
      Historic: "2025-12-09T21:01:05.387Z,14400,72,dep;",
      DailyMoney: "200",
    },
    {
      id: "vIJfbXjE4iio8GwQRUu7",
      EndDate: "2026-03-18T20:52",
      Historic: "2025-12-09T01:52:28.439Z,2800,56,dep;",
      Nom: "Duverneau",
      NIF: "104",
      Plan: 100,
      TotalBalance: "5000",
      StartDate: "2025-12-09T01:52:00.176Z",
      DailyMoney: "50",
      Phone: "",
      Balance: "2800",
      Prenom: "Prenelus",
    },
    {
      id: "wMEDQLt5yX4z8ChpDg04",
      Balance: "1250",
      Historic: "2025-12-11T21:03:23.294Z,1250,25,dep;",
      Phone: "",
      Prenom: "Wilbert",
      DailyMoney: "50",
      EndDate: "2026-03-21T16:03",
      TotalBalance: "5000",
      NIF: "083",
      Nom: "Lagrenade",
      StartDate: "2025-12-11T21:03:02.539Z",
      Detruit: "non",
      Plan: 100,
    },
    {
      id: "xDecjo4hMB6DBVjjsLwE",
      Plan: 100,
      DailyMoney: "50",
      Phone: "",
      StartDate: "2025-12-09T01:32:23.216Z",
      Historic:
        "2025-12-09T01:32:37.679Z,2500,50,dep;2025-12-10T20:51:58.458Z,200,4,dep;2025-12-11T13:43:14.156Z,200,4,dep;",
      NIF: "100",
      Prenom: "Bettie",
      EndDate: "2026-03-18T20:32",
      Nom: "Denat",
      TotalBalance: "5000",
      Balance: "2900",
    },
    {
      id: "xnaixAXXAjDAqGi58ueu",
      TotalBalance: "2000",
      NIF: "105",
      EndDate: "2026-03-19T05:26",
      Balance: "560",
      DailyMoney: "20",
      Detruit: "non",
      Plan: 100,
      Historic:
        "2025-12-09T13:26:47.177Z,480,24,dep;2025-12-11T13:00:09.450Z,80,4,dep;",
      Prenom: "roger",
      StartDate: "2025-12-09T13:26:19.934Z",
      Nom: "clarens",
      Phone: "",
    },
    {
      id: "y5VTPDkGxxg34As6Y2dR",
      Balance: "400",
      Plan: 100,
      StartDate: "2025-12-09T00:01:11.256Z",
      Historic: "2025-12-09T00:01:53.525Z,400,4,dep;",
      EndDate: "2026-03-18T19:01",
      DailyMoney: "100",
      TotalBalance: "10000",
      Phone: "",
      NIF: "092",
      Nom: "Ciliane",
      Prenom: "Charlot",
    },
    {
      id: "ycaySpKjNaPXQ1E5jMHZ",
      Balance: "900",
      Nom: "Boy",
      Plan: 100,
      Phone: "",
      TotalBalance: "18000",
      NIF: "092",
      StartDate: "2025-12-08T23:59:18.256Z",
      Historic: "2025-12-09T00:00:38.232Z,900,5,dep;",
      Prenom: "Fritznel",
      DailyMoney: "180",
      EndDate: "2026-03-18T18:59",
    },
  ];*/
  useEffect(() => {
    setPassDeleteOk(passDelete === password.current);
  }, [passDelete, password.current]);

  // delete popup
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
          setError("User not found");
          return;
        }

        const userData = snap.data();

        if (userData.password !== oldPassword) {
          setError("Old password is incorrect");
          return;
        }

        await updateDoc(userRef, {
          password: newPassword,
          updatedAt: new Date(),
        });

        setOpenChangePassWord(false);
        setOldPassword("");
        setNewPassword("");
        alert("Password updated successfully");
        window.location.reload();
      } catch (err) {
        console.error(err);
        setError("Failed to update password");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Email non trouver");
    }
  };

  // ❌ EXCLURE les détruits
  const cleanedData = doc1.filter((d) => d.Detruit == "oui");

  // récupération des détruits
  const destroyedCount = doc1.filter((d) => d.Detruit === "oui").length;

  // FILTERS
  const filteredData = doc1.filter((data) => {
    const docDate = data.StartDate.split(" ")[0];

    const nameMatch = data.Nom.toLowerCase().includes(
      searchQuery.toLowerCase(),
    );

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

  // TRI DESC
  filteredData.sort((a, b) => {
    const dateA = new Date(a.StartDate);
    const dateB = new Date(b.StartDate);
    return dateB.getTime() - dateA.getTime();
  });

  // TOTALS
  const totalBalanceSum = filteredData.reduce(
    (acc, item) => acc + Number(item.Balance),
    0,
  );

  const totalExpectedSum = filteredData.reduce(
    (acc, item) => acc + Number(item.TotalBalance),
    0,
  );
  const tri = doc1.filter((d) => d.Detruit == "oui");
  const totaldetruit = tri.reduce(
    (acc, item) => acc + Number(item.TotalBalance),
    0,
  );
  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      setDoc((prev) => prev.filter((doc) => doc.id !== docId));
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
    const copy: FormData[] = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FormData[];

    setDoc(docs);
    //setCopy(copy);
    console.log(copy);

    const userRef = doc(db, "user", "test4321@gmail.com");
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.log("User not found");
    }

    const userData = snap.data();
    password.current = userData?.password;
    setPasswordshow(userData?.password);
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

  const logOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  async function termitatePlan(id: string, name: string) {
    if (!doc1) return;
    setPassDeleteOk(false);
    setPassDelete("");
    // setLoadingAdd(true);

    try {
      const ref = doc(db, "doc", id);
      //actualise les deux propriete dans la base : historic et balance
      await updateDoc(ref, {
        Detruit: "oui",
      });

      alert(`Vous avez detruit le carnet de: ${name} !`);
      window.location.reload();

      // setAmount("");
      //setOpenAdd(false);
    } catch (err) {
      console.error("Erreur ajout fund:", err);
    } finally {
      //setLoadingAdd(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-100 w-full fixed top-0 border-b z-50">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="logo" className="w-7 h-7" />
          <div className="hidden md:flex">
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <p className="text-xl text-gray-700 font-bold">Ti kanè </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/new-client")}
          >
            <PlusIcon className="size-4" />
            Nouveau Client
          </Button>

          <Button variant="outline" onClick={logOut}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
      {/* Main */}
      <div className="pt-[75px] px-4 w-full max-w-4xl mx-auto">
        <p className="text-center text-sm md:text-[14[px] my-2 text-gray-400 font-bold">
          développé par ING Orcel Euler. No 47656226
        </p>
        <p className="text-center text-sm md:text-[14[px] my-2 text-gray-400 font-bold">
          & Mr Paillant No 43117879
        </p>

        <Button
          variant="destructive"
          className="mt-3 sm:mt-0 sm:ml-4 flex items-center mx-auto my-2 gap-2"
          onClick={() => {
            // setSelectedDoc(data);
            setOpenChangePassWord(true);
          }}
        >
          <Key className="size-4" />
          Changer le mot de passe
        </Button>
        <Dialog open={openChangePassWord} onOpenChange={setOpenChangePassWord}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Changer le mot de passe{" "}
                <span className="text-gray-600 font-mono">
                  ({passwordshow.slice(0, 3)}****)
                </span>{" "}
              </DialogTitle>
            </DialogHeader>

            <Input
              type="text"
              placeholder="ancien password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <Input
              type="text"
              placeholder="Nouveau password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
              <Button
                disabled={loading || !oldPassword || !newPassword}
                onClick={handleChangePassword}
              >
                {loading ? "En cours..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-gray-50 rounded-3xl p-3 md:p-10">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">
              Recherche par nom.
            </label>
            <Input
              className="max-w-[450px]"
              placeholder="Recherche par nom"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Debut.</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Fin.</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">carte ($)</label>
            <Input
              type="number"
              placeholder="Ex : 100"
              value={filterDailyMoney}
              onChange={(e) => setFilterDailyMoney(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">nombre de jour</label>
            <Input
              type="number"
              placeholder="Ex : 200"
              value={filterPlanDays}
              onChange={(e) => setFilterPlanDays(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setExactDate("");
              setStartDate("");
              setEndDate("");
              setSearchQuery("");
              setFilterPlanDays("");
              setFilterDailyMoney("");
            }}
          >
            reinitialiser
          </Button>
        </div>

        <div className="flex justify-center my-5">
          <Button onClick={() => setshow(!show)}>
            {!show ? "Voir" : "Cacher"} les calculs
          </Button>
        </div>

        {show && (
          <div className="mb-10 p-5 border rounded-2xl shadow-sm bg-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Total */}
              <div className="min-w-[150px]">
                <p className="text-sm text-gray-500">Total Global</p>
                <p className="text-xl font-semibold text-gray-800">
                  {totalBalanceSum}$ht
                </p>
                <p className="text-sm text-gray-500">/ {totalExpectedSum}$ht</p>
              </div>

              {/* Percent */}
              <div className="flex flex-col lg:items-center min-w-[120px]">
                <p className="text-sm text-gray-500 mb-1">Pourcentage</p>

                <Input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  placeholder="%"
                  className="w-full lg:w-24 text-center"
                />

                <p className="mt-2 text-sm text-gray-700">
                  {((Number(percent) * totalExpectedSum) / 100).toFixed(2)} $ht
                </p>
              </div>

              {/* Destroyed */}
              <div className="min-w-[150px]">
                <p className="text-sm text-gray-500">Détruits</p>
                <p className="text-lg font-semibold text-green-600">
                  {destroyedCount}
                </p>
                <p className="text-sm text-gray-500">
                  ({((totaldetruit * Number(percent)) / 100).toFixed(2)} $ht)
                </p>
              </div>

              {/* Clients */}
              <div className="min-w-[120px] text-left lg:text-right">
                <p className="text-sm text-gray-500">Clients</p>
                <p className="text-lg font-semibold text-gray-800">
                  {filteredData.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LISTE */}
        <ul className="space-y-4 mb-10">
          {filteredData.map((data) => (
            <li
              key={data.id}
              className={`p-4 border rounded-lg shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between 
              ${
                data.Detruit === "oui"
                  ? "bg-red-200 text-red-700 border-red-400"
                  : useProgress(data.StartDate, data.EndDate) >= 99 ||
                      getNumericProgress(data.Balance, data.TotalBalance) >= 99
                    ? "bg-green-400 text-white"
                    : "bg-white"
              }
            `}
            >
              <div
                className="cursor-pointer"
                onClick={() => router.push(`/open-doc/${data.id}`)}
              >
                <p className="font-bold text-lg">
                  {data.Nom} {data.Prenom}{" "}
                  {data.Detruit === "oui" && (
                    <span className="text-red-700 font-bold">(Détruit)</span>
                  )}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <p>
                      <span className="font-bold">Début :</span>
                      {formatReadableDate(
                        getLocalISOWithoutSeconds(data.StartDate),
                      )}
                    </p>

                    <p className="ml-3">
                      <span className="font-bold">Fin :</span>
                      {formatReadableDate(
                        getLocalISOWithoutSeconds(data.EndDate),
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress
                      value={useProgress(data.StartDate, data.EndDate)}
                      className="flex-1"
                    />
                    <p className="text-sm font-medium">
                      {useProgress(data.StartDate, data.EndDate)}%
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm">Ajouté:</p>
                <p className="text-gray-600 text-sm">
                  {data.Balance}$ht/{data.TotalBalance}$ht
                </p>

                <div className="flex items-center gap-3">
                  <Progress
                    value={getNumericProgress(data.Balance, data.TotalBalance)}
                    className="flex-1"
                  />
                  <p className="text-sm font-medium">
                    {getNumericProgress(data.Balance, data.TotalBalance)}%
                  </p>
                </div>
              </div>

              <p>
                <span className="font-bold">Carte :</span> {data.DailyMoney}$ht
                <span className="font-bold mx-2">Durant :</span>
                {data.Plan} jours
              </p>
              <div className=" grid-cols-1 gap-3">
                <Button
                  variant="destructive"
                  className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2"
                  onClick={() => {
                    setSelectedDoc(data);
                    setOpenConfirmPopup(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  className="mt-5 sm:mt-3 sm:ml-4 flex items-center gap-2"
                  onClick={() => {
                    setSelectedDoc(data);
                    setOpenConfirmPopupDestroy(true);
                    // termitatePlan(data.id, `${data.Nom} ${data.Prenom}`);
                  }}
                >
                  <DeleteIcon className="size-4" />
                  Vider
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Confirmation Popup */}{" "}
      <Dialog open={openConfirmPopup} onOpenChange={setOpenConfirmPopup}>
        {" "}
        <DialogContent>
          {" "}
          <DialogHeader>
            {" "}
            <DialogTitle>Confirmer la suppression</DialogTitle>{" "}
            <DialogDescription>
              {" "}
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-bold">
                {" "}
                {selectedDoc?.Nom} {selectedDoc?.Prenom}{" "}
              </span>{" "}
              ? <br /> Cette action est irréversible. Entrer votre mot de passe
              pour confirmer!{" "}
              <Input
                type="password"
                value={passDelete}
                onChange={(e) => setPassDelete(e.target.value)}
                className="my-3"
              />{" "}
              {passDeleteOk ? (
                <span className="text-green-500">Suppression autorisé</span>
              ) : (
                <span className="text-red-500">
                  {" "}
                  Suppression non authorisé aux intrus! (li tap trò facile){" "}
                </span>
              )}{" "}
            </DialogDescription>{" "}
          </DialogHeader>{" "}
          <DialogFooter>
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              {" "}
              Non, Fermer{" "}
            </Button>{" "}
            <Button
              variant="destructive"
              disabled={!passDeleteOk}
              onClick={() => {
                if (selectedDoc) deleteDocument("doc", selectedDoc.id);
                setOpenConfirmPopup(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              {" "}
              Oui, Supprimer{" "}
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>
      <Dialog
        open={openConfirmPopupDestroy}
        onOpenChange={setOpenConfirmPopupDestroy}
      >
        {" "}
        <DialogContent>
          {" "}
          <DialogHeader>
            {" "}
            <DialogTitle>Confirmer la Destruction</DialogTitle>{" "}
            <DialogDescription>
              {" "}
              Êtes-vous sûr de vouloir Detruire le carnet{" "}
              <span className="font-bold">
                {" "}
                {selectedDoc?.Nom} {selectedDoc?.Prenom}{" "}
              </span>{" "}
              ? <br /> Cette action est irréversible. Entrer votre mot de passe
              pour confirmer!{" "}
              <Input
                type="password"
                value={passDelete}
                onChange={(e) => setPassDelete(e.target.value)}
                className="my-3"
              />{" "}
              {passDeleteOk ? (
                <span className="text-green-500">Destruction autorisé</span>
              ) : (
                <span className="text-red-500">
                  {" "}
                  Destruction non authorisé aux intrus! (li tap trò facile){" "}
                </span>
              )}{" "}
            </DialogDescription>{" "}
          </DialogHeader>{" "}
          <DialogFooter>
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmPopupDestroy(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              {" "}
              Non, Fermer{" "}
            </Button>{" "}
            <Button
              variant="destructive"
              disabled={!passDeleteOk}
              onClick={() => {
                if (selectedDoc)
                  termitatePlan(
                    selectedDoc.id,
                    `${selectedDoc.Nom} ${selectedDoc.Prenom}`,
                  );
                setOpenConfirmPopupDestroy(false);
                setPassDeleteOk(false);
                setPassDelete("");
              }}
            >
              {" "}
              Oui, Vider{" "}
            </Button>{" "}
          </DialogFooter>{" "}
        </DialogContent>{" "}
      </Dialog>
    </>
  );
}
