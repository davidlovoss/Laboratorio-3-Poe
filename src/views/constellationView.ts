import { type Constellation, MOODS, type Mood } from '../models/constellation';

export type FilterMood = 'todas' | Mood;

export interface ViewState {
  filter: FilterMood;
  search: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function randomGenerator(seed: number): () => number {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawConstellation(seed: number, color: string, name: string, prefix: string): string {
  const random = randomGenerator(seed);
  const stars = Array.from({ length: 50 }, () => ({
    x: Math.round(22 + random() * 476),
    y: Math.round(20 + random() * 345),
    r: (0.45 + random() * 1.25).toFixed(2),
    opacity: (0.16 + random() * 0.48).toFixed(2),
  }));
  const mainStars = Array.from({ length: 7 }, (_, i) => ({
    x: Math.round(55 + i * 67 + (random() - 0.5) * 50),
    y: Math.round(79 + random() * 208),
    r: (2.7 + random() * 1.8).toFixed(1),
  }));
  const line = mainStars.map((point) => `${point.x},${point.y}`).join(' ');
  const gradientId = `nebula-${prefix}`;
  const glowId = `glow-${prefix}`;
  const backgroundStars = stars.map((star) => `<circle cx="${star.x}" cy="${star.y}" r="${star.r}" fill="#fff" opacity="${star.opacity}"/>`).join('');
  const connectedStars = mainStars.map((star) => `
    <circle cx="${star.x}" cy="${star.y}" r="14" fill="${color}" opacity=".075"/>
    <circle cx="${star.x}" cy="${star.y}" r="${star.r}" fill="#fff" filter="url(#${glowId})"/>
    <circle cx="${star.x}" cy="${star.y}" r="${star.r}" fill="${color}"/>`).join('');

  return `<svg class="star-map" viewBox="0 0 520 375" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Constelación única de ${escapeHtml(name)}">
    <defs>
      <radialGradient id="${gradientId}" cx="50%" cy="47%" r="60%">
        <stop stop-color="${color}" stop-opacity=".12"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${glowId}" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.9" /></filter>
    </defs>
    <rect width="520" height="375" fill="url(#${gradientId})"/>
    <circle cx="315" cy="156" r="114" stroke="${color}" stroke-opacity=".08" fill="none"/>
    <circle cx="315" cy="156" r="168" stroke="${color}" stroke-opacity=".06" fill="none"/>
    ${backgroundStars}
    <polyline points="${line}" fill="none" stroke="${color}" stroke-opacity=".53" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    ${connectedStars}
  </svg>`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00`));
}

function formatIndex(index: number): string {
  return String(index + 1).padStart(3, '0');
}

function cardTemplate(item: Constellation, index: number): string {
  const mood = MOODS[item.mood];
  return `<article class="memory-card" style="--mood-color:${mood.accent}">
    <div class="card-art">
      ${drawConstellation(item.seed, mood.accent, item.title, `card-${item.id}`)}
      <span class="card-number">CONSTELACIÓN / ${formatIndex(index)}</span>
      <span class="card-mood"><span aria-hidden="true">✦</span> ${mood.name}</span>
    </div>
    <div class="card-details">
      <div class="card-date">${formatDate(item.event_date)} <span>·</span> ${mood.adjective}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.story)}</p>
      <div class="card-actions">
        <button type="button" class="text-action" data-action="edit" data-id="${item.id}" aria-label="Editar ${escapeHtml(item.title)}">Editar <span aria-hidden="true">↗</span></button>
        <button type="button" class="icon-action" data-action="delete" data-id="${item.id}" aria-label="Eliminar ${escapeHtml(item.title)}" title="Eliminar constelación">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

export class ConstellationView {
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(readonly root: HTMLDivElement) {}

  render(records: Constellation[], state: ViewState): void {
    this.root.innerHTML = `
      <div class="ambient-glow" aria-hidden="true"></div>
      <div class="site-shell">
        <header class="site-header">
          <a href="#inicio" class="brand" aria-label="Constelario, ir al inicio"><span class="brand-mark">✧</span><span>constelario<span class="brand-period">.</span></span></a>
          <nav aria-label="Navegación principal" class="top-nav"><a href="#galeria">Mi universo</a><span class="nav-separator" aria-hidden="true"></span><span class="nav-status"><span class="status-led"></span> SQLite activo</span></nav>
        </header>
        <main id="inicio">
          <section class="hero" aria-labelledby="hero-title">
            <div class="hero-copy">
              <div class="eyebrow"><span class="eyebrow-line"></span> UN ARCHIVO DE LO EXTRAORDINARIO</div>
              <h1 id="hero-title">Cada recuerdo<br/>merece su propia <em>constelación.</em></h1>
              <p>Hay momentos que no queremos olvidar. Transfórmalos en pequeños universos, ponles nombre y déjalos brillar para siempre.</p>
              <div class="hero-ctas"><button type="button" class="button primary" data-action="new">Crear mi constelación <span aria-hidden="true">↗</span></button><a class="button secondary" href="#galeria">Explorar mi universo <span aria-hidden="true">↓</span></a></div>
              <div class="hero-footnote"><span class="tiny-star">✦</span> Un universo privado, guardado en este navegador.</div>
            </div>
            <div class="hero-art" aria-label="Ilustración de constelación digital">
              <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
              <div class="hero-art-top"><span>FIG. 001 — CARTOGRAFÍA EMOCIONAL</span><span>✧</span></div>
              ${drawConstellation(202617, '#cfb8ff', 'un recuerdo especial', 'hero')}
              <div class="hero-art-bottom"><span class="hero-art-code">01 / ∞</span><div><strong>Lo invisible también brilla.</strong><span>LAT. 13°42′ · UNIVERSO PERSONAL</span></div></div>
              <div class="hero-orbit-label">✳ &nbsp; LOS INSTANTES NOS CONECTAN</div>
            </div>
          </section>
          <section class="gallery-section" id="galeria" aria-labelledby="gallery-title">
            <div class="section-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> LA COLECCIÓN</div><h2 id="gallery-title">Mi pequeño <em>universo</em><span class="heading-star" aria-hidden="true"> ✧</span></h2><p>Fragmentos de vida convertidos en estrellas.</p></div><div class="collection-stat"><strong id="total-count">${records.length.toString().padStart(2, '0')}</strong><span>recuerdos<br/>en órbita</span></div></div>
            <div class="toolbar"><div class="filter-group" role="group" aria-label="Filtrar por emoción" id="mood-filters"></div><label class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><span class="sr-only">Buscar constelaciones</span><input id="search-input" type="search" placeholder="Buscar un recuerdo..." maxlength="80" value="${escapeHtml(state.search)}" /></label></div>
            <div class="gallery-meta"><span id="results-label" aria-live="polite"></span><button type="button" class="backup-link" data-action="backup" title="Descarga una base de datos SQLite auténtica">↓ Guardar copia .sqlite</button></div>
            <div id="constellations-grid" class="constellations-grid"></div>
          </section>
          <section class="closing-banner"><span class="closing-icon" aria-hidden="true">✳</span><div><h2>El universo sigue creciendo.</h2><p>¿Qué momento merece convertirse en estrella?</p></div><button type="button" class="button primary" data-action="new">Añadir otro recuerdo <span aria-hidden="true">↗</span></button></section>
        </main>
        <footer class="site-footer"><span class="footer-brand">✧ constelario.</span><span>Hecho de instantes, luz y un poquito de SQLite.</span><span>Los datos permanecen en este navegador · ${new Date().getFullYear()}</span></footer>
      </div>
      ${this.dialogsTemplate()}
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
    this.updateCollection(records, state);
  }

  updateCollection(records: Constellation[], state: ViewState): void {
    const moodOptions: Array<[FilterMood, string]> = [['todas', 'Todas'], ...Object.entries(MOODS).map(([key, value]) => [key as Mood, value.name] as [Mood, string])];
    const filterContainer = this.root.querySelector('#mood-filters');
    if (filterContainer) filterContainer.innerHTML = moodOptions.map(([key, label]) => `<button type="button" class="filter-pill ${key === state.filter ? 'active' : ''}" data-action="filter" data-filter="${key}" aria-pressed="${key === state.filter}">${label}</button>`).join('');

    const search = state.search.trim().toLocaleLowerCase('es');
    const filtered = records.filter((item) =>
      (state.filter === 'todas' || item.mood === state.filter) &&
      (!search || `${item.title} ${item.story} ${MOODS[item.mood].name}`.toLocaleLowerCase('es').includes(search))
    );
    const grid = this.root.querySelector('#constellations-grid');
    if (grid) grid.innerHTML = filtered.length ? filtered.map((item, index) => cardTemplate(item, index)).join('') : `
      <div class="empty-state"><span aria-hidden="true">✧</span><h3>Por aquí todavía no hay estrellas.</h3><p>${records.length ? 'Prueba otra emoción o cambia tu búsqueda.' : 'Crea tu primera constelación y comienza a llenar el cielo.'}</p><button type="button" class="button secondary" data-action="${records.length ? 'clear-filters' : 'new'}">${records.length ? 'Ver todas las constelaciones' : 'Crear mi primera constelación'} ↗</button></div>`;
    const label = this.root.querySelector('#results-label');
    if (label) label.textContent = `${filtered.length} de ${records.length} constelaciones`;
    const counter = this.root.querySelector('#total-count');
    if (counter) counter.textContent = records.length.toString().padStart(2, '0');
  }

  openEditor(record: Constellation | null): void {
    const dialog = this.root.querySelector<HTMLDialogElement>('#editor-dialog');
    const form = this.root.querySelector<HTMLFormElement>('#constellation-form');
    if (!dialog || !form) return;
    form.reset();
    form.dataset.editId = record ? String(record.id) : '';
    const heading = dialog.querySelector('#editor-title');
    if (heading) heading.textContent = record ? 'Editar constelación' : 'Crear constelación';
    const button = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (button) button.innerHTML = record ? 'Guardar cambios <span aria-hidden="true">↗</span>' : 'Encender esta estrella <span aria-hidden="true">↗</span>';
    (form.elements.namedItem('title') as HTMLInputElement).value = record?.title ?? '';
    (form.elements.namedItem('story') as HTMLTextAreaElement).value = record?.story ?? '';
    (form.elements.namedItem('mood') as HTMLSelectElement).value = record?.mood ?? 'alegria';
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    (form.elements.namedItem('event_date') as HTMLInputElement).value = record?.event_date ?? localToday;
    dialog.showModal();
  }

  openDelete(record: Constellation): void {
    const dialog = this.root.querySelector<HTMLDialogElement>('#delete-dialog');
    if (!dialog) return;
    dialog.dataset.deleteId = String(record.id);
    const name = dialog.querySelector('#delete-name');
    if (name) name.textContent = record.title;
    dialog.showModal();
  }

  closeEditor(): void { this.root.querySelector<HTMLDialogElement>('#editor-dialog')?.close(); }
  closeDelete(): void { this.root.querySelector<HTMLDialogElement>('#delete-dialog')?.close(); }

  notify(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    const toast = this.root.querySelector<HTMLDivElement>('#toast');
    if (!toast) return;
    toast.textContent = `${type === 'success' ? '✦' : '!' }  ${message}`;
    toast.className = `toast visible ${type}`;
    this.toastTimer = setTimeout(() => { toast.className = 'toast'; }, 4000);
  }

  private dialogsTemplate(): string {
    return `<dialog id="editor-dialog" class="dialog" aria-labelledby="editor-title">
      <form id="constellation-form" class="dialog-content">
        <button type="button" class="dialog-close" data-action="close-editor" aria-label="Cerrar">×</button>
        <div class="eyebrow"><span class="eyebrow-line"></span> TU PEQUEÑO UNIVERSO</div>
        <h2 id="editor-title">Crear constelación</h2>
        <p class="dialog-subtitle">Ponle un nombre a ese instante que merece seguir brillando.</p>
        <div class="field"><label for="memory-title">¿Cómo llamarás a este recuerdo?</label><input id="memory-title" name="title" type="text" placeholder="Ej. Una tarde que cambió todo" minlength="3" maxlength="65" required /></div>
        <div class="field"><label for="memory-story">Cuéntanos su historia</label><textarea id="memory-story" name="story" rows="4" minlength="5" maxlength="550" placeholder="Escribe lo que hizo especial este momento..." required></textarea></div>
        <div class="two-fields"><div class="field"><label for="memory-mood">¿Qué emoción representa?</label><select id="memory-mood" name="mood" required>${Object.entries(MOODS).map(([slug, mood]) => `<option value="${slug}">${mood.name}</option>`).join('')}</select></div><div class="field"><label for="memory-date">¿Cuándo ocurrió?</label><input id="memory-date" name="event_date" type="date" required /></div></div>
        <div class="editor-hint"><span aria-hidden="true">✧</span> Cada recuerdo genera una constelación irrepetible.</div>
        <button type="submit" class="button primary submit-button">Encender esta estrella <span aria-hidden="true">↗</span></button>
      </form>
    </dialog>
    <dialog id="delete-dialog" class="dialog small-dialog" aria-labelledby="delete-title"><div class="dialog-content"><button type="button" class="dialog-close" data-action="close-delete" aria-label="Cerrar">×</button><div class="delete-symbol">✧</div><h2 id="delete-title">¿Apagar esta estrella?</h2><p>Eliminarás <strong id="delete-name"></strong>. Esta acción no se puede deshacer.</p><div class="delete-actions"><button type="button" class="button secondary" data-action="close-delete">Conservarla</button><button type="button" class="button danger" data-action="confirm-delete">Sí, eliminar</button></div></div></dialog>`;
  }
}
