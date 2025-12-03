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
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Send,
  Bell,
  Zap,
  Gift,
  Timer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  formatDistanceToNow,
  format,
  isToday,
  addDays,
  isBefore,
  isAfter,
} from "date-fns";
import { th } from "date-fns/locale";

// UI Components
import { Card, CardHeader } from "@/components/ui/card";
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

// Premium MagicUI Components
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam, CornerGlow } from "@/components/ui/border-beam";
import {
  ShineBorder,
  AnimatedGradientBorder,
} from "@/components/ui/shine-border";
import { NumberTicker } from "@/components/ui/number-ticker";
import { GradientText } from "@/components/ui/animated-text";
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
  type: "TGE" | "PreTGE" | "Airdrop";
  contractAddress?: string;
  txHash?: string;
}

// Chain colors with premium styling
const chainColors: Record<string, string> = {
  BSC: "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 border-yellow-500/40",
  ETH: "bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/40",
  Polygon:
    "bg-gradient-to-r from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/40",
  Solana:
    "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/40",
  Arbitrum:
    "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/40",
  Base: "bg-gradient-to-r from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/40",
};

// Type badge colors
const typeColors: Record<string, string> = {
  TGE: "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/40",
  PreTGE:
    "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/40",
  Airdrop:
    "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/40",
};

export function AirdropsTable() {
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "history">(
    "today",
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedAirdrop, setSelectedAirdrop] = useState<Airdrop | null>(null);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLastRefresh] = useState<Date>(new Date());

  const {
    isLoading: isSendingTelegram,
    sendAirdropAlert,
    testConnection,
  } = useTelegram();

  // Fetch all claimable airdrops
  const {
    data: claimableData,
    isLoading: claimableLoading,
    refetch: refetchClaimable,
  } = useQuery({
    queryKey: ["airdrops", "claimable"],
    queryFn: async () => {
      const res = await fetch(
        "/api/binance/alpha/airdrops?status=claimable&limit=50",
      );
      const json = await res.json();
      return json.data as Airdrop[];
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: false,
    staleTime: 9000,
  });

  // Fetch upcoming airdrops
  const {
    data: upcomingRawData,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ["airdrops", "upcoming"],
    queryFn: async () => {
      const res = await fetch(
        "/api/binance/alpha/airdrops?status=upcoming&limit=50",
      );
      const json = await res.json();
      return json.data as Airdrop[];
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: false,
    staleTime: 9000,
  });

  // Fetch claim history from database
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["airdrops", "history"],
    queryFn: async () => {
      const res = await fetch(
        "/api/binance/alpha/airdrops?status=ended&limit=50",
      );
      const json = await res.json();
      // Transform to ClaimRecord format
      const records: ClaimRecord[] = (json.data || []).map(
        (airdrop: Airdrop) => ({
          id: airdrop.id,
          projectName: airdrop.projectName,
          symbol: airdrop.symbol,
          logo: airdrop.logo || "🎁",
          chain: airdrop.chain,
          pointsUsed: airdrop.deductPoints || 0,
          amountReceived: airdrop.airdropAmount,
          pricePerToken: airdrop.estimatedValue
            ? airdrop.estimatedValue /
              parseFloat(airdrop.airdropAmount.replace(/[^0-9.]/g, "") || "1")
            : 0,
          totalValue: airdrop.estimatedValue || 0,
          claimedAt:
            airdrop.claimEndDate ||
            airdrop.claimStartDate ||
            new Date().toISOString(),
          currentValue: airdrop.estimatedValue,
          type: airdrop.type,
          contractAddress: airdrop.contractAddress,
        }),
      );
      return records;
    },
    refetchInterval: 30000, // History refreshes every 30 seconds (less frequent)
    refetchOnWindowFocus: false,
    staleTime: 25000,
  });

  // Split claimable data into today's and upcoming claims
  const todayData = useMemo(() => {
    if (!claimableData) return [];
    const now = new Date();

    return claimableData.filter((airdrop) => {
      if (!airdrop.claimStartDate) return true; // If no start date, assume it's available now
      const startDate = new Date(airdrop.claimStartDate);
      // Show if claim has started (before now) and hasn't ended yet
      return isBefore(startDate, now) || isToday(startDate);
    });
  }, [claimableData]);

  const upcomingData = useMemo(() => {
    if (!upcomingRawData && !claimableData) return [];
    const now = new Date();

    // Combine upcoming and claimable that haven't started yet
    const upcoming = [...(upcomingRawData || [])];

    // Also add claimable items that haven't started yet
    if (claimableData) {
      claimableData.forEach((airdrop) => {
        if (airdrop.claimStartDate) {
          const startDate = new Date(airdrop.claimStartDate);
          if (isAfter(startDate, now) && !isToday(startDate)) {
            // Avoid duplicates
            if (!upcoming.find((u) => u.id === airdrop.id)) {
              upcoming.push(airdrop);
            }
          }
        }
      });
    }

    // Sort by claim start date
    return upcoming.sort((a, b) => {
      const dateA = a.claimStartDate
        ? new Date(a.claimStartDate).getTime()
        : Infinity;
      const dateB = b.claimStartDate
        ? new Date(b.claimStartDate).getTime()
        : Infinity;
      return dateA - dateB;
    });
  }, [upcomingRawData, claimableData]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let data: (Airdrop | ClaimRecord)[] = [];

    if (activeTab === "history") {
      data = historyData || [];
    } else if (activeTab === "upcoming") {
      data = upcomingData || [];
    } else {
      data = todayData || [];
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
  }, [
    activeTab,
    todayData,
    upcomingData,
    historyData,
    selectedChains,
    searchQuery,
  ]);

  const isLoading =
    activeTab === "today"
      ? claimableLoading
      : activeTab === "upcoming"
        ? upcomingLoading
        : historyLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const todayCount = todayData.length;
    const upcomingCount = upcomingData.length;
    const historyCount = historyData?.length || 0;

    const todayValue = todayData.reduce(
      (sum, item) => sum + (item.estimatedValue || 0),
      0,
    );
    const historyValue =
      historyData?.reduce(
        (sum, item) => sum + (item.currentValue || item.totalValue),
        0,
      ) || 0;

    return {
      todayCount,
      upcomingCount,
      historyCount,
      todayValue,
      historyValue,
      totalProjects: todayCount + upcomingCount,
    };
  }, [todayData, upcomingData, historyData]);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    await Promise.all([
      refetchClaimable(),
      refetchUpcoming(),
      refetchHistory(),
    ]);
  }, [refetchClaimable, refetchUpcoming, refetchHistory]);

  // Sync from external source
  const handleSync = useCallback(async () => {
    try {
      const res = await fetch("/api/binance/alpha/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await handleRefresh();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }, [handleRefresh]);

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

  // Columns for today/upcoming airdrops
  const airdropColumns: ColumnDef<Airdrop>[] = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: "โปรเจค",
        cell: ({ row }) => {
          const airdrop = row.original;
          const contractLink = airdrop.contractAddress
            ? `https://debot.ai/token/${airdrop.chain.toLowerCase()}/${airdrop.contractAddress}`
            : "#";

          return (
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg">
                {airdrop.logo || "🎁"}
              </div>
              <div>
                <a
                  href={contractLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
                  onClick={(e) =>
                    !airdrop.contractAddress && e.preventDefault()
                  }
                >
                  {airdrop.projectName}
                </a>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="font-medium">{airdrop.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 ${chainColors[airdrop.chain] || chainColors.BSC}`}
                  >
                    {airdrop.chain}
                  </Badge>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "requiredPoints",
        header: "คะแนน",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div className="text-center">
              <div className="font-bold text-amber-400 text-lg">
                {airdrop.requiredPoints || 0}
              </div>
              {airdrop.deductPoints > 0 && (
                <div className="text-xs text-red-400/80 font-medium">
                  -{airdrop.deductPoints} หักแต้ม
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "ประเภท",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <Badge
              variant="outline"
              className={`text-xs font-medium ${typeColors[airdrop.type] || typeColors.Airdrop}`}
            >
              {airdrop.type || "Airdrop"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "airdropAmount",
        header: "จำนวน",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div>
              <div className="font-semibold">{airdrop.airdropAmount}</div>
              {airdrop.estimatedValue && airdrop.estimatedValue > 0 && (
                <div className="text-xs text-emerald-400 font-medium">
                  ≈ ${airdrop.estimatedValue.toLocaleString()}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: activeTab === "today" ? "claimEndDate" : "claimStartDate",
        header: activeTab === "today" ? "เหลือเวลา" : "เริ่มใน",
        cell: ({ row }) => {
          const airdrop = row.original;
          const targetDate =
            activeTab === "today"
              ? airdrop.claimEndDate
              : airdrop.claimStartDate;

          if (!targetDate)
            return <span className="text-xs text-muted-foreground">TBA</span>;

          const date = new Date(targetDate);
          const timeText = formatDistanceToNow(date, {
            locale: th,
            addSuffix: true,
          });
          const dateText = format(date, "dd MMM HH:mm", { locale: th });
          const isExpiringSoon =
            activeTab === "today" && isBefore(date, addDays(new Date(), 1));

          return (
            <div>
              <div
                className={`font-semibold ${isExpiringSoon ? "text-red-400 animate-pulse" : activeTab === "today" ? "text-orange-400" : "text-cyan-400"}`}
              >
                {timeText}
              </div>
              <div className="text-xs text-muted-foreground">{dateText}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
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
                className="h-8 w-8 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                disabled={isSendingTelegram}
                title="ส่งแจ้งเตือนไป Telegram"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAirdropClick(airdrop)}
                className="h-8 w-8 hover:bg-primary/10"
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

  // Columns for history
  const historyColumns: ColumnDef<ClaimRecord>[] = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: "โปรเจค",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold">{record.projectName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{record.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 ${chainColors[record.chain] || chainColors.BSC}`}
                  >
                    {record.chain}
                  </Badge>
                </div>
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
                ใช้ {record.pointsUsed} แต้ม
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "ประเภท",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <Badge
              variant="outline"
              className={`text-xs ${typeColors[record.type] || typeColors.Airdrop}`}
            >
              {record.type || "Airdrop"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalValue",
        header: "มูลค่า",
        cell: ({ row }) => {
          const record = row.original;
          const current = record.currentValue || record.totalValue;
          const profit = current - record.totalValue;
          const profitPercent =
            record.totalValue > 0
              ? ((profit / record.totalValue) * 100).toFixed(1)
              : "0";

          return (
            <div>
              <div className="font-semibold">${current.toFixed(2)}</div>
              {profit !== 0 && (
                <div
                  className={`text-xs font-medium ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {profit >= 0 ? "+" : ""}
                  {profitPercent}%
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "claimedAt",
        header: "วันที่เคลม",
        cell: ({ row }) => {
          const date = new Date(row.getValue("claimedAt"));
          return (
            <div>
              <div className="font-medium">
                {format(date, "dd MMM yyyy", { locale: th })}
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
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
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
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  const table = activeTab === "history" ? historyTable : airdropTable;

  // Available chains
  const availableChains = useMemo(() => {
    const chains = new Set<string>();
    const data =
      activeTab === "history"
        ? historyData || []
        : activeTab === "upcoming"
          ? upcomingData
          : todayData;
    data.forEach((item) => {
      if (item.chain) chains.add(item.chain);
    });
    return Array.from(chains);
  }, [activeTab, todayData, upcomingData, historyData]);

  const clearFilters = useCallback(() => {
    setSelectedChains([]);
    setSearchQuery("");
  }, []);

  const hasFilters = selectedChains.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        <ShineBorder
          className="p-8 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90"
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          borderWidth={2}
          duration={8}
          borderRadius="1.5rem"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30"
                >
                  <Gift className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black">
                    <GradientText
                      colors={["#667eea", "#764ba2", "#f093fb", "#667eea"]}
                    >
                      Binance Alpha Airdrops
                    </GradientText>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    ติดตามและเคลม Airdrop จาก Binance Alpha ได้ที่นี่
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  className="gap-2 hidden sm:flex"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Telegram</span>
                </Button>
              </div>
            </div>
          </div>
          <CornerGlow
            position="top-right"
            color="rgba(102, 126, 234, 0.4)"
            size={200}
          />
          <CornerGlow
            position="bottom-left"
            color="rgba(168, 85, 247, 0.3)"
            size={150}
          />
        </ShineBorder>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MagicCard className="p-5" gradientColor="rgba(239, 68, 68, 0.15)">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  เคลมได้วันนี้
                </div>
                <div className="text-3xl font-bold text-red-400">
                  <NumberTicker value={stats.todayCount} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  มูลค่า ~${stats.todayValue.toLocaleString()}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Timer className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#ef4444"
              colorTo="#f97316"
            />
          </MagicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MagicCard className="p-5" gradientColor="rgba(34, 211, 238, 0.15)">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  กำลังจะมา
                </div>
                <div className="text-3xl font-bold text-cyan-400">
                  <NumberTicker value={stats.upcomingCount} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  โปรเจคที่รอเคลม
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#22d3ee"
              colorTo="#3b82f6"
            />
          </MagicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MagicCard className="p-5" gradientColor="rgba(16, 185, 129, 0.15)">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  เคลมแล้ว
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  <NumberTicker value={stats.historyCount} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  มูลค่ารวม ~${stats.historyValue.toLocaleString()}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#10b981"
              colorTo="#22c55e"
            />
          </MagicCard>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <AnimatedGradientBorder
        gradientColors={[
          "rgba(102, 126, 234, 0.5)",
          "rgba(168, 85, 247, 0.5)",
          "rgba(236, 72, 153, 0.5)",
          "rgba(102, 126, 234, 0.5)",
        ]}
        borderWidth={1}
        duration={6}
      >
        <Card className="bg-background/95 backdrop-blur-sm border-0">
          <CardHeader className="pb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "today" | "upcoming" | "history")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
                <TabsTrigger
                  value="today"
                  className="flex items-center gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">เคลมวันนี้</span>
                  <span className="sm:hidden">วันนี้</span>
                  {stats.todayCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-red-500/20 text-red-400"
                    >
                      {stats.todayCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">กำลังจะมา</span>
                  <span className="sm:hidden">จะมา</span>
                  {stats.upcomingCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-cyan-500/20 text-cyan-400"
                    >
                      {stats.upcomingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">ประวัติ</span>
                  <span className="sm:hidden">ประวัติ</span>
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
                      className="pl-9 bg-muted/30"
                    />
                  </div>

                  {availableChains.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-muted/30">
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

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    className="bg-muted/30"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Active Filters */}
                <AnimatePresence>
                  {hasFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <span className="text-sm text-muted-foreground">
                        กรอง:
                      </span>
                      {selectedChains.map((chain) => (
                        <Badge
                          key={chain}
                          variant="secondary"
                          className="gap-1"
                        >
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
                          &ldquo;{searchQuery}&rdquo;
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Table Content */}
              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border overflow-hidden bg-muted/20">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                              key={headerGroup.id}
                              className="bg-muted/50 hover:bg-muted/50"
                            >
                              {headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  className="font-semibold"
                                >
                                  {header.isPlaceholder ? null : (
                                    <div
                                      className={
                                        header.column.getCanSort()
                                          ? "flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors"
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
                                            <ChevronsUpDown className="w-4 h-4 opacity-50" />
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
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: index * 0.03,
                                  duration: 0.2,
                                }}
                                className="border-b border-muted/30 transition-all hover:bg-muted/30 group"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id} className="py-4">
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
                                className="h-40"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center gap-3 text-muted-foreground"
                                >
                                  {activeTab === "today" ? (
                                    <>
                                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8 opacity-50" />
                                      </div>
                                      <div className="text-center">
                                        <p className="font-medium">
                                          ไม่มี Airdrop ที่เคลมได้วันนี้
                                        </p>
                                        <p className="text-sm">
                                          ลองดูแท็บ &ldquo;กำลังจะมา&rdquo;
                                          สำหรับ Airdrop ที่กำลังจะเปิด
                                        </p>
                                      </div>
                                    </>
                                  ) : activeTab === "upcoming" ? (
                                    <>
                                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Calendar className="w-8 h-8 opacity-50" />
                                      </div>
                                      <div className="text-center">
                                        <p className="font-medium">
                                          ยังไม่มี Airdrop ที่กำลังจะมา
                                        </p>
                                        <p className="text-sm">
                                          กดปุ่ม Sync เพื่ออัพเดทข้อมูลล่าสุด
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                        <History className="w-8 h-8 opacity-50" />
                                      </div>
                                      <div className="text-center">
                                        <p className="font-medium">
                                          ยังไม่มีประวัติการเคลม
                                        </p>
                                        <p className="text-sm">
                                          Airdrop ที่เคลมแล้วจะแสดงที่นี่
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {table.getPageCount() > 1 && (
                      <div className="flex items-center justify-between mt-4 px-2">
                        <div className="text-sm text-muted-foreground">
                          หน้า {table.getState().pagination.pageIndex + 1} จาก{" "}
                          {table.getPageCount()} (
                          {table.getFilteredRowModel().rows.length} รายการ)
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
      </AnimatedGradientBorder>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedAirdrop}
        onOpenChange={() => setSelectedAirdrop(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl">
                {selectedAirdrop?.logo || "🎁"}
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  {selectedAirdrop?.projectName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-medium">
                    {selectedAirdrop?.symbol}
                  </span>
                  {selectedAirdrop && (
                    <>
                      <Badge
                        variant="outline"
                        className={
                          chainColors[selectedAirdrop.chain] || chainColors.BSC
                        }
                      >
                        {selectedAirdrop.chain}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          typeColors[selectedAirdrop.type] || typeColors.Airdrop
                        }
                      >
                        {selectedAirdrop.type}
                      </Badge>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAirdrop && (
            <div className="space-y-6 mt-4">
              {selectedAirdrop.description && (
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    คำอธิบาย
                  </h4>
                  <p className="text-sm">{selectedAirdrop.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <MagicCard className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    จำนวน Airdrop
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    {selectedAirdrop.airdropAmount}
                  </div>
                  {selectedAirdrop.estimatedValue && (
                    <div className="text-sm text-emerald-400 mt-1">
                      ≈ ${selectedAirdrop.estimatedValue.toLocaleString()} USD
                    </div>
                  )}
                </MagicCard>

                <MagicCard className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    คะแนนที่ต้องการ
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {selectedAirdrop.requiredPoints || 0}
                  </div>
                  {selectedAirdrop.deductPoints > 0 && (
                    <div className="text-sm text-red-400 mt-1">
                      หักแต้ม -{selectedAirdrop.deductPoints}
                    </div>
                  )}
                </MagicCard>
              </div>

              {selectedAirdrop.claimStartDate && (
                <div className="grid grid-cols-2 gap-4">
                  <MagicCard className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      เริ่มเคลม
                    </div>
                    <div className="font-bold">
                      {format(
                        new Date(selectedAirdrop.claimStartDate),
                        "dd MMM yyyy HH:mm",
                        { locale: th },
                      )}
                    </div>
                    <div className="text-sm text-cyan-400 mt-1">
                      {formatDistanceToNow(
                        new Date(selectedAirdrop.claimStartDate),
                        { locale: th, addSuffix: true },
                      )}
                    </div>
                  </MagicCard>

                  {selectedAirdrop.claimEndDate && (
                    <MagicCard className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        สิ้นสุด
                      </div>
                      <div className="font-bold">
                        {format(
                          new Date(selectedAirdrop.claimEndDate),
                          "dd MMM yyyy HH:mm",
                          { locale: th },
                        )}
                      </div>
                      <div className="text-sm text-orange-400 mt-1">
                        {formatDistanceToNow(
                          new Date(selectedAirdrop.claimEndDate),
                          { locale: th, addSuffix: true },
                        )}
                      </div>
                    </MagicCard>
                  )}
                </div>
              )}

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
                          className="text-sm py-1.5 px-3"
                        >
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <ShimmerButton
                  className="w-full py-4 text-base"
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
                        requiredPoints: selectedAirdrop.requiredPoints,
                        deductPoints: selectedAirdrop.deductPoints,
                        contractAddress: selectedAirdrop.contractAddress,
                      });
                    }
                  }}
                  disabled={isSendingTelegram}
                >
                  <Send className="w-5 h-5 mr-2" />
                  ส่ง Telegram
                </ShimmerButton>

                <Button
                  className="w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 hover:opacity-90 text-white font-semibold py-4 text-base"
                  onClick={() =>
                    window.open("https://www.binance.com/en/alpha", "_blank")
                  }
                >
                  {selectedAirdrop.status === "claimable"
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
