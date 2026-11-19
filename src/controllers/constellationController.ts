import { type ConstellationInput, ConstellationModel, MOODS } from '../models/constellation';
import { ConstellationView, type FilterMood, type ViewState } from '../views/constellationView';

export class ConstellationController {
  private readonly state: ViewState = { filter: 'todas', search: '' };

  constructor(private readonly model: ConstellationModel, private readonly view: ConstellationView) {}

  start(): void {
    this.render();
    this.view.root.addEventListener('click', (event) => this.onClick(event));
    this.view.root.addEventListener('input', (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.id === 'search-input') {
        this.state.search = target.value;
        this.view.updateCollection(this.model.list(), this.state);
      }
    });
    this.view.root.addEventListener('submit', (event) => this.onSubmit(event));
    this.view.root.addEventListener('click', (event) => {
      if (event.target instanceof HTMLDialogElement) event.target.close();
    });
  }

  private render(): void { this.view.render(this.model.list(), this.state); }

  private onClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const actionElement = target.closest<HTMLElement>('[data-action]');
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    const id = Number(actionElement.dataset.id);
    try {
      switch (action) {
        case 'new': this.view.openEditor(null); break;
        case 'edit': {
          const record = this.model.find(id);
          if (record) this.view.openEditor(record);
          break;
        }
        case 'delete': {
          const record = this.model.find(id);
          if (record) this.view.openDelete(record);
          break;
        }
        case 'confirm-delete': {
          const dialog = this.view.root.querySelector<HTMLDialogElement>('#delete-dialog');
          const recordId = Number(dialog?.dataset.deleteId);
          this.model.delete(recordId);
          this.view.closeDelete();
          this.render();
          this.view.notify('La constelación se eliminó correctamente.');
          break;
        }
        case 'close-editor': this.view.closeEditor(); break;
        case 'close-delete': this.view.closeDelete(); break;
        case 'filter': {
          const filter = actionElement.dataset.filter;
          if (filter === 'todas' || (filter && Object.prototype.hasOwnProperty.call(MOODS, filter))) {
            this.state.filter = filter as FilterMood;
            this.view.updateCollection(this.model.list(), this.state);
          }
          break;
        }
        case 'clear-filters': {
          this.state.filter = 'todas';
          this.state.search = '';
          const searchInput = this.view.root.querySelector<HTMLInputElement>('#search-input');
          if (searchInput) searchInput.value = '';
          this.view.updateCollection(this.model.list(), this.state);
          break;
        }
        case 'backup': this.downloadBackup(); break;
        default: break;
      }
    } catch (error) {
      this.view.notify(error instanceof Error ? error.message : 'Ocurrió un error inesperado.', 'error');
    }
  }

  private onSubmit(event: SubmitEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLFormElement) || target.id !== 'constellation-form') return;
    event.preventDefault();
    const data = new FormData(target);
    const input: ConstellationInput = {
      title: String(data.get('title') ?? ''),
      story: String(data.get('story') ?? ''),
      mood: String(data.get('mood') ?? ''),
      event_date: String(data.get('event_date') ?? ''),
    };
    try {
      const editId = Number(target.dataset.editId);
      if (editId) this.model.update(editId, input);
      else this.model.create(input);
      this.view.closeEditor();
      this.render();
      this.view.notify(editId ? 'Cambios guardados en SQLite.' : 'Una nueva estrella brilla en tu universo.');
      document.querySelector('#galeria')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      this.view.notify(error instanceof Error ? error.message : 'No se pudo guardar el recuerdo.', 'error');
    }
  }

  private downloadBackup(): void {
    const bytes = this.model.backup();
    const data = new Uint8Array(bytes.byteLength);
    data.set(bytes);
    const blob = new Blob([data], { type: 'application/vnd.sqlite3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis-constelaciones.sqlite';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.view.notify('Copia SQLite descargada correctamente.');
  }
}
