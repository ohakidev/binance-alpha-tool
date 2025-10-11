'use client';

/**
 * Project Distribution Chart
 * Donut chart showing income distribution by project
 */

import { motion } from 'framer-motion';
import { useIncomeStore } from '@/lib/stores/income-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useState } from 'react';
import { PieChart } from 'lucide-react';

interface ProjectData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

const COLORS = [
  '#FFD700', // Gold
  '#00CED1', // Cyan
  '#9B59B6', // Purple
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#EC4899', // Pink
];

export function ProjectDistribution() {
  const activeUserId = useUserStore((state) => state.activeUserId);
  const entries = useIncomeStore((state) => state.entries);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Calculate project distribution
  const projectTotals = entries
    .filter((entry) => entry.userId === activeUserId)
    .reduce((acc, entry) => {
      if (!acc[entry.projectName]) {
        acc[entry.projectName] = 0;
      }
      acc[entry.projectName] += entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalIncome = Object.values(projectTotals).reduce((sum, amount) => sum + amount, 0);

  const projectData: ProjectData[] = Object.entries(projectTotals)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8); // Top 8 projects

  if (projectData.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-12">
        <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No project data available</p>
      </div>
    );
  }

  // Calculate donut chart paths
  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  const innerRadius = 50;
  let currentAngle = -90;

  const paths = projectData.map((project) => {
    const angle = (project.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const outerX1 = centerX + radius * Math.cos(startRad);
    const outerY1 = centerY + radius * Math.sin(startRad);
    const outerX2 = centerX + radius * Math.cos(endRad);
    const outerY2 = centerY + radius * Math.sin(endRad);

    const innerX1 = centerX + innerRadius * Math.cos(startRad);
    const innerY1 = centerY + innerRadius * Math.sin(startRad);
    const innerX2 = centerX + innerRadius * Math.cos(endRad);
    const innerY2 = centerY + innerRadius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `
      M ${outerX1} ${outerY1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
      L ${innerX2} ${innerY2}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
      Z
    `;

    currentAngle = endAngle;

    return {
      ...project,
      path,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="glass-card">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-[#FFD700]" />
        Project Distribution
      </h3>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 240 240">
            <defs>
              {paths.map((project, i) => (
                <filter key={i} id={`glow-${i}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {paths.map((project, i) => (
              <motion.path
                key={project.name}
                d={project.path}
                fill={project.color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: hoveredProject === project.name ? 1 : 0.8,
                  scale: hoveredProject === project.name ? 1.05 : 1,
                }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredProject(project.name)}
                onMouseLeave={() => setHoveredProject(null)}
                filter={hoveredProject === project.name ? `url(#glow-${i})` : undefined}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className="text-sm fill-muted-foreground"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-xl font-bold fill-[#FFD700]"
            >
              ${totalIncome.toFixed(0)}
            </text>
          </svg>

          {/* Hover tooltip */}
          {hoveredProject && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 glass px-3 py-2 rounded-lg whitespace-nowrap"
            >
              <p className="text-sm font-medium">
                {hoveredProject}
              </p>
              <p className="text-xs text-muted-foreground">
                ${projectData.find(p => p.name === hoveredProject)?.amount.toFixed(2)}
              </p>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-60 overflow-y-auto">
          {projectData.map((project, i) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onMouseEnter={() => setHoveredProject(project.name)}
              onMouseLeave={() => setHoveredProject(null)}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                hoveredProject === project.name ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: project.color }}>
                ${project.amount.toFixed(2)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
