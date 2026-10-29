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
import { isPageLoadError } from '@/lib/loadPage';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Do not preventDefault on vite:preloadError: that resolves failed imports to
// undefined, causing React.lazy to crash while reading `default`.
// Recovery is explicit to avoid reload loops and losing unsaved form data.
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de renderizado no controlado:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const staleChunk = isPageLoadError(this.state.error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-red-800">
            {staleChunk ? 'No se pudo cargar esta sección' : 'No se pudo mostrar esta sección'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {staleChunk
              ? 'La conexión puede estar lenta o interrumpida, o la aplicación se actualizó. Puedes recargar para intentarlo de nuevo. Si ocurre solo en la red del hospital, solicita a informática revisar el acceso a este sitio.'
              : 'Se produjo un error de interfaz. Los cambios sin guardar pueden perderse al recargar.'}
          </p>
          {staleChunk && <p className="mt-2 text-sm text-slate-600">Los cambios sin guardar pueden perderse al recargar.</p>}
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
          {staleChunk && <a href="/" className="ml-4 text-sm font-bold underline">Volver al inicio</a>}
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
    <div role="status" className="text-center">
      <div className="mx-auto w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-slate-600">Descargando sección…</p>
    </div>
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
