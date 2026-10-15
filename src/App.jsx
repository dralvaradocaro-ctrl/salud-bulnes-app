import '@/api/base44Client' // debe ser el primer import para setear globalThis.__B44_DB__ antes de las páginas
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import WelcomeLogin from '@/pages/WelcomeLogin';
import { isLoggedIn } from '@/lib/hospitalAuth';
import { Component, Suspense, useState } from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Las páginas se descargan bajo demanda: tras un deploy, una pestaña abierta pide archivos con
// nombres que ya no existen. Se recarga una sola vez para traer la versión nueva (el guardia de
// 10 s evita un bucle si el archivo realmente falta).
const STALE_CHUNK_ERROR = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS/i;
const STALE_RELOAD_KEY = 'stale-chunk-reload-at';

function reloadOnceForStaleChunk() {
  try {
    const last = Number(sessionStorage.getItem(STALE_RELOAD_KEY) || 0);
    if (Date.now() - last < 10000) return false;
    sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
  } catch {
    // Sin sessionStorage no hay guardia contra bucles: mejor mostrar el error.
    return false;
  }
  window.location.reload();
  return true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', event => {
    if (reloadOnceForStaleChunk()) event.preventDefault();
  });
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (STALE_CHUNK_ERROR.test(String(error?.message || error)) && reloadOnceForStaleChunk()) return;
    console.error('Error de renderizado no controlado:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const staleChunk = STALE_CHUNK_ERROR.test(String(this.state.error?.message || this.state.error));
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-red-800">
            {staleChunk ? 'Hay una versión nueva de la app' : 'No se pudo mostrar esta sección'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {staleChunk
              ? 'Esta pestaña quedó con una versión anterior. Recarga la página para continuar.'
              : 'Se produjo un error de interfaz. Tus datos no se guardaron automáticamente.'}
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app. Suspense muestra el spinner mientras se descarga el
  // chunk de la página (ver pages.config.js).
  return (
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        // PrescripcionInteligente monta una sub-app con sus propias rutas
        // anidadas (medispense), por lo que necesita wildcard
        const routePath = path === 'PrescripcionInteligente' ? `/${path}/*` : `/${path}`;
        return (
          <Route
            key={path}
            path={routePath}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

// EXCEPCIONAL: login de funcionarios desactivado temporalmente.
// Para reactivarlo, poner LOGIN_FUNCIONARIOS_DISABLED en false.
const LOGIN_FUNCIONARIOS_DISABLED = true;

const LoginGate = ({ children }) => {
  const [authed, setAuthed] = useState(isLoggedIn());
  const navigate = useNavigate();

  if (!LOGIN_FUNCIONARIOS_DISABLED && !authed) {
    return <WelcomeLogin onLogin={() => { setAuthed(true); navigate('/'); }} />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <LoginGate>
            <AppErrorBoundary>
              <AuthenticatedApp />
            </AppErrorBoundary>
          </LoginGate>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
