'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/services/api-client';

interface ServiceHealth {
  status: string;
  latency_ms?: number;
  error?: string;
  details?: { service?: string; version?: string };
}

interface SystemHealth {
  status: string;
  services: Record<string, ServiceHealth>;
  timestamp: number;
}

/**
 * System Health Dashboard
 * Per Volume V Chapter 7 §7.13: Monitoring Architecture
 *
 * Shows real-time health of all Mavyx Intelligence services.
 * Accessible at /health (no auth required for monitoring).
 */
export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      const data = await apiRequest<SystemHealth>('/ai/health/system');
      setHealth(data);
      setError(null);
    } catch (err) {
      setError('Unable to fetch system health');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Health</h1>
            <p className="text-sm text-slate-500">Mavyx Intelligence — Service Monitor</p>
          </div>
          <button
            onClick={checkHealth}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          >
            Refresh
          </button>
        </div>

        {isLoading && (
          <p className="text-slate-600">Checking services...</p>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {health && (
          <>
            {/* Overall Status */}
            <div className={`rounded-lg border p-4 ${
              health.status === 'healthy'
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${
                  health.status === 'healthy' ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {health.status === 'healthy' ? '●' : '◐'}
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Last checked: {new Date(health.timestamp * 1000).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Services */}
            <div className="space-y-3">
              {Object.entries(health.services).map(([name, service]) => (
                <div
                  key={name}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${
                        service.status === 'healthy' ? 'text-green-500' :
                        service.status === 'unreachable' ? 'text-red-500' :
                        'text-amber-500'
                      }`}>
                        {service.status === 'healthy' ? '●' :
                         service.status === 'unreachable' ? '○' : '◐'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatServiceName(name)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {service.details?.service || name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        service.status === 'healthy' ? 'text-green-600' :
                        service.status === 'unreachable' ? 'text-red-600' :
                        'text-amber-600'
                      }`}>
                        {service.status}
                      </p>
                      {service.latency_ms !== undefined && (
                        <p className="text-xs text-slate-400">
                          {service.latency_ms}ms
                        </p>
                      )}
                      {service.error && (
                        <p className="text-xs text-red-500">{service.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 text-center">
              Auto-refreshes every 30 seconds
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function formatServiceName(name: string): string {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
