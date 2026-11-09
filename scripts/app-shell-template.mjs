import { VARIANT_IDS, getVariantConfig } from '../src-modern/scripts/config/variants.js';
import {
  MODULES,
  NAV_GROUPS,
  moduleHref,
  moduleLabel,
} from '../src-modern/scripts/config/modules.js';
import { getDataForVariant, getShellNotifications } from '../src-modern/scripts/data/mock-data.js';

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

function renderHeader(variant, data) {
  const notifications = getShellNotifications(data, variant);
  const company = variant.company;
  const projectOptions = data.projects
    .map(
      (project) =>
        `<option value="${escapeHtml(project.id)}">${escapeHtml(project.id)} · ${escapeHtml(project.name)}</option>`
    )
    .join('');
  const notificationItems = notifications.length
    ? notifications
        .map(
          (item) =>
            `<li><a class="dropdown-item shell-notification" href="${moduleHref(item.moduleId, item.recordId)}"><span class="shell-notification-dot shell-notification-dot--${escapeHtml(item.level)}" aria-hidden="true"></span><span>${escapeHtml(item.text)}</span></a></li>`
        )
        .join('')
    : '<li><span class="dropdown-item-text text-muted">No hay avisos pendientes.</span></li>';
  const brandName =
    variant.id === 'surtec-peti'
      ? `<span class="shell-brand-name">${escapeHtml(company.shortName)}</span>`
      : '';

  return `
    <header class="admin-header shell-header">
      <nav class="navbar" aria-label="Barra superior">
        <div class="container-fluid shell-header-grid">
          <button class="hamburger-menu shell-menu-toggle" type="button" data-sidebar-toggle aria-label="Abrir menú lateral">
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
          <a class="navbar-brand shell-brand" href="./index.html" aria-label="Ir a Inicio de ${escapeHtml(company.shortName)}">
            <img class="shell-logo shell-logo--light" src="./${escapeHtml(company.logoLight)}" alt="Logo de ${escapeHtml(company.shortName)}">
            <img class="shell-logo shell-logo--dark" src="./${escapeHtml(company.logoDark)}" alt="" aria-hidden="true">
            ${brandName}
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
            <div x-data="themeSwitch">
              <button class="btn shell-icon-button" type="button" @click="toggle()" :aria-label="currentTheme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'" title="Cambiar tema">
                <i class="bi bi-moon-fill" x-show="currentTheme === 'light'" aria-hidden="true"></i>
                <i class="bi bi-sun-fill" x-show="currentTheme === 'dark'" x-cloak aria-hidden="true"></i>
              </button>
            </div>
            <div class="dropdown">
              <button class="btn shell-icon-button position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notificaciones: ${notifications.length} pendientes">
                <i class="bi bi-bell" aria-hidden="true"></i>
                ${notifications.length ? `<span class="shell-notification-count">${notifications.length}</span>` : ''}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shell-notification-menu">
                <li><h6 class="dropdown-header">Notificaciones</h6></li>
                ${notificationItems}
              </ul>
            </div>
            <div class="dropdown">
              <button class="btn shell-user-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de usuario de demostración">
                <i class="bi bi-person" aria-hidden="true"></i><span class="shell-user-label">Usuario demo</span><i class="bi bi-chevron-down shell-user-chevron" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><span class="dropdown-header">Usuario demo · Administrador</span></li>
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

function renderFooter() {
  return `<footer class="admin-footer shell-footer"><div class="container-fluid"><span>Plataforma de gestión de proyectos</span><span>Datos de demostración</span></div></footer>`;
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
        const brandStyle = `<style>:root{--brand-primary:${variant.theme.primary};--brand-accent:${variant.theme.accent};--brand-surface:${variant.theme.surface}}</style>`;
        const earlyTheme = `<script>try{document.documentElement.dataset.bsTheme=localStorage.getItem(${JSON.stringify(themeKey)})||'light'}catch{document.documentElement.dataset.bsTheme='light'}</script>`;

        return html
          .replace('<html lang="en"', '<html lang="es"')
          .replace(
            '</head>',
            `<link rel="manifest" href="./manifest.json">${brandStyle}${earlyTheme}</head>`
          )
          .replace('<!-- APP_HEADER -->', renderHeader(variant, data))
          .replace('<!-- APP_SIDEBAR -->', renderSidebar(variant))
          .replace('<!-- APP_FOOTER -->', renderFooter())
          .replace(
            /<meta name="theme-color" content="[^"]*">/,
            `<meta name="theme-color" content="${variant.theme.primary}">`
          );
      },
    },
  };
}
