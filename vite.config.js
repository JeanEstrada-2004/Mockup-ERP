import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import { appShellPlugin } from './scripts/app-shell-template.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [appShellPlugin(mode)],
  define: { __ACTIVE_VARIANT__: JSON.stringify(mode) },
  root: 'src-modern',
  publicDir: '../public-assets',
  base: './',

  build: {
    outDir: '../dist-modern',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    minify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      // Legacy Metis examples stay in source for later deliveries. Published
      // builds include only adapted pages.
      input: {
        main: resolve(__dirname, 'src-modern/index.html'),
        projects: resolve(__dirname, 'src-modern/projects.html'),
        project: resolve(__dirname, 'src-modern/project.html'),
        budgets: resolve(__dirname, 'src-modern/budgets.html'),
        budget: resolve(__dirname, 'src-modern/budget.html'),
        purchases: resolve(__dirname, 'src-modern/purchases.html'),
        purchase: resolve(__dirname, 'src-modern/purchase.html'),
        expenses: resolve(__dirname, 'src-modern/expenses.html'),
        expense: resolve(__dirname, 'src-modern/expense.html'),
        personnel: resolve(__dirname, 'src-modern/personnel.html'),
        worker: resolve(__dirname, 'src-modern/worker.html'),
        warehouse: resolve(__dirname, 'src-modern/warehouse.html'),
        material: resolve(__dirname, 'src-modern/material.html'),
        costs: resolve(__dirname, 'src-modern/costs.html'),
        documents: resolve(__dirname, 'src-modern/documents.html'),
        document: resolve(__dirname, 'src-modern/document.html'),
        reports: resolve(__dirname, 'src-modern/reports.html'),
        crm: resolve(__dirname, 'src-modern/crm.html'),
        integrations: resolve(__dirname, 'src-modern/integrations.html'),
        security: resolve(__dirname, 'src-modern/security.html'),
        settings: resolve(__dirname, 'src-modern/settings.html'),
        'module-preview': resolve(__dirname, 'src-modern/module-preview.html'),
        'design-system': resolve(__dirname, 'src-modern/design-system.html'),
      },

      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          if (
            id.includes('node_modules/bootstrap/') ||
            id.includes('node_modules/@popperjs/core/')
          ) {
            return 'vendor-bootstrap';
          }
          if (id.includes('node_modules/apexcharts/')) {
            return 'vendor-charts';
          }
          // D3 modules used by the chart kit (src-modern/scripts/charts/).
          if (/node_modules\/(d3-|internmap)/.test(id)) {
            return 'vendor-d3';
          }
          if (id.includes('node_modules/alpinejs/') || id.includes('node_modules/sweetalert2/')) {
            return 'vendor-ui';
          }
        },
        // Asset naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },

  server: {
    port: 3000,
    open: true,
    // Enable CORS for development
    cors: true,
  },

  preview: {
    port: 4173,
    open: true,
  },

  css: {
    // Enable CSS source maps in development
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: [
          'legacy-js-api',
          'import',
          'global-builtin',
          'color-functions',
          'if-function',
        ],
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src-modern'),
      '~bootstrap': resolve(__dirname, 'node_modules/bootstrap'),
      '~bootstrap-icons': resolve(__dirname, 'node_modules/bootstrap-icons'),
      ...(mode === 'surtec-peti'
        ? { './jy.js': resolve(__dirname, 'src-modern/scripts/data/empty-variant-data.js') }
        : mode === 'jy-pmi' || mode === 'jy-demo'
          ? { './surtec.js': resolve(__dirname, 'src-modern/scripts/data/empty-variant-data.js') }
          : {}),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['bootstrap', 'alpinejs', 'apexcharts', 'sweetalert2'],
  },

  esbuild: {
    // Strip console.* and debugger statements from production bundles
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
}));
