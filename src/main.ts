import './styles/styles.css';
import { openDatabase } from './db/database';
import { ConstellationModel } from './models/constellation';
import { ConstellationView } from './views/constellationView';
import { ConstellationController } from './controllers/constellationController';

async function start(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) throw new Error('No se encontró el contenedor de la aplicación');

  try {
    const db = await openDatabase();
    const model = new ConstellationModel(db);
    const view = new ConstellationView(root);
    new ConstellationController(model, view).start();
  } catch (error) {
    console.error('Error al iniciar Constelario:', error);
    root.innerHTML = `
      <main class="startup-error" role="alert">
        <div class="error-star">✦</div>
        <h1>No pudimos abrir tu constelario</h1>
        <p>Comprueba que el almacenamiento del navegador esté habilitado. Si el problema continúa, intenta recargar.</p>
        <button type="button" class="button primary" id="retry-start">Reintentar ↗</button>
      </main>`;
    root.querySelector('#retry-start')?.addEventListener('click', () => location.reload());
  }
}

void start();
