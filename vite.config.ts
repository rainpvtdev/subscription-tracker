import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [
        react(),
        runtimeErrorOverlay(),
        themePlugin(),
        ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined ? [await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())] : []),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
        // Generate sourcemaps only in development for better debugging
        sourcemap: process.env.NODE_ENV !== 'production',
        // Optimize chunks for better performance
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'wouter', '@tanstack/react-query'],
                    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tabs'],
                },
                // Create a separate service worker bundle that doesn't get hashed
                entryFileNames: (chunkInfo) => {
                    return chunkInfo.name.includes('service-worker')
                        ? 'service-worker.js'
                        : 'assets/[name]-[hash].js';
                }
            },
        },
        // Optimize minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === 'production',
                drop_debugger: process.env.NODE_ENV === 'production'
            }
        }
    },
    // Optimize server performance during development
    server: {
        hmr: {
            overlay: false // Disable HMR overlay to reduce browser load
        },
        watch: {
            usePolling: false, // Use native file system events instead of polling
        }
    },
    // Optimize preview server
    preview: {
        port: 5000,
        strictPort: true,
    }
});
