'use client';

/**
 * Income Chart Component
 * SVG-based line chart showing income trends
 */

import { motion } from 'framer-motion';
import { useUserStore } from '@/lib/stores/user-store';
import { useIncomeStore } from '@/lib/stores/income-store';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { useState } from 'react';

export function IncomeChart() {
  const activeUserId = useUserStore((state) => state.activeUserId);
  const entries = useIncomeStore((state) => state.entries);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get daily totals
  const dailyData = daysInMonth.map((day) => {
    const dayEntries = activeUserId
      ? entries.filter(
          (entry) =>
            entry.userId === activeUserId &&
            isSameDay(new Date(entry.date), day)
        )
      : [];

    const total = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    return {
      day: day.getDate(),
      date: day,
      amount: total,
    };
  });

  const maxAmount = Math.max(...dailyData.map((d) => d.amount), 100);
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate SVG path
  const points = dailyData.map((d, i) => {
    const x = padding.left + (i / (dailyData.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.amount / maxAmount) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ');

  // Area fill path
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">
          Income Trend - {format(currentMonth, 'MMMM yyyy')}
        </h3>
        {hoveredDay !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass px-3 py-1.5 rounded-lg"
          >
            <p className="text-sm">
              Day {hoveredDay}:{' '}
              <span className="font-bold gradient-text-gold">
                ${dailyData[hoveredDay - 1]?.amount.toFixed(2) || '0.00'}
              </span>
            </p>
          </motion.div>
        )}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minWidth: '600px' }}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.05" />
            </linearGradient>

            {/* Gradient for line */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="10"
                >
                  ${(maxAmount * ratio).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <motion.path
            d={areaD}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          {/* Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#FFD700"
                stroke="#0A0E27"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: point.amount > 0 ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.02 }}
                whileHover={{ scale: 1.5 }}
                onMouseEnter={() => setHoveredDay(point.day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Day labels (every 5th day) */}
              {point.day % 5 === 0 && (
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="10"
                >
                  {point.day}
                </text>
              )}
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="12"
            fontWeight="500"
          >
            Day of Month
          </text>
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className="text-xl font-bold gradient-text-gold">
            ${dailyData.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Average</p>
          <p className="text-xl font-bold text-[#00CED1]">
            ${(dailyData.reduce((sum, d) => sum + d.amount, 0) / dailyData.length).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Best Day</p>
          <p className="text-xl font-bold text-[#10B981]">
            ${Math.max(...dailyData.map((d) => d.amount)).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
