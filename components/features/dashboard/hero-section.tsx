'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, Target } from 'lucide-react';
import { useLanguage } from '@/lib/stores/language-store';
import { ParticleBackground } from './particle-background';
import { useRef } from 'react';

export function HeroSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const quickStats = [
    {
      icon: Sparkles,
      value: '12',
      label: t('dashboard.todayDrops'),
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
    },
    {
      icon: TrendingUp,
      value: '1,547',
      label: t('dashboard.activeUsers'),
      color: 'from-cyan-500 to-blue-500',
      shadowColor: 'shadow-cyan-500/30',
    },
    {
      icon: Zap,
      value: '$2.4M',
      label: t('dashboard.totalValue'),
      color: 'from-emerald-500 to-green-500',
      shadowColor: 'shadow-emerald-500/30',
    },
  ];

  return (
    <div ref={ref} className="relative min-h-[70vh] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950"
        >
          <ParticleBackground count={50} />

          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          {/* Glowing Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-2 mb-8 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 backdrop-blur-xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Target className="w-4 h-4 text-orange-400" />
            </motion.div>
            <span className="text-sm font-semibold text-orange-200">
              {t('dashboard.heroTitle')}
            </span>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="block bg-gradient-to-r from-white via-orange-200 to-amber-300 bg-clip-text text-transparent"
            >
              Binance Alpha
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="block text-white"
            >
              Airdrops
            </motion.span>
          </h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t('dashboard.heroDesc')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-2xl shadow-orange-500/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Explore Airdrops
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors"
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`glass-card bg-gradient-to-br ${stat.color} ${stat.shadowColor} shadow-2xl relative overflow-hidden group`}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-xl">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60"
                  />
                </div>

                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + index * 0.1, type: 'spring' }}
                  className="text-4xl font-black text-white mb-2"
                >
                  {stat.value}
                </motion.p>

                <p className="text-sm font-medium text-white/80">{stat.label}</p>
              </div>

              {/* Animated corner accent */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/10 to-transparent rounded-tl-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
