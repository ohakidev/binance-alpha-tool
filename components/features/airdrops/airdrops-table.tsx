"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Calendar,
  Trophy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  TrendingUp,
  History,
  Sparkles,
  Clock,
  DollarSign,
  Target,
  X,
  Send,
  Bell,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";

// UI Components
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ParticleEffect } from "@/components/ui/particle-effect";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useTelegram } from "@/lib/hooks/use-telegram";

// Types
interface Airdrop {
  id: string;
  projectName: string;
  symbol: string;
  logo: string;
  chain: string;
  status: string;
  airdropAmount: string;
  claimStartDate: string | null;
  claimEndDate: string | null;
  requirements: string[];
  estimatedValue: number | null;
  score: number;
  description?: string;
  website?: string;
  twitter?: string;
  // New fields
  type: "TGE" | "PreTGE" | "Airdrop";
  requiredPoints: number;
  deductPoints: number;
  contractAddress: string;
}

interface ClaimRecord {
  id: string;
  projectName: string;
  symbol: string;
  logo: string;
  chain: string;
  pointsUsed: number;
  amountReceived: string;
  pricePerToken: number;
  totalValue: number;
  claimedAt: string;
  currentValue?: number;
}

// Chain colors
const chainColors: Record<string, string> = {
  BSC: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ETH: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Polygon: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  Solana: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

// Mock claim history data
const mockClaimHistory: ClaimRecord[] = [
  {
    id: "1",
    projectName: "Zeta Protocol",
    symbol: "ZETA",
    logo: "🚀",
    chain: "BSC",
    pointsUsed: 1000,
    amountReceived: "500 ZETA",
    pricePerToken: 0.25,
    totalValue: 125,
    claimedAt: "2025-01-15T10:30:00Z",
    currentValue: 150,
  },
  {
    id: "2",
    projectName: "Luna Finance",
    symbol: "LUNA",
    logo: "🌙",
    chain: "ETH",
    pointsUsed: 500,
    amountReceived: "200 LUNA",
    pricePerToken: 1.2,
    totalValue: 240,
    claimedAt: "2025-01-10T14:20:00Z",
    currentValue: 220,
  },
  {
    id: "3",
    projectName: "Star Wallet",
    symbol: "STAR",
    logo: "⭐",
    chain: "Polygon",
    pointsUsed: 800,
    amountReceived: "1000 STAR",
    pricePerToken: 0.08,
    totalValue: 80,
    claimedAt: "2025-01-05T09:15:00Z",
    currentValue: 95,
  },
];

export function AirdropsTable() {
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "history">(
    "live",
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedAirdrop, setSelectedAirdrop] = useState<Airdrop | null>(null);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    isLoading: isSendingTelegram,
    sendAirdropAlert,
    testConnection,
  } = useTelegram();

  // Query for live airdrops
  const { data: liveData, isLoading: liveLoading } = useQuery({
    queryKey: ["airdrops", "live"],
    queryFn: async () => {
      const res = await fetch("/api/binance/alpha/airdrops?status=claimable");
      const json = await res.json();
      return json.data as Airdrop[];
    },
    enabled: activeTab === "live",
    refetchInterval: false, // Disabled - use manual refresh button
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for upcoming airdrops
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ["airdrops", "upcoming"],
    queryFn: async () => {
      const res = await fetch("/api/binance/alpha/airdrops?status=upcoming");
      const json = await res.json();
      return json.data as Airdrop[];
    },
    enabled: activeTab === "upcoming",
    refetchInterval: false, // Disabled - use manual refresh button
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and search data
  const filteredData = useMemo(() => {
    let data: (Airdrop | ClaimRecord)[] = [];

    if (activeTab === "history") {
      data = mockClaimHistory;
    } else if (activeTab === "upcoming") {
      data = upcomingData || [];
    } else {
      data = liveData || [];
    }

    // Apply chain filter
    if (selectedChains.length > 0) {
      data = data.filter((item) => selectedChains.includes(item.chain));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.projectName.toLowerCase().includes(query) ||
          item.symbol.toLowerCase().includes(query),
      );
    }

    return data;
  }, [activeTab, liveData, upcomingData, selectedChains, searchQuery]);

  const isLoading =
    activeTab === "live"
      ? liveLoading
      : activeTab === "upcoming"
        ? upcomingLoading
        : false;

  // Calculate stats
  const stats = useMemo(() => {
    if (activeTab === "history") {
      const totalClaimed = mockClaimHistory.length;
      const totalValue = mockClaimHistory.reduce(
        (sum, r) => sum + (r.currentValue || r.totalValue),
        0,
      );
      const totalProfit = mockClaimHistory.reduce(
        (sum, r) => sum + ((r.currentValue || r.totalValue) - r.totalValue),
        0,
      );
      return { count: totalClaimed, totalValue, totalProfit };
    } else {
      const count = filteredData.length;
      const totalValue = filteredData.reduce(
        (sum, item) => sum + ((item as Airdrop).estimatedValue || 0),
        0,
      );
      return { count, totalValue, totalProfit: 0 };
    }
  }, [activeTab, filteredData]);

  // Memoized callbacks
  const handleAirdropClick = useCallback((airdrop: Airdrop) => {
    setSelectedAirdrop(airdrop);
  }, []);

  const handleChainToggle = useCallback((chain: string, checked: boolean) => {
    if (checked) {
      setSelectedChains((prev) => [...prev, chain]);
    } else {
      setSelectedChains((prev) => prev.filter((c) => c !== chain));
    }
  }, []);

  // Columns for live/upcoming airdrops (memoized)
  const airdropColumns: ColumnDef<Airdrop>[] = useMemo(
    () => [
      // 1. โปรเจค (ไม่มีรูป, เป็นลิงก์)
      {
        accessorKey: "projectName",
        header: "โปรเจค",
        cell: ({ row }) => {
          const airdrop = row.original;
          const contractLink = airdrop.contractAddress
            ? `https://debot.ai/token/${airdrop.chain.toLowerCase()}/${airdrop.contractAddress}`
            : "#";

          return (
            <div className="min-w-0">
              <a
                href={contractLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors truncate block"
                onClick={(e) => !airdrop.contractAddress && e.preventDefault()}
              >
                {airdrop.projectName}
              </a>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{airdrop.symbol}</span>
                <Badge
                  variant="outline"
                  className={`text-xs h-4 px-1.5 ${chainColors[airdrop.chain]}`}
                >
                  {airdrop.chain}
                </Badge>
              </div>
            </div>
          );
        },
      },
      // 2. คะแนนที่ต้องการ
      {
        accessorKey: "requiredPoints",
        header: "คะแนนที่ต้องการ",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div>
              <div className="font-semibold text-amber-400">
                {airdrop.requiredPoints || 0} pts
              </div>
              {airdrop.deductPoints > 0 && (
                <div className="text-xs text-red-400">
                  -{airdrop.deductPoints} pts
                </div>
              )}
            </div>
          );
        },
      },
      // 3. ประเภท
      {
        accessorKey: "type",
        header: "ประเภท",
        cell: ({ row }) => {
          const airdrop = row.original;
          const typeColors = {
            TGE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            PreTGE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            Airdrop: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          };

          return (
            <Badge
              variant="outline"
              className={`text-xs ${typeColors[airdrop.type] || typeColors.Airdrop}`}
            >
              {airdrop.type || "Airdrop"}
            </Badge>
          );
        },
      },
      // 4. จำนวน
      {
        accessorKey: "airdropAmount",
        header: "จำนวน",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div>
              <div className="font-semibold text-primary">
                {airdrop.airdropAmount}
              </div>
              {airdrop.estimatedValue && (
                <div className="text-xs text-muted-foreground">
                  ≈ ${airdrop.estimatedValue.toLocaleString()}
                </div>
              )}
            </div>
          );
        },
      },
      // 5. เวลา
      {
        accessorKey: activeTab === "live" ? "claimEndDate" : "claimStartDate",
        header: activeTab === "live" ? "เวลาที่เหลือ" : "เริ่มใน",
        cell: ({ row }) => {
          const airdrop = row.original;
          const targetDate =
            activeTab === "live"
              ? airdrop.claimEndDate
              : airdrop.claimStartDate;

          if (!targetDate)
            return <span className="text-xs text-muted-foreground">TBA</span>;

          const timeText = formatDistanceToNow(new Date(targetDate), {
            locale: th,
            addSuffix: true,
          });
          const dateText = format(new Date(targetDate), "dd MMM", {
            locale: th,
          });

          return (
            <div>
              <div
                className={`font-semibold ${activeTab === "live" ? "text-red-400" : "text-cyan-400"}`}
              >
                {timeText}
              </div>
              <div className="text-xs text-muted-foreground">{dateText}</div>
            </div>
          );
        },
      },
      // 6. Actions
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sendAirdropAlert({
                    name: airdrop.projectName,
                    symbol: airdrop.symbol,
                    chain: airdrop.chain,
                    status: airdrop.status,
                    claimStartDate: airdrop.claimStartDate
                      ? new Date(airdrop.claimStartDate)
                      : undefined,
                    claimEndDate: airdrop.claimEndDate
                      ? new Date(airdrop.claimEndDate)
                      : undefined,
                    estimatedValue: airdrop.estimatedValue || undefined,
                    airdropAmount: airdrop.airdropAmount,
                    requirements: airdrop.requirements,
                    requiredPoints: airdrop.requiredPoints,
                    deductPoints: airdrop.deductPoints,
                    contractAddress: airdrop.contractAddress,
                  });
                }}
                className="h-8 text-cyan-500 hover:text-cyan-400"
                disabled={isSendingTelegram}
                title="ส่งแจ้งเตือนไป Telegram"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAirdropClick(airdrop)}
                className="h-8"
                title="ดูรายละเอียด"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleAirdropClick, activeTab, isSendingTelegram, sendAirdropAlert],
  );

  // Columns for history (memoized)
  const historyColumns: ColumnDef<ClaimRecord>[] = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: "โปรเจค",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="min-w-0">
              <div className="font-semibold">{record.projectName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{record.symbol}</span>
                <Badge
                  variant="outline"
                  className={`text-xs h-4 px-1.5 ${chainColors[record.chain]}`}
                >
                  {record.chain}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amountReceived",
        header: "ที่ได้รับ",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div>
              <div className="font-semibold">{record.amountReceived}</div>
              <div className="text-xs text-muted-foreground">
                แต้ม: {record.pointsUsed}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "totalValue",
        header: "มูลค่าเคลม",
        cell: ({ row }) => (
          <div className="font-semibold">${row.getValue("totalValue")}</div>
        ),
      },
      {
        accessorKey: "currentValue",
        header: "มูลค่าปัจจุบัน",
        cell: ({ row }) => {
          const record = row.original;
          const current = record.currentValue || record.totalValue;
          const profit = current - record.totalValue;
          const profitPercent = ((profit / record.totalValue) * 100).toFixed(1);

          return (
            <div>
              <div className="font-semibold text-emerald-400">${current}</div>
              <div
                className={`text-xs ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {profit >= 0 ? "+" : ""}
                {profitPercent}%
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "claimedAt",
        header: "วันที่",
        cell: ({ row }) => {
          const date = new Date(row.getValue("claimedAt"));
          return (
            <div>
              <div className="font-medium">
                {format(date, "dd MMM", { locale: th })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(date, "HH:mm", { locale: th })}
              </div>
            </div>
          );
        },
      },
    ],
    [],
  );

  // Table instances
  const airdropTable = useReactTable({
    data: filteredData as Airdrop[],
    columns: airdropColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const historyTable = useReactTable({
    data: filteredData as ClaimRecord[],
    columns: historyColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const table = activeTab === "history" ? historyTable : airdropTable;

  // Available chains
  const availableChains = useMemo(() => {
    const chains = new Set<string>();
    const data =
      activeTab === "history"
        ? mockClaimHistory
        : activeTab === "upcoming"
          ? upcomingData || []
          : liveData || [];

    data.forEach((item) => {
      if (item.chain) chains.add(item.chain);
    });
    return Array.from(chains);
  }, [activeTab, liveData, upcomingData]);

  // Clear all filters (memoized)
  const clearFilters = useCallback(() => {
    setSelectedChains([]);
    setSearchQuery("");
  }, []);

  const hasFilters = selectedChains.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6 relative">
      {/* Particle Background */}
      <ParticleEffect count={30} className="opacity-40" />

      {/* Header with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/10 p-8 border-2 border-primary/30 shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-10 h-10 text-primary drop-shadow-lg" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-purple-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                  Binance Alpha Airdrops
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track, manage and get notified about your airdrops
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              ทดสอบ Telegram
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {activeTab === "history" ? "จำนวนที่เคลม" : "จำนวนทั้งหมด"}
                  </div>
                  <div className="text-3xl font-bold">{stats.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    โปรเจค
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {activeTab === "history" ? "มูลค่าปัจจุบัน" : "มูลค่ารวม"}
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${stats.totalValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">USD</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20 hover:border-cyan-500/40 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {activeTab === "history" ? "กำไร/ขาดทุน" : "สถานะ"}
                  </div>
                  {activeTab === "history" ? (
                    <>
                      <div
                        className={`text-3xl font-bold ${stats.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {stats.totalProfit >= 0 ? "+" : ""}$
                        {stats.totalProfit.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ทั้งหมด
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-cyan-400">
                        {activeTab === "live" ? "LIVE" : "UPCOMING"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activeTab === "live" ? "เปิดเคลมแล้ว" : "กำลังจะมา"}
                      </div>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "live" | "upcoming" | "history")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>เปิดเคลม</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>กำลังมา</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>ประวัติ</span>
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาโปรเจค หรือ สัญลักษณ์..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {availableChains.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Chain
                        {selectedChains.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 px-1.5"
                          >
                            {selectedChains.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {availableChains.map((chain) => (
                        <DropdownMenuCheckboxItem
                          key={chain}
                          checked={selectedChains.includes(chain)}
                          onCheckedChange={(checked) =>
                            handleChainToggle(chain, checked)
                          }
                        >
                          {chain}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Active Filters */}
              {hasFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">กรอง:</span>
                  {selectedChains.map((chain) => (
                    <Badge key={chain} variant="secondary" className="gap-1">
                      {chain}
                      <button
                        onClick={() =>
                          setSelectedChains(
                            selectedChains.filter((c) => c !== chain),
                          )
                        }
                        className="hover:bg-background/20 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      ค้นหา: {searchQuery}
                      <button
                        onClick={() => setSearchQuery("")}
                        className="hover:bg-background/20 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 text-xs"
                  >
                    ล้างทั้งหมด
                  </Button>
                </div>
              )}
            </div>

            {/* Table Content */}
            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className="bg-muted/50"
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder ? null : (
                                  <div
                                    className={
                                      header.column.getCanSort()
                                        ? "flex items-center gap-2 cursor-pointer select-none hover:text-foreground"
                                        : ""
                                    }
                                    onClick={header.column.getToggleSortingHandler()}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header as never,
                                      header.getContext() as never,
                                    )}
                                    {header.column.getCanSort() && (
                                      <span className="text-muted-foreground">
                                        {{
                                          asc: (
                                            <ChevronUp className="w-4 h-4" />
                                          ),
                                          desc: (
                                            <ChevronDown className="w-4 h-4" />
                                          ),
                                        }[
                                          header.column.getIsSorted() as string
                                        ] ?? (
                                          <ChevronsUpDown className="w-4 h-4" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row, index) => (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: index * 0.05,
                                duration: 0.3,
                              }}
                              className="border-b transition-all hover:bg-muted/50 hover:shadow-lg group cursor-pointer"
                              whileHover={{ scale: 1.01 }}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell
                                  key={cell.id}
                                  className="group-hover:text-foreground transition-colors"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell as never,
                                    cell.getContext() as never,
                                  )}
                                </TableCell>
                              ))}
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={table.getAllColumns().length}
                              className="h-32"
                            >
                              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                <Trophy className="w-16 h-16 opacity-20" />
                                <div className="text-center">
                                  <p className="font-medium">ไม่พบข้อมูล</p>
                                  <p className="text-sm">
                                    {hasFilters
                                      ? "ลองปรับเปลี่ยนตัวกรอง"
                                      : "ยังไม่มีข้อมูล"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {table.getPageCount() > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        แสดง{" "}
                        {table.getState().pagination.pageIndex *
                          table.getState().pagination.pageSize +
                          1}{" "}
                        ถึง{" "}
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) *
                            table.getState().pagination.pageSize,
                          table.getFilteredRowModel().rows.length,
                        )}{" "}
                        จาก {table.getFilteredRowModel().rows.length} รายการ
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          ก่อนหน้า
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedAirdrop}
        onOpenChange={() => setSelectedAirdrop(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {selectedAirdrop?.projectName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <span className="text-lg">{selectedAirdrop?.symbol}</span>
                {selectedAirdrop && (
                  <Badge
                    variant="outline"
                    className={chainColors[selectedAirdrop.chain]}
                  >
                    {selectedAirdrop.chain}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          {selectedAirdrop && (
            <div className="space-y-6 mt-4">
              {/* Description */}
              {selectedAirdrop.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    คำอธิบาย
                  </h4>
                  <p className="text-sm">{selectedAirdrop.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      จำนวน Airdrop
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {selectedAirdrop.airdropAmount}
                    </div>
                    {selectedAirdrop.estimatedValue && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ ${selectedAirdrop.estimatedValue.toLocaleString()} USD
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedAirdrop.claimStartDate && (
                  <Card className="bg-cyan-500/5 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        {selectedAirdrop.status === "live"
                          ? "สิ้นสุด"
                          : "เริ่ม"}
                      </div>
                      <div className="text-2xl font-bold">
                        {formatDistanceToNow(
                          new Date(
                            selectedAirdrop.status === "live"
                              ? selectedAirdrop.claimEndDate ||
                                selectedAirdrop.claimStartDate
                              : selectedAirdrop.claimStartDate,
                          ),
                          { locale: th, addSuffix: true },
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(
                            selectedAirdrop.status === "live"
                              ? selectedAirdrop.claimEndDate ||
                                selectedAirdrop.claimStartDate
                              : selectedAirdrop.claimStartDate,
                          ),
                          "dd MMM yyyy • HH:mm",
                          { locale: th },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Requirements */}
              {selectedAirdrop.requirements &&
                selectedAirdrop.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                      ความต้องการ
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAirdrop.requirements.map((req, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-sm py-1"
                        >
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ShimmerButton
                  className="w-full py-6 text-lg"
                  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  onClick={() => {
                    if (selectedAirdrop) {
                      sendAirdropAlert({
                        name: selectedAirdrop.projectName,
                        symbol: selectedAirdrop.symbol,
                        chain: selectedAirdrop.chain,
                        status: selectedAirdrop.status,
                        claimStartDate: selectedAirdrop.claimStartDate
                          ? new Date(selectedAirdrop.claimStartDate)
                          : undefined,
                        claimEndDate: selectedAirdrop.claimEndDate
                          ? new Date(selectedAirdrop.claimEndDate)
                          : undefined,
                        estimatedValue:
                          selectedAirdrop.estimatedValue || undefined,
                        airdropAmount: selectedAirdrop.airdropAmount,
                        requirements: selectedAirdrop.requirements,
                      });
                    }
                  }}
                  disabled={isSendingTelegram}
                >
                  <Send className="w-5 h-5" />
                  ส่ง Telegram
                </ShimmerButton>

                <Button
                  className="w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 hover:opacity-90 text-white font-semibold py-6 text-lg"
                  onClick={() =>
                    window.open("https://www.binance.com/en/alpha", "_blank")
                  }
                >
                  {selectedAirdrop.status === "live"
                    ? "🎁 เคลมเลย"
                    : "⏰ ดูรายละเอียด"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
