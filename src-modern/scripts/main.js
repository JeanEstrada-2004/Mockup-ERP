// ==========================================================================
// Mockup ERP - JavaScript Entry Point
// ES6+ Modules with Bootstrap 5
// ==========================================================================

// Import Bootstrap 5 JavaScript components (only those actively used)
import { Collapse, Dropdown, Modal, Tab, Toast, Tooltip } from 'bootstrap';

// Import our custom modules
import { ThemeManager } from './utils/theme-manager.js';
import { NotificationManager } from './utils/notifications.js';
import { SidebarManager } from './components/sidebar.js';
import { activeVariant } from './config/variants.js';
import { createDemoState } from './data/mock-data.js';
import {
  globalSearch,
  projectContext,
  homeOverview,
  modulePreview,
  initShellActions,
} from './components/shell.js';
import { dashboardView, projectsList, projectDetail } from './components/project-views.js';
import {
  budgetsList,
  budgetDetail,
  purchasesList,
  purchaseDetail,
} from './components/commercial-views.js';
import { expensesList, expenseDetail } from './components/expense-views.js';
import { expenseReviewList, expenseReviewDetail } from './components/expense-review-views.js';
import { personnelWorkspace, workerDetail } from './components/personnel-views.js';
import { warehouseWorkspace, materialDetail } from './components/warehouse-views.js';
import { costWorkspace } from './components/cost-views.js';
import { documentsWorkspace, documentDetail } from './components/document-views.js';
import { reportsWorkspace } from './components/report-views.js';
import { crmWorkspace } from './components/crm-views.js';
import { integrationsWorkspace } from './components/integration-views.js';
import { securityWorkspace } from './components/security-views.js';
import { administrationWorkspace } from './components/administration-views.js';
import { designSystemView } from './components/design-system-view.js';
import { initPresentationSwitcher } from './components/presentation-switcher.js';
import {
  approvalsView,
  syncApprovalCounters,
  worklistView,
} from './components/approvals-view.js';
import { budgetCreate, purchaseCreate } from './components/commercial-forms.js';
import {
  clientsList,
  clientDetail,
  suppliersList,
  supplierDetail,
} from './components/master-views.js';
import { initMaturityTags } from './utils/maturity.js';

import { statusClass } from './utils/status.js';
import { registerCountDirective, mountHeroNetworks } from './utils/motion.js';

// Import Alpine.js for reactive components
import Alpine from 'alpinejs';

// Import styles (Bootstrap Icons are included in SCSS)
// Inter, self-hosted. Replaces the render-blocking fonts.googleapis.com
// stylesheet that every page used to load: one fewer third-party origin on the
// critical path, no IP leak to a third party on first paint (a GDPR concern for
// EU deployments), and the template renders correctly offline. The variable
// font covers the full 100–900 range in a single file, so the weights the
// template uses (300/400/500/600/700) all come from one request.
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';

import '../styles/scss/main.scss';

// Application Class
class AdminApp {
  constructor() {
    this.isInitialized = false;
    this.variant = activeVariant;
    this.data = createDemoState(activeVariant);
  }

  // Initialize the application
  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize core managers
      this.themeManager = new ThemeManager();
      this.notificationManager = new NotificationManager();
      this.sidebarManager = new SidebarManager();

      // Initialize Bootstrap components
      this.initBootstrapComponents();

      // Setup global event listeners
      this.setupEventListeners();

      // Localize shortcut hints in search placeholders (⌘K on Mac, Ctrl+K elsewhere)
      this.localizeShortcutHints();

      // Initialize tooltips and popovers globally
      this.initTooltipsAndPopovers();

      // Initialize Alpine.js
      this.initAlpine();

      // Shared shell actions and current-module indicator
      initShellActions(this);

      // Network texture on hero panels (decorative canvas, resized with its box).
      this.stopHeroNetworks = mountHeroNetworks();

      // Hidden presentation switcher: triple click on the rail label or Alt+Shift+P.
      this.stopPresentationSwitcher = initPresentationSwitcher();

      // J&Y Demo: AS-IS / TO-BE / por validar badges (user menu or Alt+Shift+V).
      this.stopMaturityTags = initMaturityTags();

      // Header and rail counters reflect local approval decisions (Entrega 4).
      syncApprovalCounters();

      this.isInitialized = true;

      // Deliberately no "loaded successfully" toast here. Every one of the 21
      // pages fired a green success toast on load, which trained the user to
      // dismiss toasts without reading them — so the ones that carry real
      // information (a failed save, a deleted record) got ignored too. A tool
      // should not announce its own boot.
    } catch (error) {
      console.error('❌ Failed to initialize Admin App:', error);
    }
  }

  // Initialize Bootstrap components
  initBootstrapComponents() {
    // Initialize dropdowns
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((element) => {
      new Dropdown(element);
    });

    // Initialize modals
    document.querySelectorAll('.modal').forEach((element) => {
      new Modal(element);
    });

    // Initialize collapse elements (toggle:false — don't auto-open on construction)
    document.querySelectorAll('[data-bs-toggle="collapse"]').forEach((element) => {
      new Collapse(element, { toggle: false });
    });

    // Initialize tabs
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach((element) => {
      new Tab(element);
    });

    // Initialize toasts
    document.querySelectorAll('.toast').forEach((element) => {
      new Toast(element);
    });
  }

  // Initialize tooltips
  initTooltipsAndPopovers() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      new Tooltip(element);
    });
  }

  // Setup global event listeners
  setupEventListeners() {
    // Theme toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-theme-toggle]')) {
        this.themeManager.toggleTheme();
      }
    });

    // Full screen toggle
    document.addEventListener('click', (e) => {
      const fullscreenButton = e.target.closest('[data-fullscreen-toggle]');
      if (fullscreenButton) {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + K for search. event.code is layout-independent (KeyK regardless
    // of locale or modifier-shifted key value); event.key can vary by layout.
    const isSearchShortcut =
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      (event.code === 'KeyK' || event.key === 'k' || event.key === 'K');

    if (isSearchShortcut) {
      event.preventDefault();
      const searchInput = document.querySelector('[data-search-input]');
      if (searchInput) searchInput.focus();
    }
  }

  // Replace the literal "Ctrl+K" placeholder hint with the platform-correct one.
  // Mac users expect ⌘K, not Ctrl+K — and the keydown handler already accepts both.
  localizeShortcutHints() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(
      (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''
    );
    if (!isMac) return; // Ctrl+K is already correct for Windows/Linux

    document.querySelectorAll('[data-search-input]').forEach((el) => {
      if (el.placeholder && el.placeholder.includes('Ctrl+K')) {
        el.placeholder = el.placeholder.replace('Ctrl+K', '⌘K'); // ⌘K
      }
    });
  }

  // Toggle fullscreen
  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }

  // Initialize Alpine.js
  initAlpine() {
    // Shared helpers available in every template: `$statusClass(status)`.
    Alpine.magic('statusClass', () => statusClass);
    // Figures count up to their value (`x-count`, `x-count.money`, `x-count.pct`).
    registerCountDirective(Alpine);

    // Register Alpine data components
    Alpine.data('globalSearch', globalSearch);
    Alpine.data('projectContext', projectContext);
    Alpine.data('homeOverview', homeOverview);
    Alpine.data('modulePreview', modulePreview);
    Alpine.data('dashboardView', dashboardView);
    Alpine.data('projectsList', projectsList);
    Alpine.data('projectDetail', projectDetail);
    Alpine.data('budgetsList', budgetsList);
    Alpine.data('budgetDetail', budgetDetail);
    Alpine.data('purchasesList', purchasesList);
    Alpine.data('purchaseDetail', purchaseDetail);
    Alpine.data('expensesList', expensesList);
    Alpine.data('expenseDetail', expenseDetail);
    Alpine.data('expenseReviewList', expenseReviewList);
    Alpine.data('expenseReviewDetail', expenseReviewDetail);
    Alpine.data('personnelWorkspace', personnelWorkspace);
    Alpine.data('workerDetail', workerDetail);
    Alpine.data('warehouseWorkspace', warehouseWorkspace);
    Alpine.data('materialDetail', materialDetail);
    Alpine.data('costWorkspace', costWorkspace);
    Alpine.data('designSystemView', designSystemView);
    Alpine.data('approvalsView', approvalsView);
    Alpine.data('worklistView', worklistView);
    Alpine.data('budgetCreate', budgetCreate);
    Alpine.data('purchaseCreate', purchaseCreate);
    Alpine.data('documentsWorkspace', documentsWorkspace);
    Alpine.data('documentDetail', documentDetail);
    Alpine.data('reportsWorkspace', reportsWorkspace);
    Alpine.data('crmWorkspace', crmWorkspace);
    Alpine.data('integrationsWorkspace', integrationsWorkspace);
    Alpine.data('securityWorkspace', securityWorkspace);
    Alpine.data('administrationWorkspace', administrationWorkspace);
    Alpine.data('clientsList', clientsList);
    Alpine.data('clientDetail', clientDetail);
    Alpine.data('suppliersList', suppliersList);
    Alpine.data('supplierDetail', supplierDetail);

    Alpine.data('themeSwitch', () => ({
      currentTheme: 'light',

      init() {
        this.currentTheme = window.AdminApp.themeManager.getCurrentTheme();
      },

      toggle() {
        window.AdminApp.themeManager.toggleTheme();
        this.currentTheme = window.AdminApp.themeManager.getCurrentTheme();
      },
    }));

    // Start Alpine.js
    Alpine.start();
    window.Alpine = Alpine;
  }

  // Cleanup method
  destroy() {
    this.stopHeroNetworks?.();
    this.stopPresentationSwitcher?.();
    this.stopMaturityTags?.();
    this.isInitialized = false;
  }
}

// Create global app instance
const app = new AdminApp();

// Alpine's theme scope reads the app during start-up.
window.AdminApp = app;

// Initialize app when module loads
app.init();

// Tear down on page hide so listeners/intervals don't leak across SPA-style nav
window.addEventListener('pagehide', () => app.destroy(), { once: true });

// Export the app instance for module imports
export default app;
