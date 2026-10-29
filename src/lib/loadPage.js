// Keep rejected imports rejected: React.lazy requires a module with a default export.
// A stalled institutional proxy must not leave Suspense spinning indefinitely.
export function loadPage(importer, timeoutMs = 30000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('La red tardó demasiado en descargar esta sección.');
      error.name = 'PageLoadError';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve().then(importer), timeout])
    .then(module => {
      if (!module?.default) {
        const error = new Error('No se pudo descargar correctamente esta sección.');
        error.name = 'PageLoadError';
        throw error;
      }
      return module;
    })
    .finally(() => clearTimeout(timer));
}

export function isPageLoadError(error) {
  return error?.name === 'PageLoadError' || /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS|Loading chunk .* failed/i.test(String(error?.message || error));
}
