"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile, useMounted } from "@/lib/hooks/use-mobile";
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
  Trophy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  TrendingUp,
  X,
  Send,
  Zap,
  Gift,
  RefreshCw,
  Sparkles,
  Coins,
  Clock,
  ArrowUpRight,
  Flame,
  Target,
  CalendarDays,
  CalendarClock,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { format } from "date-fns/format";
import { addDays } from "date-fns/addDays";
import { isBefore } from "date-fns/isBefore";

// UI Components
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { useTelegram } from "@/lib/hooks/use-telegram";
import { dedupeEventApiRows } from "@/lib/services/alpha/binance-event-pipeline";
import { useLanguage } from "@/lib/stores/language-store";
import {
  getDateFnsLocale,
  getDisplayDateByLanguage,
  getIntlLocale,
  isDateTodayByLanguage,
  isDateTomorrowByLanguage,
} from "@/lib/i18n/locale";
import { airdropsPageCopy } from "@/lib/i18n/route-copy";

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
  estimatedPrice?: number | null;
  estimatedValue: number | null;
  pointsText?: string | null;
  scheduleStatus?: string | null;
  score: number;
  slotText?: string | null;
  description?: string;
  website?: string;
  twitter?: string;
  type: "TGE" | "PRETGE" | "PRE_TGE" | "PreTGE" | "Airdrop" | "AIRDROP";
  requiredPoints: number;
  deductPoints: number;
  contractAddress: string;
  sourceUrl?: string | null;
  confidence?: number;
  listingTime?: string | null;
}

type ResponsiveAirdropsLayoutInput = {
  mounted: boolean;
  isMobileViewport: boolean;
};

export function getResponsiveAirdropsLayoutMode({
  mounted,
  isMobileViewport,
}: ResponsiveAirdropsLayoutInput): "pending" | "mobile" | "desktop" {
  if (!mounted) {
    return "pending";
  }

  return isMobileViewport ? "mobile" : "desktop";
}

// Chain colors with premium styling
const chainColors: Record<string, string> = {
  BSC: "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 border-yellow-500/40",
  ETH: "bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/40",
  Ethereum:
    "bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/40",
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
  PRETGE:
    "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/40",
  PRE_TGE:
    "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/40",
  Airdrop:
    "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/40",
  AIRDROP:
    "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/40",
};

const TELEGRAM_JOIN_URL = "https://t.me/binance_alphachi";

function parseNumericAmount(amount?: string | null): number | null {
  if (!amount) {
    return null;
  }

  const normalized = amount.trim();
  if (!normalized || /^Alpha Score:/i.test(normalized) || normalized === "TBA") {
    return null;
  }

  const parsed = Number.parseFloat(normalized.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getDisplayAmount(airdrop: Airdrop): string {
  const amountValue = parseNumericAmount(airdrop.airdropAmount);
  if (amountValue !== null) {
    return Number.isInteger(amountValue)
      ? amountValue.toString()
      : amountValue.toFixed(2).replace(/\.?0+$/, "");
  }

  return airdrop.airdropAmount || "-";
}

function getDisplayValue(airdrop: Airdrop): string | null {
  if (!airdrop.estimatedValue || airdrop.estimatedValue <= 0) {
    return null;
  }

  return `$${airdrop.estimatedValue.toFixed(1)}`;
}

function getDisplayTimeInfo(
  airdrop: Airdrop,
  activeTab: "today" | "upcoming" | "all",
  language: "th" | "en",
  copy: (typeof airdropsPageCopy)["en"],
): { main: string; secondary: string | null } {
  const locale = getDateFnsLocale(language);

  if (!airdrop.claimStartDate) {
    return { main: copy.tba, secondary: null };
  }

  const targetDate = new Date(airdrop.claimStartDate);
  const displayDate = getDisplayDateByLanguage(targetDate, language);
  const secondary = formatDistanceToNow(targetDate, {
    locale,
    addSuffix: true,
  });

  if (activeTab === "today") {
    return {
      main: format(displayDate, "HH:mm", { locale }),
      secondary,
    };
  }

  if (activeTab === "upcoming") {
    if (isDateTomorrowByLanguage(targetDate, language)) {
      return {
        main: `${copy.tomorrow} ${format(displayDate, "HH:mm", { locale })}`,
        secondary,
      };
    }

    return {
      main: format(displayDate, "M/d HH:mm", { locale }),
      secondary,
    };
  }

  return {
    main: format(displayDate, "dd MMM HH:mm", { locale }),
    secondary,
  };
}

function sortByClaimStartDesc(left: Airdrop, right: Airdrop): number {
  const leftTime = left.claimStartDate ? new Date(left.claimStartDate).getTime() : 0;
  const rightTime = right.claimStartDate
    ? new Date(right.claimStartDate).getTime()
    : 0;

  return rightTime - leftTime;
}

function sortByClaimStartAsc(left: Airdrop, right: Airdrop): number {
  const leftTime = left.claimStartDate ? new Date(left.claimStartDate).getTime() : 0;
  const rightTime = right.claimStartDate
    ? new Date(right.claimStartDate).getTime()
    : 0;

  return leftTime - rightTime;
}

function normalizeScheduleStatus(value?: string | null): string {
  return (value || "").toLowerCase();
}

function isEndedScheduleStatus(value?: string | null): boolean {
  const status = normalizeScheduleStatus(value);
  return status === "ended" || status === "cancelled";
}

function getClaimStartDate(airdrop: Airdrop): Date | null {
  if (!airdrop.claimStartDate) {
    return null;
  }

  const parsed = new Date(airdrop.claimStartDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isUpcomingScheduleAirdrop(
  airdrop: Airdrop,
  language: "th" | "en",
  now: Date = new Date(),
): boolean {
  const scheduleStatus = normalizeScheduleStatus(airdrop.scheduleStatus);
  if (!scheduleStatus || isEndedScheduleStatus(scheduleStatus)) {
    return false;
  }

  if (scheduleStatus === "upcoming") {
    return true;
  }

  const targetDate = getClaimStartDate(airdrop);
  if (!targetDate) {
    return false;
  }

  return (
    targetDate.getTime() > now.getTime() &&
    !isDateTodayByLanguage(targetDate, language)
  );
}

export function isTodayScheduleAirdrop(
  airdrop: Airdrop,
  language: "th" | "en",
): boolean {
  if (!airdrop.scheduleStatus || isEndedScheduleStatus(airdrop.scheduleStatus)) {
    return false;
  }

  const targetDate = getClaimStartDate(airdrop);
  return targetDate ? isDateTodayByLanguage(targetDate, language) : false;
}

export function isHistoricalScheduleAirdrop(
  airdrop: Airdrop,
  language: "th" | "en",
  now: Date = new Date(),
): boolean {
  if (!airdrop.scheduleStatus) {
    return true;
  }

  return (
    !isTodayScheduleAirdrop(airdrop, language) &&
    !isUpcomingScheduleAirdrop(airdrop, language, now)
  );
}

// Mobile Airdrop Card Component
interface MobileAirdropCardProps {
  airdrop: Airdrop;
  onClick: () => void;
  onSendAlert: () => void;
  isSendingTelegram: boolean;
  language: "th" | "en";
  copy: (typeof airdropsPageCopy)["en"];
}

function MobileAirdropCard({
  airdrop,
  onClick,
  onSendAlert,
  isSendingTelegram,
  language,
  copy,
}: MobileAirdropCardProps) {
  const locale = getDateFnsLocale(language);
  const targetDate = airdrop.claimStartDate
    ? new Date(airdrop.claimStartDate)
    : null;
  const displayTargetDate = targetDate
    ? getDisplayDateByLanguage(targetDate, language)
    : null;
  const isTodayDate = targetDate
    ? isDateTodayByLanguage(targetDate, language)
    : false;
  const isTomorrowDate = targetDate
    ? isDateTomorrowByLanguage(targetDate, language)
    : false;
  const isExpiringSoon =
    airdrop.claimEndDate &&
    isBefore(new Date(airdrop.claimEndDate), addDays(new Date(), 3));
  const contractLink = airdrop.contractAddress
    ? `https://bscscan.com/token/${airdrop.contractAddress}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-primary/15 bg-gradient-to-br from-card/95 via-card to-primary/5 p-4 shadow-lg"
      onClick={onClick}
    >
      {/* Project Header - Always Visible */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-primary/10">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center text-xl font-bold border border-primary/30 shadow-md">
            {airdrop.logo === "🎁" ? (
              <Sparkles className="w-6 h-6 text-primary" />
            ) : (
              <span className="text-primary">{airdrop.symbol.charAt(0)}</span>
            )}
          </div>
          {airdrop.type === "TGE" && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-card shadow-md">
              <Flame className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-foreground text-base truncate">
              {airdrop.projectName}
            </h3>
            {contractLink && (
              <a
                href={contractLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary font-medium">
              ${airdrop.symbol}
            </span>
            <Badge
              variant="outline"
              className={`${chainColors[airdrop.chain] || "bg-slate-500/20 text-slate-400 border-slate-500/40"} text-[10px] px-2 py-0.5`}
            >
              {airdrop.chain}
            </Badge>
            <Badge
              variant="outline"
              className={`${typeColors[airdrop.type] || typeColors["AIRDROP"]} text-[10px] px-2 py-0.5`}
            >
              {airdrop.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info Grid - 2 Columns */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Alpha Points */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground font-medium">
              {copy.alphaPoints}
            </span>
          </div>
          <div className="font-bold text-amber-400 text-lg">
            {airdrop.requiredPoints || 0}
            <span className="text-xs font-normal ml-1">{copy.pointsSuffix}</span>
          </div>
          {(airdrop.deductPoints ?? 0) > 0 && (
            <div className="text-xs text-red-400 mt-1 font-medium">
              {copy.totalDeducted}: -{airdrop.deductPoints} {copy.pointsSuffix}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="p-3 rounded-xl bg-muted/40 border border-primary/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              {copy.time}
            </span>
          </div>
          {targetDate ? (
            <>
              <div className="flex items-center gap-1 flex-wrap mb-1">
                {isTodayDate && (
                  <Badge
                    variant="outline"
                    className="h-5 px-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-semibold"
                  >
                    {copy.today}
                  </Badge>
                )}
                {isTomorrowDate && (
                  <Badge
                    variant="outline"
                    className="h-5 px-2 bg-blue-500/20 text-blue-400 border-blue-500/40 text-[10px] font-semibold"
                  >
                    {copy.tomorrow}
                  </Badge>
                )}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {displayTargetDate
                  ? format(displayTargetDate, "dd MMM HH:mm", { locale })
                  : "-"}
              </div>
              <div
                className={`text-xs mt-0.5 ${isExpiringSoon ? "text-red-400 font-medium" : "text-muted-foreground"}`}
              >
                {formatDistanceToNow(targetDate, {
                  locale,
                  addSuffix: true,
                })}
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSendAlert();
          }}
          disabled={isSendingTelegram}
          className="flex-1 h-10 text-sm gap-2 border-primary/30 hover:bg-primary/10 font-medium"
        >
          <Send className="w-4 h-4" />
          {copy.notify}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="h-10 px-4 text-sm gap-2 bg-primary/20 hover:bg-primary/30 text-primary font-medium"
        >
          <ArrowUpRight className="w-4 h-4" />
          {copy.viewMore}
        </Button>
      </div>
    </motion.div>
  );
}

export function AirdropsTable() {
  const mounted = useMounted();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();
  const copy = airdropsPageCopy[language];
  const telegramCtaPrimary = copy.telegramCtaPrimary.trim();
  const telegramCtaSecondary = copy.telegramCtaSecondary.trim();
  const telegramCtaAriaLabel = [telegramCtaPrimary, telegramCtaSecondary]
    .filter(Boolean)
    .join(" ");
  const dateLocale = getDateFnsLocale(language);
  const numberLocale = getIntlLocale(language);
  const responsiveLayoutMode = getResponsiveAirdropsLayoutMode({
    mounted,
    isMobileViewport,
  });
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">(
    "today",
  );
  const [airdropSorting, setAirdropSorting] = useState<SortingState>([]);
  const [airdropColumnFilters, setAirdropColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [selectedAirdrop, setSelectedAirdrop] = useState<Airdrop | null>(null);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLastRefresh] = useState<Date>(new Date());

  const {
    isLoading: isSendingTelegram,
    sendAirdropAlert,
  } = useTelegram();

  // Fetch all airdrops for "All" tab
  const {
    data: allAirdropsData,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ["airdrops", "all"],
    queryFn: async () => {
      const res = await fetch("/api/binance/alpha/airdrops?limit=500");
      const json = await res.json();
      return json.data as Airdrop[];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 55000,
  });

  // All airdrops data - sorted by claimStartDate descending (latest first)
  const allData = useMemo(() => {
    if (!allAirdropsData) return [];
    return [
      ...(dedupeEventApiRows(allAirdropsData as any) as Airdrop[]),
    ].sort(sortByClaimStartDesc);
  }, [allAirdropsData]);

  const hasScheduleBuckets = useMemo(
    () => allData.some((airdrop) => airdrop.scheduleStatus !== null),
    [allData],
  );

  const todayData = useMemo(() => {
    if (hasScheduleBuckets) {
      return allData
        .filter((airdrop) => isTodayScheduleAirdrop(airdrop, language))
        .sort(sortByClaimStartDesc);
    }

    return allData
      .filter(
        (airdrop) =>
          airdrop.status === "live" || airdrop.status === "claimable",
      )
      .sort(sortByClaimStartDesc);
  }, [allData, hasScheduleBuckets, language]);

  const futureData = useMemo(() => {
    if (hasScheduleBuckets) {
      return allData
        .filter((airdrop) => isUpcomingScheduleAirdrop(airdrop, language))
        .sort(sortByClaimStartAsc);
    }

    return allData
      .filter((airdrop) => airdrop.status === "upcoming")
      .sort(sortByClaimStartAsc);
  }, [allData, hasScheduleBuckets, language]);

  const historicalData = useMemo(() => {
    if (hasScheduleBuckets) {
      return allData.filter((airdrop) =>
        isHistoricalScheduleAirdrop(airdrop, language),
      );
    }

    return allData;
  }, [allData, hasScheduleBuckets, language]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let data: Airdrop[] = [];

    if (activeTab === "today") {
      data = todayData || [];
    } else if (activeTab === "upcoming") {
      data = futureData || [];
    } else {
      data = historicalData || [];
    }

    // Apply chain filter
    if (selectedChains.length > 0) {
      data = data.filter((item) => selectedChains.includes(item.chain));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const name = item.projectName;
        return (
          name.toLowerCase().includes(query) ||
          item.symbol.toLowerCase().includes(query)
        );
      });
    }

    return data;
  }, [activeTab, todayData, futureData, historicalData, selectedChains, searchQuery]);

  const isLoading = allLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const todayCount = todayData.length;
    const upcomingCount = futureData.length;
    const allCount = historicalData.length;

    // Calculate total required points for today's airdrops
    const todayTotalPoints = todayData.reduce(
      (sum, item) => sum + (item.requiredPoints || 0),
      0,
    );

    // Calculate average required points
    const avgRequiredPoints =
      todayData.length > 0
        ? Math.round(todayTotalPoints / todayData.length)
        : 0;

    // Calculate total deduct points for today
    const todayDeductPoints = todayData.reduce(
      (sum, item) => sum + (item.deductPoints || 0),
      0,
    );

    // Count by type for today
    const tgeCount = todayData.filter((a) => a.type === "TGE").length;
    const airdropTypeCount = todayData.filter(
      (a) =>
        a.type === "AIRDROP" ||
        a.type === "Airdrop" ||
        a.type === "PRE_TGE" ||
        a.type === "PRETGE" ||
        a.type === "PreTGE",
    ).length;

    // Upcoming stats
    const upcomingTGE = futureData.filter((a) => a.type === "TGE").length;
    const upcomingAirdrop = futureData.filter(
      (a) =>
        a.type === "AIRDROP" ||
        a.type === "Airdrop" ||
        a.type === "PRE_TGE" ||
        a.type === "PRETGE" ||
        a.type === "PreTGE",
    ).length;

    return {
      todayCount,
      upcomingCount,
      allCount,
      todayTotalPoints,
      avgRequiredPoints,
      todayDeductPoints,
      tgeCount,
      airdropTypeCount,
      upcomingTGE,
      upcomingAirdrop,
    };
  }, [todayData, futureData, historicalData]);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    await refetchAll();
  }, [refetchAll]);

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

  // Table columns for airdrops
  const airdropColumns: ColumnDef<Airdrop>[] = useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: copy.project,
        cell: ({ row }) => {
          const airdrop = row.original;
          const contractLink = airdrop.contractAddress
            ? `https://bscscan.com/token/${airdrop.contractAddress}`
            : null;

          return (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xl font-bold border border-primary/20">
                  {airdrop.logo === "🎁" ? (
                    <Sparkles className="w-5 h-5 text-primary" />
                  ) : (
                    airdrop.symbol.charAt(0)
                  )}
                </div>
                {airdrop.type === "TGE" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Flame className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-foreground">
                    {airdrop.symbol}
                  </span>
                  {contractLink && (
                    <a
                      href={contractLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {airdrop.projectName}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "typeDisplay",
        accessorFn: (row) => row.type,
        header: copy.type,
        cell: ({ row }) => {
          const airdrop = row.original;

          return (
            <Badge
              variant="outline"
              className={`${typeColors[airdrop.type] || typeColors["AIRDROP"]} font-medium`}
            >
              {airdrop.type}
            </Badge>
          );
        },
      },
      {
        id: "pointsDisplay",
        accessorFn: (row) => row.requiredPoints,
        header: copy.points,
        cell: ({ row }) => {
          const airdrop = row.original;
          const displayPoints =
            airdrop.pointsText?.trim() ||
            (airdrop.requiredPoints > 0 ? String(airdrop.requiredPoints) : "-");
          const secondaryText = airdrop.slotText?.trim() || null;

          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground text-lg">
                {displayPoints}
              </span>
              {secondaryText && (
                <span className="text-sm text-muted-foreground">
                  {secondaryText}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "amountDisplay",
        accessorFn: (row) => parseNumericAmount(row.airdropAmount) ?? 0,
        header: copy.amount,
        cell: ({ row }) => {
          const airdrop = row.original;
          const displayAmount = getDisplayAmount(airdrop);
          const displayValue = getDisplayValue(airdrop);

          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground text-lg">
                {displayAmount}
              </span>
              {displayValue && (
                <span className="text-sm font-semibold text-amber-400">
                  {displayValue}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "timeDisplay",
        accessorFn: (row) => row.claimStartDate,
        header: copy.time,
        cell: ({ row }) => {
          const airdrop = row.original;
          const timeInfo = getDisplayTimeInfo(airdrop, activeTab, language, copy);

          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">
                {timeInfo.main}
              </span>
              {timeInfo.secondary && (
                <span className="text-xs text-muted-foreground">
                  {timeInfo.secondary}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: copy.type,
        cell: ({ row }) => {
          const airdrop = row.original;
          return (
            <Badge
              variant="outline"
              className={`${typeColors[airdrop.type] || typeColors["AIRDROP"]} font-medium`}
            >
              {airdrop.type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "requiredPoints",
        header: copy.alphaPoints,
        cell: ({ row }) => {
          const airdrop = row.original;
          const required = airdrop.requiredPoints || 0;
          const deduct = airdrop.deductPoints || 0;

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  {required > 0
                    ? `${required} ${copy.pointsSuffix}`
                    : copy.notSpecified}
                </span>
              </div>
              {deduct > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-400/80">
                    {copy.deductedShort}:
                  </span>
                  <span className="text-xs font-medium text-red-400">
                    -{deduct} {copy.pointsSuffix}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "claimStartDate",
        header: copy.time,
        cell: ({ row }) => {
          const airdrop = row.original;
          const targetDate = airdrop.claimStartDate
            ? new Date(airdrop.claimStartDate)
            : null;

          if (!targetDate) {
            return <span className="text-muted-foreground">-</span>;
          }

          const date = new Date(targetDate);
          const displayDate = getDisplayDateByLanguage(targetDate, language);
          const timeText = formatDistanceToNow(date, {
            locale: dateLocale,
            addSuffix: true,
          });
          const dateText = format(displayDate, "dd MMM yy HH:mm", {
            locale: dateLocale,
          });
          const isExpiringSoon =
            airdrop.claimEndDate &&
            isBefore(new Date(airdrop.claimEndDate), addDays(new Date(), 3));

          // Check if it's today or tomorrow
          const isTodayDate = isDateTodayByLanguage(targetDate, language);
          const isTomorrowDate = isDateTomorrowByLanguage(targetDate, language);
          const dayBadge = isTodayDate ? (
            <Badge
              variant="outline"
              className="h-5 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]"
            >
              {copy.todayShort}
            </Badge>
          ) : isTomorrowDate ? (
            <Badge
              variant="outline"
              className="h-5 px-1.5 bg-blue-500/20 text-blue-400 border-blue-500/40 text-[10px]"
            >
              {copy.tomorrow}
            </Badge>
          ) : null;

          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {dayBadge}
                {false && isTodayDate && (
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]"
                  >
                    วันนี้
                  </Badge>
                )}
                {false && isTomorrowDate && (
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 bg-blue-500/20 text-blue-400 border-blue-500/40 text-[10px]"
                  >
                    พรุ่งนี้
                  </Badge>
                )}
                <span className="text-sm font-medium">{dateText}</span>
              </div>
              <span
                className={`text-xs ${isExpiringSoon ? "text-red-400" : "text-muted-foreground"}`}
              >
                {timeText}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const airdrop = row.original;
          const alertData = {
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
            estimatedPrice: airdrop.estimatedPrice || undefined,
            estimatedValue: airdrop.estimatedValue || undefined,
            airdropAmount: airdrop.airdropAmount,
            requirements: airdrop.requirements,
            requiredPoints: airdrop.requiredPoints,
            pointsText: airdrop.pointsText || undefined,
            deductPoints: airdrop.deductPoints,
            slotText: airdrop.slotText || undefined,
            contractAddress: airdrop.contractAddress,
          };

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  sendAirdropAlert(alertData);
                }}
                disabled={isSendingTelegram}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAirdropClick(airdrop)}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      activeTab,
      copy,
      dateLocale,
      handleAirdropClick,
      isSendingTelegram,
      language,
      sendAirdropAlert,
    ],
  );

  // React Table instance
  const table = useReactTable({
    data: filteredData as Airdrop[],
    columns: airdropColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setAirdropSorting,
    onColumnFiltersChange: setAirdropColumnFilters,
    state: { sorting: airdropSorting, columnFilters: airdropColumnFilters },
    initialState: {
      pagination: { pageSize: 20 },
      columnVisibility: {
        type: false,
        requiredPoints: false,
        claimStartDate: false,
        actions: false,
      },
    },
  });

  // Available chains for filter
  const availableChains = useMemo(() => {
    const chains = new Set<string>();
    const data =
      activeTab === "today"
        ? todayData
        : activeTab === "upcoming"
          ? futureData
          : historicalData;
    data.forEach((item) => {
      if (item.chain) chains.add(item.chain);
    });
    return Array.from(chains);
  }, [activeTab, todayData, futureData, historicalData]);

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
          className="p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90"
          shineColor={["#d4a948", "#f0c674", "#b8860b"]}
          borderWidth={2}
          duration={8}
          borderRadius="1.5rem"
        >
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/30 border border-primary/20"
                >
                  <Coins className="w-8 h-8 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">
                    <GradientText
                      colors={["#d4a948", "#f0c674", "#b8860b", "#d4a948"]}
                    >
                      {copy.heroTitle}
                    </GradientText>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {copy.heroDescription}
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:max-w-[440px]">
                <Button
                  asChild
                  variant="premium"
                  className="h-auto w-full rounded-2xl px-4 py-4 sm:px-5 sm:py-4 shadow-[0_10px_35px_rgba(212,169,72,0.25)]"
                >
                  <a
                    href={TELEGRAM_JOIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={telegramCtaAriaLabel}
                  >
                    <span className="flex w-full items-start gap-3 text-left">
                      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#030305]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                        <Send className="w-5 h-5" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold leading-tight sm:text-base">
                          {telegramCtaPrimary}
                        </span>
                        <span className="mt-1 text-xs leading-snug text-[#030305]/80 sm:text-sm">
                          {telegramCtaSecondary}
                        </span>
                      </span>
                    </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <CornerGlow
            position="top-right"
            color="rgba(212, 169, 72, 0.4)"
            size={200}
          />
          <CornerGlow
            position="bottom-left"
            color="rgba(184, 134, 11, 0.3)"
            size={150}
          />
        </ShineBorder>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Airdrops */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MagicCard
            className="p-4 sm:p-5"
            gradientColor="rgba(239, 68, 68, 0.15)"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                  <span>{copy.today}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-red-400">
                  <NumberTicker value={stats.todayCount} locale={numberLocale} />
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {stats.tgeCount} TGE / {stats.airdropTypeCount} Airdrop
                </div>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" />
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

        {/* Upcoming Airdrops */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <MagicCard
            className="p-4 sm:p-5"
            gradientColor="rgba(59, 130, 246, 0.15)"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span>{copy.upcoming}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                  <NumberTicker
                    value={stats.upcomingCount}
                    locale={numberLocale}
                  />
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {stats.upcomingTGE} TGE / {stats.upcomingAirdrop} Airdrop
                </div>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-blue-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#3b82f6"
              colorTo="#06b6d4"
            />
          </MagicCard>
        </motion.div>

        {/* Alpha Points Required (Today) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MagicCard
            className="p-4 sm:p-5"
            gradientColor="rgba(245, 158, 11, 0.15)"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>{copy.alphaPoints}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">
                  <NumberTicker
                    value={stats.avgRequiredPoints}
                    locale={numberLocale}
                  />
                  <span className="text-sm ml-1">{copy.average}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {copy.totalDeducted}: {stats.todayDeductPoints} {copy.pointsSuffix}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#f59e0b"
              colorTo="#eab308"
            />
          </MagicCard>
        </motion.div>

        {/* Total Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <MagicCard
            className="p-4 sm:p-5"
            gradientColor="rgba(168, 85, 247, 0.15)"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  <span>{copy.totalProjects}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                  <NumberTicker value={stats.allCount} locale={numberLocale} />
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {copy.allProjects}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
              </div>
            </div>
            <BorderBeam
              size={80}
              duration={8}
              colorFrom="#a855f7"
              colorTo="#ec4899"
            />
          </MagicCard>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <AnimatedGradientBorder
        gradientColors={[
          "rgba(212, 169, 72, 0.5)",
          "rgba(240, 198, 116, 0.5)",
          "rgba(184, 134, 11, 0.5)",
          "rgba(212, 169, 72, 0.5)",
        ]}
        borderWidth={1}
        duration={6}
      >
        <Card className="bg-background/95 backdrop-blur-sm border-0">
          <CardHeader className="pb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "today" | "upcoming" | "all")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
                <TabsTrigger
                  value="today"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">{copy.today}</span>
                  <span className="sm:hidden">{copy.todayShort}</span>
                  {stats.todayCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-red-500/20 text-red-400 text-xs"
                    >
                      {stats.todayCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                  <CalendarClock className="w-4 h-4" />
                  <span className="hidden sm:inline">{copy.upcoming}</span>
                  <span className="sm:hidden">{copy.upcomingShort}</span>
                  {stats.upcomingCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-blue-500/20 text-blue-400 text-xs"
                    >
                      {stats.upcomingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                >
                  <Coins className="w-4 h-4" />
                  <span className="hidden sm:inline">{copy.all}</span>
                  <span className="sm:hidden">{copy.allShort}</span>
                  {stats.allCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-purple-500/20 text-purple-400 text-xs"
                    >
                      {stats.allCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={copy.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-11 sm:h-10 text-base sm:text-sm bg-muted/30 border-primary/20 focus:border-primary/40"
                    />
                  </div>

                  <div className="flex gap-2">
                    {availableChains.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 sm:flex-none h-11 sm:h-10 gap-2 bg-muted/30 border-primary/20 text-sm"
                          >
                            <Filter className="w-4 h-4" />
                            <span>{copy.chain}</span>
                            {selectedChains.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-1 h-5 px-1.5 bg-primary/20 text-primary"
                              >
                                {selectedChains.length}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {availableChains.map((chain) => (
                            <DropdownMenuCheckboxItem
                              key={chain}
                              checked={selectedChains.includes(chain)}
                              onCheckedChange={(checked) =>
                                handleChainToggle(chain, checked)
                              }
                              className="py-2.5"
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
                      className="h-11 w-11 sm:h-10 sm:w-10 bg-muted/30 border-primary/20 hover:bg-primary/10"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
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
                        {copy.filtersLabel}:
                      </span>
                      {selectedChains.map((chain) => (
                        <Badge
                          key={chain}
                          variant="secondary"
                          className="gap-1 bg-primary/10 text-primary"
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
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-primary/10 text-primary"
                        >
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
                        className="h-6 text-xs text-muted-foreground hover:text-primary"
                      >
                        {copy.clearAll}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Table Content */}
              {isLoading ? (
                <div className="space-y-3 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className={`${
                        responsiveLayoutMode === "mobile"
                          ? "h-40"
                          : responsiveLayoutMode === "desktop"
                            ? "h-16"
                            : "h-28"
                      } w-full rounded-lg`}
                    />
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Gift className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {activeTab === "today"
                      ? copy.emptyToday
                      : activeTab === "upcoming"
                        ? copy.emptyUpcoming
                        : copy.emptyAll}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {hasFilters
                      ? copy.filteredResultsHint
                      : copy.waitingForUpdates}
                  </p>
                </motion.div>
              ) : responsiveLayoutMode === "pending" ? (
                <div
                  className="mt-4 space-y-3"
                  data-responsive-layout="pending"
                >
                  {[...Array(4)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-28 w-full rounded-xl border border-primary/10"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  {responsiveLayoutMode === "mobile" ? (
                    <div className="mt-4 space-y-3">
                      <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
                        <div className="space-y-3 pr-2">
                          <AnimatePresence>
                            {table.getRowModel().rows.map((row) => {
                              const airdrop = row.original as Airdrop;
                              return (
                                <MobileAirdropCard
                                  key={row.id}
                                  airdrop={airdrop}
                                  onClick={() => handleAirdropClick(airdrop)}
                                  onSendAlert={() => {
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
                                      estimatedPrice:
                                        airdrop.estimatedPrice || undefined,
                                      estimatedValue:
                                        airdrop.estimatedValue || undefined,
                                      airdropAmount: airdrop.airdropAmount,
                                      requirements: airdrop.requirements,
                                      requiredPoints: airdrop.requiredPoints,
                                      pointsText:
                                        airdrop.pointsText || undefined,
                                      deductPoints: airdrop.deductPoints,
                                      slotText: airdrop.slotText || undefined,
                                      contractAddress: airdrop.contractAddress,
                                    });
                                  }}
                                  isSendingTelegram={isSendingTelegram}
                                  language={language}
                                  copy={copy}
                                />
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>

                      {/* Mobile Pagination */}
                      {table.getPageCount() > 1 && (
                        <div className="flex flex-col gap-3 pt-3 border-t border-primary/10">
                          <div className="text-xs text-center text-muted-foreground">
                            {copy.page} {table.getState().pagination.pageIndex + 1}{" "}
                            {copy.of} {table.getPageCount()} ({filteredData.length}{" "}
                            {copy.items})
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.previousPage()}
                              disabled={!table.getCanPreviousPage()}
                              className="flex-1 h-10 border-primary/20"
                            >
                              {copy.previous}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.nextPage()}
                              disabled={!table.getCanNextPage()}
                              className="flex-1 h-10 border-primary/20"
                            >
                              {copy.next}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Desktop Table View */
                    <div className="mt-4 rounded-xl overflow-hidden border border-primary/10">
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <TableRow
                                key={headerGroup.id}
                                className="bg-muted/30 hover:bg-muted/40"
                              >
                                {headerGroup.headers.map((header) => (
                                  <TableHead
                                    key={header.id}
                                    className="text-muted-foreground font-medium whitespace-nowrap"
                                  >
                                    {header.isPlaceholder ? null : (
                                      <div
                                        className={
                                          header.column.getCanSort()
                                            ? "cursor-pointer select-none flex items-center gap-1"
                                            : ""
                                        }
                                        onClick={header.column.getToggleSortingHandler()}
                                      >
                                        {flexRender(
                                          (header.column.id === "projectName"
                                            ? copy.project
                                            : header.column.columnDef
                                                .header) as string,
                                          header.getContext() as never,
                                        )}
                                        {{
                                          asc: (
                                            <ChevronUp className="w-4 h-4 text-primary" />
                                          ),
                                          desc: (
                                            <ChevronDown className="w-4 h-4 text-primary" />
                                          ),
                                        }[
                                          header.column.getIsSorted() as string
                                        ] ??
                                          (header.column.getCanSort() ? (
                                            <ChevronsUpDown className="w-4 h-4 opacity-50" />
                                          ) : null)}
                                      </div>
                                    )}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence>
                              {table.getRowModel().rows.map((row, index) => (
                                <motion.tr
                                  key={row.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    delay: index * 0.02,
                                    duration: 0.2,
                                  }}
                                  className="border-b border-primary/5 hover:bg-primary/5 transition-colors cursor-pointer"
                                  onClick={() =>
                                    handleAirdropClick(row.original as Airdrop)
                                  }
                                >
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className="py-3 whitespace-nowrap"
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell as never,
                                        cell.getContext() as never,
                                      )}
                                    </TableCell>
                                  ))}
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                      {/* Desktop Pagination */}
                      {table.getPageCount() > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-primary/10 bg-muted/20">
                          <div className="text-sm text-muted-foreground">
                            {copy.page} {table.getState().pagination.pageIndex + 1}{" "}
                            {copy.of} {table.getPageCount()} ({filteredData.length}{" "}
                            {copy.items})
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.previousPage()}
                              disabled={!table.getCanPreviousPage()}
                              className="border-primary/20"
                            >
                              {copy.previous}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.nextPage()}
                              disabled={!table.getCanNextPage()}
                              className="border-primary/20"
                            >
                              {copy.next}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Tabs>
          </CardHeader>
        </Card>
      </AnimatedGradientBorder>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedAirdrop}
        onOpenChange={() => setSelectedAirdrop(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedAirdrop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-2xl font-bold border border-primary/20">
                    {selectedAirdrop.logo === "🎁" ? (
                      <Sparkles className="w-6 h-6 text-primary" />
                    ) : (
                      selectedAirdrop.symbol.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedAirdrop.projectName}
                      <Badge
                        variant="outline"
                        className={`${typeColors[selectedAirdrop.type] || typeColors["AIRDROP"]} font-medium`}
                      >
                        {selectedAirdrop.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      ${selectedAirdrop.symbol} • {selectedAirdrop.chain}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedAirdrop.description || copy.detailDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Alpha Points Info */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-amber-400">
                      {copy.alphaPoints}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {copy.requiredPoints}
                      </div>
                      <div className="text-xl font-bold text-amber-400">
                        {selectedAirdrop.requiredPoints || 0}{" "}
                        <span className="text-sm">{copy.pointsSuffix}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {copy.deductedPoints}
                      </div>
                      <div className="text-xl font-bold text-red-400">
                        -{selectedAirdrop.deductPoints || 0}{" "}
                        <span className="text-sm">{copy.pointsSuffix}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-primary/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {copy.amount}
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {getDisplayAmount(selectedAirdrop)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {copy.estimatedValue}
                      </div>
                      <div className="text-xl font-bold text-amber-400">
                        {getDisplayValue(selectedAirdrop) || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                {selectedAirdrop.claimStartDate && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">{copy.claimStart}</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {format(
                        getDisplayDateByLanguage(
                          new Date(selectedAirdrop.claimStartDate),
                          language,
                        ),
                        "dd MMMM yyyy HH:mm",
                        { locale: dateLocale },
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(selectedAirdrop.claimStartDate),
                        { locale: dateLocale, addSuffix: true },
                      )}
                    </div>
                  </div>
                )}

                {/* Contract Address */}
                {selectedAirdrop.contractAddress && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {copy.contractAddress}
                        </div>
                        <div className="text-sm font-mono">
                          {selectedAirdrop.contractAddress.slice(0, 10)}...
                          {selectedAirdrop.contractAddress.slice(-8)}
                        </div>
                      </div>
                      <a
                        href={`https://bscscan.com/token/${selectedAirdrop.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
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
                        estimatedPrice:
                          selectedAirdrop.estimatedPrice || undefined,
                        estimatedValue:
                          selectedAirdrop.estimatedValue || undefined,
                        airdropAmount: selectedAirdrop.airdropAmount,
                        requirements: selectedAirdrop.requirements,
                        requiredPoints: selectedAirdrop.requiredPoints,
                        pointsText: selectedAirdrop.pointsText || undefined,
                        deductPoints: selectedAirdrop.deductPoints,
                        slotText: selectedAirdrop.slotText || undefined,
                        contractAddress: selectedAirdrop.contractAddress,
                      });
                    }}
                    disabled={isSendingTelegram}
                  >
                    <Send className="w-4 h-4" />
                    {copy.sendTelegram}
                  </Button>
                  {selectedAirdrop.contractAddress && (
                    <Button variant="outline" className="gap-2" asChild>
                      <a
                        href={`https://bscscan.com/token/${selectedAirdrop.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {copy.bscscan}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
