'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';

/**
 * Workspace — Uses the exact HTML spec as the UI
 * Loads the spec HTML in an iframe and bridges to the backend
 */
export default function WorkspacePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, user, logout } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !token) router.replace('/login');
  }, [isHydrated, token, router]);

  // Listen for messages from the iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'navigate') {
        router.push(event.data.path);
      }
      if (event.data?.type === 'logout') {
        logout();
        router.push('/login');
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, logout]);

  if (!isHydrated || !token) return null;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src="/workspace.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#000',
        }}
        title="Mavyx Intelligence Workspace"
      />
    </div>
  );
}
