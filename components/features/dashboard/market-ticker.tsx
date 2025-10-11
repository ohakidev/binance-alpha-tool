'use client';

/**
 * Market Ticker Component
 * Live market data scrolling horizontally with prices and 24h change
 */

import { motion, useAnimationControls } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

// Mock market data (in production, fetch from Binance API)
const mockMarketData: MarketData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68542.32, change24h: 2.45 },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change24h: -1.23 },
  { symbol: 'BNB', name: 'BNB', price: 589.45, change24h: 3.67 },
  { symbol: 'SOL', name: 'Solana', price: 142.89, change24h: 5.12 },
  { symbol: 'XRP', name: 'Ripple', price: 0.6234, change24h: -0.89 },
  { symbol: 'ADA', name: 'Cardano', price: 0.5678, change24h: 1.45 },
  { symbol: 'AVAX', name: 'Avalanche', price: 34.56, change24h: -2.34 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.8923, change24h: 4.56 },
];

function TickerItem({ data }: { data: MarketData }) {
  const isPositive = data.change24h >= 0;

  return (
    <div className="flex items-center gap-3 px-6 border-r border-white/10">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{data.symbol}</span>
          <span className="text-xs text-muted-foreground">{data.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-medium">
            ${data.price.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: data.price < 1 ? 4 : 2,
            })}
          </span>
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(data.change24h).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function MarketTicker() {
  const [marketData, setMarketData] = useState(mockMarketData);
  const controls = useAnimationControls();

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData((prev) =>
        prev.map((item) => ({
          ...item,
          price: item.price * (1 + (Math.random() - 0.5) * 0.001), // ±0.05% random change
          change24h: item.change24h + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Infinite scroll animation
  useEffect(() => {
    const animate = async () => {
      await controls.start({
        x: [0, -1000],
        transition: {
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        },
      });
    };

    animate();
  }, [controls]);

  // Duplicate data for seamless loop
  const duplicatedData = [...marketData, ...marketData, ...marketData];

  return (
    <div className="relative w-full overflow-hidden glass py-3 mb-6">
      {/* Gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#1A1F3A] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#1A1F3A] to-transparent z-10 pointer-events-none" />

      {/* Scrolling ticker */}
      <motion.div
        animate={controls}
        className="flex items-center whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {duplicatedData.map((data, index) => (
          <TickerItem key={`${data.symbol}-${index}`} data={data} />
        ))}
      </motion.div>
    </div>
  );
}
