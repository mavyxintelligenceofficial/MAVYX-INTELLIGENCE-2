'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';

/**
 * Mavyx Intelligence — Premium Landing Page
 * Brand: Dark theme with gold accents, luxury feel
 */
export default function HomePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/profile');
    }
  }, [isHydrated, token, router]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)' }}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo & Brand */}
      <div className="relative z-10 text-center space-y-8 max-w-md">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/brand/Mavyx GOLD VERSION.png"
            alt="Mavyx Intelligence"
            width={200}
            height={80}
            priority
            className="drop-shadow-[0_0_30px_rgba(201,168,76,0.3)]"
          />
          <div>
            <h1
              className="text-4xl font-bold tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #E8D48B, #C9A84C, #A08030)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MAVYX
            </h1>
            <p className="text-sm tracking-[0.3em] uppercase mt-1" style={{ color: '#8888A0' }}>
              Intelligence
            </p>
          </div>
        </div>

        <p className="text-lg leading-relaxed" style={{ color: '#8888A0' }}>
          AI-powered Forex market intelligence.
          <br />
          <span style={{ color: '#C9A84C' }}>7 specialist agents.</span>{' '}
          One unified recommendation.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'AI Agents', value: '7' },
            { label: 'Pairs', value: '28+' },
            { label: 'Uptime', value: '99%' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-lg"
              style={{ background: '#12121A', border: '1px solid #2A2A3A' }}
            >
              <p className="text-xl font-bold" style={{ color: '#C9A84C' }}>
                {stat.value}
              </p>
              <p className="text-xs mt-1" style={{ color: '#8888A0' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3.5 rounded-lg text-center font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A08030)',
              color: '#0A0A0F',
            }}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="w-full py-3.5 rounded-lg text-center font-medium text-sm transition-all duration-300 hover:border-amber-500 hover:text-amber-400"
            style={{
              background: '#12121A',
              border: '1px solid #2A2A3A',
              color: '#E8E8F0',
            }}
          >
            Create Account
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-xs" style={{ color: '#555560' }}>
          AI-generated analysis only. Not financial advice.
          <br />
          Always manage your own risk.
        </p>
      </div>
    </main>
  );
}
