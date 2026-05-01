import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

/** This repo folder — avoids Turbopack picking a parent workspace (see pnpm-lock warning). */
const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  /** Allow LAN / alternate hostnames for `next dev` (HMR, devtools). Adjust if your LAN IP differs. */
  allowedDevOrigins: [
    '192.168.10.63',
    'localhost',
    '127.0.0.1',
  ],
};

export default nextConfig;
