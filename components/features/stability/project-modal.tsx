'use client';

/**
 * Project Detail Modal
 * Expandable modal for detailed project analysis
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, BarChart3, DollarSign, Users, Droplets, ExternalLink, Heart } from 'lucide-react';
import { StabilityData, ChartDataPoint } from '@/lib/types';
import { modalVariants, overlayVariants, fadeVariants } from '@/lib/animations';
import { useToast } from '@/lib/hooks/use-toast';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StabilityData | null;
}

// Mock chart data generator
const generateChartData = (hours: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = Date.now();
  const basePrice = Math.random() * 100;

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const randomChange = (Math.random() - 0.5) * 10;
    const value = Math.max(0, basePrice + randomChange);
    data.push({ timestamp, value });
  }

  return data;
};

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'risk'>('overview');
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '24h' | '7d'>('24h');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  if (!project) return null;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'charts' as const, label: 'Charts', icon: TrendingUp },
    { id: 'risk' as const, label: 'Risk Analysis', icon: DollarSign },
  ];

  const timeframes = [
    { id: '1h' as const, label: '1H' },
    { id: '4h' as const, label: '4H' },
    { id: '24h' as const, label: '24H' },
    { id: '7d' as const, label: '7D' },
  ];

  const mockMetrics = {
    marketCap: Math.random() * 1000000000,
    volume24h: project.volume,
    holders: Math.floor(Math.random() * 100000),
    liquidity: Math.random() * 10000000,
  };

  const chartData = generateChartData(timeframe === '1h' ? 1 : timeframe === '4h' ? 4 : timeframe === '24h' ? 24 : 168);
  const maxPrice = Math.max(...chartData.map(d => d.value));
  const minPrice = Math.min(...chartData.map(d => d.value));

  const handleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    success(isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist');
  };

  const riskFactors = [
    { label: 'Volatility', value: project.volatilityIndex, max: 100, color: '#EF4444' },
    { label: 'Liquidity', value: 85, max: 100, color: '#10B981' },
    { label: 'Market Cap', value: 72, max: 100, color: '#00CED1' },
    { label: 'Community', value: 65, max: 100, color: '#F59E0B' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 glass border-b border-white/10 p-6 -m-6 mb-6 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold">{project.symbol}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.riskLevel === 'safe' ? 'bg-[#10B981]/20 text-[#10B981]' :
                        project.riskLevel === 'moderate' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {project.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{project.name}</p>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold">${project.price.toFixed(2)}</span>
                      <div className={`flex items-center gap-1 text-lg font-medium ${
                        project.change24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}>
                        {project.change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        <span>{Math.abs(project.change24h).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWatchlist}
                      className={`p-2 rounded-lg transition-all ${
                        isWatchlisted ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'glass hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 glass hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'gradient-gold text-black font-medium'
                          : 'glass hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Market Cap */}
                        <div className="glass rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-[#FFD700]" />
                            <span className="text-sm text-muted-foreground">Market Cap</span>
                          </div>
                          <p className="text-2xl font-bold">
                            ${(mockMetrics.marketCap / 1000000).toFixed(2)}M
                          </p>
                        </div>

                        {/* Volume */}
                        <div className="glass rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-[#00CED1]" />
                            <span className="text-sm text-muted-foreground">24h Volume</span>
                          </div>
                          <p className="text-2xl font-bold">
                            ${(mockMetrics.volume24h / 1000000).toFixed(2)}M
                          </p>
                        </div>

                        {/* Holders */}
                        <div className="glass rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-[#9B59B6]" />
                            <span className="text-sm text-muted-foreground">Holders</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {mockMetrics.holders.toLocaleString()}
                          </p>
                        </div>

                        {/* Liquidity */}
                        <div className="glass rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-5 h-5 text-[#10B981]" />
                            <span className="text-sm text-muted-foreground">Liquidity</span>
                          </div>
                          <p className="text-2xl font-bold">
                            ${(mockMetrics.liquidity / 1000000).toFixed(2)}M
                          </p>
                        </div>
                      </div>

                      {/* Stability Score */}
                      <div className="glass rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">Stability Score</span>
                          <span className="text-2xl font-bold gradient-text-gold">
                            {project.stabilityScore}/100
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.stabilityScore}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full ${
                              project.riskLevel === 'safe' ? 'bg-[#10B981]' :
                              project.riskLevel === 'moderate' ? 'bg-[#F59E0B]' :
                              'bg-[#EF4444]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Quick Trade Button */}
                      <button className="w-full px-6 py-3 gradient-gold text-black font-medium rounded-lg hover:glow-gold transition-all flex items-center justify-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        Trade on Binance
                      </button>
                    </div>
                  )}

                  {/* Charts Tab */}
                  {activeTab === 'charts' && (
                    <div className="space-y-4">
                      {/* Timeframe Selector */}
                      <div className="flex gap-2">
                        {timeframes.map((tf) => (
                          <button
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                              timeframe === tf.id
                                ? 'gradient-cyan text-black font-medium'
                                : 'glass hover:bg-white/10'
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      {/* Price Chart */}
                      <div className="glass rounded-lg p-4">
                        <h3 className="font-bold mb-4">Price Chart</h3>
                        <div className="relative h-64">
                          {/* Simple SVG Chart */}
                          <svg className="w-full h-full" viewBox="0 0 800 200">
                            {/* Grid lines */}
                            {[0, 50, 100, 150, 200].map((y) => (
                              <line
                                key={y}
                                x1="0"
                                y1={y}
                                x2="800"
                                y2={y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Price line */}
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, ease: 'easeOut' }}
                              d={chartData
                                .map((point, i) => {
                                  const x = (i / (chartData.length - 1)) * 800;
                                  const y = 200 - ((point.value - minPrice) / (maxPrice - minPrice)) * 200;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ')}
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="3"
                            />

                            {/* Gradient definition */}
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="100%" stopColor="#00CED1" />
                              </linearGradient>
                            </defs>

                            {/* Fill area */}
                            <motion.path
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.2 }}
                              transition={{ duration: 1, delay: 1 }}
                              d={`${chartData
                                .map((point, i) => {
                                  const x = (i / (chartData.length - 1)) * 800;
                                  const y = 200 - ((point.value - minPrice) / (maxPrice - minPrice)) * 200;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ')} L 800 200 L 0 200 Z`}
                              fill="url(#gradient)"
                            />
                          </svg>

                          {/* Price labels */}
                          <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                            ${maxPrice.toFixed(2)}
                          </div>
                          <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                            ${minPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Volume Chart Placeholder */}
                      <div className="glass rounded-lg p-4">
                        <h3 className="font-bold mb-4">Volume</h3>
                        <div className="h-32 flex items-end gap-1">
                          {chartData.slice(-20).map((point, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${(point.value / maxPrice) * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              className="flex-1 bg-gradient-to-t from-[#00CED1]/50 to-[#00CED1] rounded-t"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Analysis Tab */}
                  {activeTab === 'risk' && (
                    <div className="space-y-4">
                      <div className="glass rounded-lg p-4">
                        <h3 className="font-bold mb-4">Risk Factors</h3>
                        <div className="space-y-4">
                          {riskFactors.map((factor) => (
                            <div key={factor.label}>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">{factor.label}</span>
                                <span className="text-sm font-bold">{factor.value}/100</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${factor.value}%` }}
                                  transition={{ duration: 1 }}
                                  className="h-full"
                                  style={{ backgroundColor: factor.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Summary */}
                      <div className={`glass rounded-lg p-4 border-2 ${
                        project.riskLevel === 'safe' ? 'border-[#10B981]' :
                        project.riskLevel === 'moderate' ? 'border-[#F59E0B]' :
                        'border-[#EF4444]'
                      }`}>
                        <h3 className="font-bold mb-2">Overall Assessment</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.riskLevel === 'safe' &&
                            'This project shows strong fundamentals with low volatility and good liquidity. Suitable for conservative investors.'}
                          {project.riskLevel === 'moderate' &&
                            'Moderate risk profile with acceptable volatility. Recommended for investors with medium risk tolerance.'}
                          {project.riskLevel === 'high' &&
                            'High volatility detected. This project carries significant risk. Only suitable for experienced traders.'}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
