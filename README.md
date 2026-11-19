# Constelario ✧ — Un universo para cada recuerdo

**Constelario** es un sitio web creativo donde cada recuerdo se convierte en una constelación digital única. Puedes guardar un título, una historia, su emoción y la fecha en que ocurrió. El sistema genera automáticamente un mapa de estrellas diferente para cada recuerdo y lo conserva en una base de datos **SQLite real** que funciona directamente en el navegador.

Este proyecto se desarrolló como laboratorio de **SQLite + GitHub + Vercel**. Está construido con Vite, TypeScript y SQL.js; sigue una estructura sencilla de modelo, vista y controlador (MVC).

## Funciones principales

- **Crear** recuerdos con título, historia, emoción y fecha.
- **Leer** todos los recuerdos como constelaciones visuales generadas con SVG.
- **Actualizar** la información de un recuerdo existente.
- **Eliminar** recuerdos con un mensaje de confirmación.
- **Filtrar** por emoción y **buscar** por palabras clave.
- **Persistir** todos los cambios al cerrar y volver a abrir el mismo navegador, gracias a SQL.js y `localStorage`.
- **Descargar** una copia auténtica del archivo de base de datos `.sqlite`.
- Diseño adaptable a pantallas de computadora y teléfono.

> **Importante:** la base de datos se almacena en **cada navegador**, no en un servidor compartido. En consecuencia, los recuerdos que agrega una persona en su navegador no aparecerán en otro dispositivo. Es el funcionamiento esperado de la opción B del laboratorio.

## Tecnologías

- **HTML5, CSS3 y SVG** — interfaz y constelaciones generativas.
- **TypeScript** — lógica de la aplicación y arquitectura MVC.
- **Vite** — entorno de desarrollo y construcción de producción.
- **SQL.js / SQLite compilado a WebAssembly** — motor SQLite en el navegador.
- **localStorage** — persistencia del archivo SQLite exportado en Base64.
- **Git y GitHub** — control de versiones.
- **Vercel** — hosting estático del proyecto construido con Vite.

## Cómo ejecutarlo

Necesitas Node.js 20.19+ o Node.js 22.12+ y npm.

```bash
npm install
npm run dev
```

Abre la URL local que muestre Vite (normalmente `http://localhost:5173`).

Para generar la versión lista para producción:

```bash
npm run build
npm run preview
```

Para ejecutar las comprobaciones incluidas:

```bash
npm run test
npm run verify
```

`npm run verify` requiere tener las dependencias instaladas; ejecuta los tests, la compilación de TypeScript/Vite y revisa los archivos de salida.

## Estructura

```text
constelario/
├── index.html
├── package.json
├── package-lock.json          # se genera al instalar dependencias
├── vite.config.ts
├── vercel.json
├── .gitignore
├── README.md
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── main.ts
│   ├── db/
│   │   └── database.ts         # Inicialización, SQLite y localStorage
│   ├── models/
│   │   └── constellation.ts    # Datos, validaciones, CRUD y consultas
│   ├── views/
│   │   └── constellationView.ts # SVG, tarjetas, filtros y formularios
│   ├── controllers/
│   │   └── constellationController.ts # Eventos y coordinación
│   └── styles/
│       └── styles.css
├── tests/
└── scripts/
```

## Cómo funciona SQLite

1. `openDatabase()` inicializa SQL.js y carga `sql-wasm.wasm` como recurso del proyecto compilado.
2. Si existe `constelario.sqlite.v1` en `localStorage`, se descodifica el archivo guardado y se abre con SQL.js.
3. Si no existe, se crea una base de datos nueva, se ejecuta el esquema `CREATE TABLE ...` y se insertan tres recuerdos de ejemplo.
4. Cada inserción, edición o eliminación utiliza sentencias SQL **parametrizadas** (`?`) y luego guarda la base completa serializada en `localStorage`.
5. Al recargar la página se abre el mismo archivo SQLite, conservando todos los cambios.

### Tabla `constellations`

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | Identificador autoincremental |
| `title` | TEXT NOT NULL | Nombre del recuerdo |
| `story` | TEXT NOT NULL | Historia |
| `mood` | TEXT NOT NULL | Alegría, calma, nostalgia o aventura |
| `event_date` | TEXT NOT NULL | Fecha (ISO `YYYY-MM-DD`) |
| `seed` | INTEGER NOT NULL | Semilla para generar las estrellas |
| `created_at` | TEXT | Fecha de creación del registro |
| `updated_at` | TEXT | Última modificación |

## Desplegar en Vercel

1. Crea un repositorio **público** nuevo en GitHub y sube esta carpeta con `git push`.
2. En Vercel, selecciona **Add New → Project**, conecta GitHub e importa ese repositorio.
3. Si Vercel no detecta Vite automáticamente, selecciona **Vite** como framework.
4. Comprueba la configuración: **Build Command:** `npm run build`, **Output Directory:** `dist`, **Install Command:** `npm install`.
5. Haz clic en **Deploy**. La carpeta `dist/` contiene el JavaScript y el motor SQLite WebAssembly listo para Vercel.
6. Abre la URL pública, crea un recuerdo, recarga y comprueba que persista. Luego edítalo y elimínalo.

No necesita API de servidor, Turso, credenciales, ni variables de entorno: SQLite corre del lado del navegador.

## Commits de desarrollo

El repositorio contiene commits diferenciados por fases de desarrollo:

1. `chore: iniciar proyecto Vite y TypeScript con estructura MVC`
2. `feat: agregar SQLite con persistencia local y CRUD de constelaciones`
3. `feat: implementar galería interactiva, filtros y formularios CRUD`
4. `style: crear identidad visual responsive y documentación` (preparado para el commit final).

## Limitaciones

`localStorage` está asociado al origen del sitio y al perfil del navegador; en modo incógnito o al limpiar datos del sitio, los recuerdos pueden desaparecer. Se puede descargar un respaldo `.sqlite` desde la galería. Las fuentes externas son opcionales: si no hay conexión a Google Fonts, se utilizan fuentes del sistema.

**Licencia:** proyecto educativo.
