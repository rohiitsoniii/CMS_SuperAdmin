import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
var rootDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(rootDir, './src'),
            '@features': path.resolve(rootDir, './src/features'),
            '@shared': path.resolve(rootDir, './src/shared'),
            '@app': path.resolve(rootDir, './src/app'),
        },
    },
    server: {
        port: 5175,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
                    query: ['@tanstack/react-query'],
                    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
                    charts: ['recharts'],
                    utils: ['axios', 'date-fns', 'dayjs', 'zustand'],
                },
            },
        },
    },
});
