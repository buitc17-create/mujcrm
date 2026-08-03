'use client';

import { useEffect, useState } from 'react';
import AnimatedBackground from './AnimatedBackground';

export default function AnimatedBackgroundClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!mounted) return null;
  return <AnimatedBackground />;
}
