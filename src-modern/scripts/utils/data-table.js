// Shared table behaviour for every ERP list (DESIGN.md › Tabla): sorting,
// pagination and "applied filter" chips. Plain methods only, no getters, so
// it is safe to spread into an Alpine component (see CLAUDE.md).
//
// Usage inside a component:
//   ...tableControls({ sortKey: 'id', accessors: { id: (row) => row.id } }),
//   get rows() { return this.paginate(this.applySort(this.filteredRows)); }
//
// Filter chips read the component's own filter fields:
//   chipDefs: [{ key: 'status', label: 'Estado' }]
//   activeChips() → [{ key, label, value }]; clearChip(key) empties the field and
//   calls `onFiltersChange()` when the component defines it.

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export function tableControls({
  sortKey = '',
  sortDir = 'asc',
  pageSize = 10,
  accessors = {},
  chipDefs = [],
} = {}) {
  return {
    sortKey,
    sortDir,
    page: 1,
    pageSize,
    chipDefs,

    // ---- Sorting -------------------------------------------------------
    sortBy(key) {
      if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      else {
        this.sortKey = key;
        this.sortDir = 'asc';
      }
      this.page = 1;
    },
    ariaSort(key) {
      if (this.sortKey !== key) return 'none';
      return this.sortDir === 'asc' ? 'ascending' : 'descending';
    },
    sortIcon(key) {
      if (this.sortKey !== key) return 'bi-arrow-down-up';
      return this.sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
    },
    applySort(rows) {
      const read = accessors[this.sortKey];
      if (!read) return rows;
      const direction = this.sortDir === 'asc' ? 1 : -1;
      return [...rows].sort((a, b) => {
        const left = read(a);
        const right = read(b);
        if (typeof left === 'number' && typeof right === 'number')
          return (left - right) * direction;
        return collator.compare(String(left ?? ''), String(right ?? '')) * direction;
      });
    },

    // ---- Pagination ----------------------------------------------------
    pageCount(rows) {
      return Math.max(1, Math.ceil(rows.length / this.pageSize));
    },
    paginate(rows) {
      const last = this.pageCount(rows);
      if (this.page > last) this.page = last;
      const start = (this.page - 1) * this.pageSize;
      return rows.slice(start, start + this.pageSize);
    },
    goToPage(page, rows) {
      this.page = Math.min(Math.max(1, page), this.pageCount(rows));
    },
    pageNumbers(rows) {
      return Array.from({ length: this.pageCount(rows) }, (_, index) => index + 1);
    },
    rangeLabel(rows) {
      if (!rows.length) return 'Sin resultados';
      const start = (this.page - 1) * this.pageSize + 1;
      const end = Math.min(rows.length, this.page * this.pageSize);
      return `${start}–${end} de ${rows.length}`;
    },

    // ---- Applied filter chips ------------------------------------------
    activeChips() {
      return this.chipDefs
        .filter((def) => String(this[def.key] ?? '').trim())
        .map((def) => ({
          key: def.key,
          label: def.label,
          value: def.format ? def.format(this[def.key]) : String(this[def.key]).trim(),
        }));
    },
    clearChip(key) {
      this[key] = '';
      this.page = 1;
      if (typeof this.onFiltersChange === 'function') this.onFiltersChange();
    },
  };
}
