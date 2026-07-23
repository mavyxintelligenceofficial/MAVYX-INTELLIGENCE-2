'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';

export default function HomePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); setMounted(true); }, [hydrate]);
  useEffect(() => { if (isHydrated && token) router.replace('/profile'); }, [isHydrated, token, router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="mavyx-bg" />
      <div className="mavyx-grid" />
      <div className="mavyx-orb mavyx-orb-gold" />
      <div className="mavyx-orb mavyx-orb-cyan" />
      <div className="mavyx-orb mavyx-orb-purple" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-6 mavyx-page-enter">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image
                src="/brand/Mavyx GOLD VERSION.png"
                alt="Mavyx Intelligence"
                width={180}
                height={72}
                priority
                className="drop-shadow-[0_0_40px_rgba(201,168,76,0.3)]"
              />
              {/* Glow effect under logo */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full bg-[#C9A84C]/10 blur-xl" />
            </div>
          </div>

          <h1 className="font-orbitron text-5xl font-black tracking-[0.2em] mb-2 glow-gold"
            style={{ color: '#C9A84C' }}>
            MAVYX
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C9A84C]/30" />
            <p className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: '#6B6B80' }}>
              Intelligence
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C9A84C]/30" />
          </div>

          <p className="font-rajdhani text-lg leading-relaxed" style={{ color: '#6B6B80' }}>
            AI-powered Forex market intelligence.
            <br />
            <span className="text-gold font-semibold">7 specialist agents.</span>{' '}
            <span style={{ color: '#4B4B60' }}>One unified recommendation.</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { value: '7', label: 'AI Agents', icon: '◈' },
            { value: '28+', label: 'Pairs', icon: '◇' },
            { value: '99%', label: 'Uptime', icon: '◆' },
          ].map((stat, i) => (
            <div key={stat.label} className="mavyx-glass p-4 text-center group">
              <div className="text-xs mb-2 text-gold/40 group-hover:text-gold transition-colors">{stat.icon}</div>
              <p className="font-orbitron text-2xl font-bold text-gold glow-gold">{stat.value}</p>
              <p className="font-rajdhani text-xs uppercase tracking-widest mt-1" style={{ color: '#6B6B80' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 mb-8">
          <Link href="/login" className="mavyx-btn mavyx-btn-gold block text-center w-full">
            Access Platform
          </Link>
          <Link href="/signup" className="mavyx-btn mavyx-btn-ghost block text-center w-full">
            Create Account
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-center font-rajdhani text-xs" style={{ color: '#3B3B50' }}>
          AI-generated analysis only · Not financial advice
        </p>

        {/* Bottom decorative line */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A84C]/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/30" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A84C]/20" />
        </div>
      </div>
    </main>
  );
}
