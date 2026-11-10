import { VARIANT_IDS, getVariantConfig } from '../src-modern/scripts/config/variants.js';
import {
  MODULES,
  NAV_GROUPS,
  moduleHref,
  moduleLabel,
} from '../src-modern/scripts/config/modules.js';
import {
  getDataForVariant,
  getPendingApprovals,
  getShellNotifications,
  projectShortName,
} from '../src-modern/scripts/data/mock-data.js';

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]
  );

const formatMoney = (amount) =>
  `S/ ${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;

// --------------------------------------------------------------------------
// Brand palette. Each variant declares two colours (primary, accent); the
// rest of the palette is derived here so light and dark themes stay legible.
// --------------------------------------------------------------------------
const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
};
const rgbToHex = (rgb) =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
const mix = (hex, target, amount) => {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  return rgbToHex(from.map((channel, index) => channel + (to[index] - channel) * amount));
};
const rgbList = (hex) => hexToRgb(hex).join(', ');

function brandTokens(theme) {
  const { primary, accent } = theme;
  const light = {
    // Text and identity (titles, eyebrow, active nav label).
    'brand-primary': primary,
    // Interaction signal: links, active indicator, focus, chart series 1.
    'brand-accent': accent,
    'brand-accent-rgb': rgbList(accent),
    'brand-accent-hover': mix(accent, '#000000', 0.2),
    'brand-accent-subtle': mix(accent, '#ffffff', 0.9),
    'brand-accent-border': mix(accent, '#ffffff', 0.7),
    // Solid fill for the primary button.
    'brand-solid': primary,
    'brand-solid-rgb': rgbList(primary),
    'brand-solid-hover': mix(primary, '#000000', 0.18),
    'brand-solid-active': mix(primary, '#000000', 0.28),
    'brand-surface': theme.surface,
  };
  const dark = {
    'brand-primary': mix(accent, '#ffffff', 0.72),
    'brand-accent': mix(accent, '#ffffff', 0.38),
    'brand-accent-rgb': rgbList(mix(accent, '#ffffff', 0.38)),
    'brand-accent-hover': mix(accent, '#ffffff', 0.58),
    'brand-accent-subtle': mix(accent, '#111827', 0.78),
    'brand-accent-border': mix(accent, '#111827', 0.45),
    'brand-solid': accent,
    'brand-solid-rgb': rgbList(accent),
    'brand-solid-hover': mix(accent, '#ffffff', 0.12),
    'brand-solid-active': mix(accent, '#ffffff', 0.2),
  };
  const declarations = (tokens) =>
    Object.entries(tokens)
      .map(([name, value]) => `--${name}:${value}`)
      .join(';');
  return `:root{${declarations(light)}}html[data-bs-theme="dark"]{${declarations(dark)}}`;
}

// The supplied logo files keep wide empty margins. The image itself is shown
// unaltered; its frame clips the margins away. Sizes scale with --logo-h.
function logoTokens(company) {
  const rule = (theme, [x, y, width, height, imageWidth]) =>
    `.shell-brand .shell-logo-frame--${theme}{width:calc(var(--logo-h) * ${(width / height).toFixed(4)})}` +
    `.shell-brand .shell-logo-frame .shell-logo--${theme}{width:calc(var(--logo-h) * ${(imageWidth / height).toFixed(4)});height:auto;max-width:none;` +
    `left:calc(var(--logo-h) * -${(x / height).toFixed(4)});top:calc(var(--logo-h) * -${(y / height).toFixed(4)})}`;
  return rule('light', company.logoLightBox) + rule('dark', company.logoDarkBox);
}

const NOTIFICATION_ICONS = {
  approval: 'bi-check2-square',
  warning: 'bi-exclamation-triangle',
  error: 'bi-x-octagon',
  info: 'bi-info-circle',
  system: 'bi-gear',
};

function renderNotificationItem(item) {
  const href = item.href || moduleHref(item.moduleId, item.recordId);
  return `<li><a class="dropdown-item shell-notification shell-notification--${escapeHtml(item.level)}" href="${href}"><i class="bi ${NOTIFICATION_ICONS[item.level] || NOTIFICATION_ICONS.info}" aria-hidden="true"></i><span><small>${escapeHtml(item.category)}</small>${escapeHtml(item.text)}</span></a></li>`;
}

function renderApprovalItem(item) {
  return `<li><a class="dropdown-item shell-approval" href="${moduleHref(item.moduleId, item.id)}"><span><small>${escapeHtml(item.kind)} · ${escapeHtml(item.projectId)}</small><strong>${escapeHtml(item.id)}</strong></span><span class="shell-approval-amount">${formatMoney(item.amount)}</span></a></li>`;
}

function renderHeader(variant, data) {
  const notifications = getShellNotifications(data, variant);
  const approvals = getPendingApprovals(data, variant);
  const company = variant.company;
  const user = variant.user;
  const projectOptions = data.projects
    .map(
      (project) =>
        `<option value="${escapeHtml(project.id)}" title="${escapeHtml(project.name)}">${escapeHtml(project.id)} · ${escapeHtml(projectShortName(project.name))}</option>`
    )
    .join('');
  const notificationItems = notifications.length
    ? notifications.map(renderNotificationItem).join('')
    : '<li><span class="dropdown-item-text text-body-secondary">No hay avisos pendientes.</span></li>';
  const approvalItems = approvals.length
    ? approvals.map(renderApprovalItem).join('')
    : '<li><span class="dropdown-item-text text-body-secondary">No hay aprobaciones pendientes.</span></li>';

  return `
    <header class="admin-header shell-header">
      <nav class="navbar" aria-label="Barra superior">
        <div class="container-fluid shell-header-grid">
          <button class="hamburger-menu shell-menu-toggle" type="button" data-sidebar-toggle aria-label="Abrir menú lateral">
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
          <a class="navbar-brand shell-brand" href="./index.html" aria-label="${escapeHtml(company.name)}: ir al Panel General">
            <span class="shell-logo-frame shell-logo-frame--light"><img class="shell-logo shell-logo--light" src="./${escapeHtml(company.logoLight)}" alt="Logo de ${escapeHtml(company.shortName)}"></span>
            <span class="shell-logo-frame shell-logo-frame--dark"><img class="shell-logo shell-logo--dark" src="./${escapeHtml(company.logoDark)}" alt="" aria-hidden="true"></span>
          </a>
          <div class="shell-search" x-data="globalSearch" @click.outside="close()">
            <label class="visually-hidden" for="global-search">Búsqueda global</label>
            <i class="bi bi-search shell-search-icon" aria-hidden="true"></i>
            <input id="global-search" type="search" class="form-control" placeholder="Buscar proyectos, clientes, documentos, órdenes..." autocomplete="off"
              x-model="query" @input="search()" @focus="search()" @keydown.enter.prevent="openFirst()" @keydown.escape="close()"
              :aria-expanded="String(isOpen)" aria-controls="global-search-results" data-search-input>
            <div id="global-search-results" class="shell-search-results" x-show="isOpen" x-cloak role="region" aria-label="Resultados de búsqueda">
              <template x-if="results.length === 0"><p class="shell-search-empty" x-text="query.trim().length < 2 ? 'Escribe al menos dos caracteres.' : 'No se encontraron resultados.'"></p></template>
              <template x-for="result in results" :key="result.key">
                <a class="shell-search-result" :href="result.href">
                  <span><strong x-text="result.title"></strong><small x-text="result.subtitle"></small></span>
                  <span class="shell-search-kind" x-text="result.kind"></span>
                </a>
              </template>
            </div>
          </div>
          <div class="shell-project" x-data="projectContext" @project-change.window="projectId = $event.detail.projectId">
            <label for="global-project-select">Proyecto actual</label>
            <select id="global-project-select" class="form-select form-select-sm" x-model="projectId" @change="setProject($event.target.value)" aria-label="Proyecto actual">
              ${projectOptions}
            </select>
          </div>
          <div class="navbar-nav shell-header-actions flex-row">
            <span class="shell-demo-badge" title="Todos los registros de esta aplicación son ficticios">
              <i class="bi bi-info-circle" aria-hidden="true"></i><span class="shell-demo-badge-long">Datos de demostración</span><span class="shell-demo-badge-short">Demo</span>
            </span>
            <div class="dropdown">
              <button class="btn shell-icon-button position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aprobaciones: ${approvals.length} pendientes" title="Aprobaciones pendientes">
                <i class="bi bi-check2-square" aria-hidden="true"></i>
                ${approvals.length ? `<span class="shell-notification-count">${approvals.length}</span>` : ''}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shell-approval-menu">
                <li><h6 class="dropdown-header">Aprobaciones pendientes</h6></li>
                ${approvalItems}
              </ul>
            </div>
            <div x-data="themeSwitch">
              <button class="btn shell-icon-button" type="button" @click="toggle()" :aria-label="currentTheme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'" title="Cambiar tema">
                <i class="bi bi-moon" x-show="currentTheme === 'light'" aria-hidden="true"></i>
                <i class="bi bi-sun" x-show="currentTheme === 'dark'" x-cloak aria-hidden="true"></i>
              </button>
            </div>
            <div class="dropdown">
              <button class="btn shell-icon-button position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notificaciones: ${notifications.length} pendientes" title="Notificaciones">
                <i class="bi bi-bell" aria-hidden="true"></i>
                ${notifications.length ? `<span class="shell-notification-count">${notifications.length}</span>` : ''}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shell-notification-menu">
                <li><h6 class="dropdown-header">Notificaciones</h6></li>
                ${notificationItems}
              </ul>
            </div>
            <div class="dropdown">
              <button class="btn shell-user-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de usuario: ${escapeHtml(user.name)}, ${escapeHtml(user.role)}">
                <span class="shell-user-avatar" aria-hidden="true">${escapeHtml(user.initials)}</span>
                <span class="shell-user-label"><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.role)}</small></span>
                <i class="bi bi-chevron-down shell-user-chevron" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><span class="dropdown-header">${escapeHtml(user.name)} · ${escapeHtml(user.role)}</span></li>
                <li><button class="dropdown-item" type="button" data-shell-action="profile"><i class="bi bi-person me-2" aria-hidden="true"></i>Perfil</button></li>
                <li><button class="dropdown-item" type="button" data-shell-action="settings"><i class="bi bi-gear me-2" aria-hidden="true"></i>Configuración</button></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item" type="button" data-shell-action="logout"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Cerrar sesión</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </header>`;
}

function renderSidebar(variant) {
  const sections = NAV_GROUPS.map((group) => {
    const ids = group.modules.filter((id) => variant.enabledModules.includes(id));
    if (!ids.length) return '';
    const links = ids
      .map((id) => {
        const item = MODULES[id];
        return `<li class="nav-item"><a class="nav-link" data-module="${id}" href="${moduleHref(id)}" title="${escapeHtml(moduleLabel(id, variant))}"><i class="bi ${item.icon}" aria-hidden="true"></i><span>${escapeHtml(moduleLabel(id, variant))}</span></a></li>`;
      })
      .join('');
    return `<div class="shell-nav-group"><small>${group.label}</small><ul class="nav flex-column">${links}</ul></div>`;
  }).join('');

  return `<aside class="admin-sidebar" id="admin-sidebar" aria-label="Navegación principal"><div class="sidebar-content"><nav class="sidebar-nav" aria-label="Módulos">${sections}</nav></div></aside>`;
}

function renderFooter(variant) {
  return `<footer class="admin-footer shell-footer"><div class="container-fluid"><span>${escapeHtml(variant.company.name)} · Plataforma de Gestión y Control de Proyectos</span><span>Datos ficticios con fines de demostración</span></div></footer>`;
}

export function appShellPlugin(mode) {
  const variant = getVariantConfig(VARIANT_IDS.includes(mode) ? mode : 'surtec-peti');
  const data = getDataForVariant(variant);
  const manifest = JSON.stringify(
    {
      name: `${variant.company.name} · Gestión de proyectos (demo)`,
      short_name: variant.company.shortName,
      description: 'Mockup frontend de gestión de proyectos con datos ficticios.',
      start_url: './index.html',
      scope: './',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: variant.theme.primary,
      icons: [
        { src: './assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2
  );

  return {
    name: 'mockup-shared-shell',
    configureServer(server) {
      server.middlewares.use('/manifest.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        response.end(manifest);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: manifest });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('<!-- APP_HEADER -->')) return html;

        const themeKey = `mockup-erp:${variant.id}:theme`;
        const brandStyle = `<style>${brandTokens(variant.theme)}${logoTokens(variant.company)}</style>`;
        const earlyTheme = `<script>try{document.documentElement.dataset.bsTheme=localStorage.getItem(${JSON.stringify(themeKey)})||'light'}catch{document.documentElement.dataset.bsTheme='light'}</script>`;

        return html
          .replace('<html lang="en"', '<html lang="es"')
          .replace(
            '</head>',
            `<link rel="manifest" href="./manifest.json">${brandStyle}${earlyTheme}</head>`
          )
          .replace('<!-- APP_HEADER -->', renderHeader(variant, data))
          .replace('<!-- APP_SIDEBAR -->', renderSidebar(variant))
          .replace('<!-- APP_FOOTER -->', renderFooter(variant))
          .replace(
            /<meta name="theme-color" content="[^"]*">/,
            `<meta name="theme-color" content="${variant.theme.primary}">`
          );
      },
    },
  };
}
