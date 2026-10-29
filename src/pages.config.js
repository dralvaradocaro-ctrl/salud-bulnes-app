/**
 * pages.config.js - Page routing configuration
 * 
 * Las páginas se registran aquí con React.lazy para que cada una viaje en su
 * propio chunk. Al agregar una página nueva: añadir su línea lazy y su clave en PAGES.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
    OperacionClinica, RedDerivacion, Antibiograma,
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
    OperacionClinica, RedDerivacion, Antibiograma,
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy as reactLazy } from 'react';
import { loadPage } from './lib/loadPage';
const lazy = importer => reactLazy(() => loadPage(importer));
import Home from './pages/Home';

// Cada página se descarga sólo cuando el usuario navega a ella (code splitting).
// Home se mantiene estática porque es la portada y debe pintar sin una segunda espera.
const OperacionClinica = lazy(() => import('./pages/OperacionClinica'));
const RedDerivacion = lazy(() => import('./pages/RedDerivacion'));
const Antibiograma = lazy(() => import('./pages/Antibiograma'));
const AdminAddTopic = lazy(() => import('./pages/AdminAddTopic'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminEditTopic = lazy(() => import('./pages/AdminEditTopic'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminNewsUpdates = lazy(() => import('./pages/AdminNewsUpdates'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AllCalculators = lazy(() => import('./pages/AllCalculators'));
const Category = lazy(() => import('./pages/Category'));
const ClinicalTools = lazy(() => import('./pages/ClinicalTools'));
const CreateTool = lazy(() => import('./pages/CreateTool'));
const SRIProtocol = lazy(() => import('./pages/SRIProtocol'));
const Templates = lazy(() => import('./pages/Templates'));
const ToolsManager = lazy(() => import('./pages/ToolsManager'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const ProtocoloInsulina = lazy(() => import('./pages/ProtocoloInsulina'));
const FormularioGES = lazy(() => import('./pages/FormularioGES'));
const SolicitudExamenes = lazy(() => import('./pages/SolicitudExamenes'));
const InformeBiomedico = lazy(() => import('./pages/InformeBiomedico'));
const PrescripcionInteligente = lazy(() => import('./pages/PrescripcionInteligente'));
const SubdireccionMedica = lazy(() => import('./pages/SubdireccionMedica'));
const FormularioCoqueluche = lazy(() => import('./pages/FormularioCoqueluche'));
const FormularioIRAGrave = lazy(() => import('./pages/FormularioIRAGrave'));
const SolicitudMicrobiologia = lazy(() => import('./pages/SolicitudMicrobiologia'));
const SolicitudFarmacoRestringido = lazy(() => import('./pages/SolicitudFarmacoRestringido'));
const GestionCardiovascular = lazy(() => import('./pages/GestionCardiovascular'));
const GestionPROA = lazy(() => import('./pages/GestionPROA'));
const VisitaPROA = lazy(() => import('./pages/VisitaPROA'));
const AgendaDiaria = lazy(() => import('./pages/AgendaDiaria'));
const IndicacionesUrgencia = lazy(() => import('./pages/IndicacionesUrgencia'));
const NotaEvolucion = lazy(() => import('./pages/NotaEvolucion'));
const CurvaExamenes = lazy(() => import('./pages/CurvaExamenes'));
const FormulariosHODOM = lazy(() => import('./pages/FormulariosHODOM'));
const AdecuacionTerapeutica = lazy(() => import('./pages/AdecuacionTerapeutica'));
const VariosDocumentos = lazy(() => import('./pages/VariosDocumentos'));
const VistaHospitalizados = lazy(() => import('./pages/VistaHospitalizados'));
const OrdenExamenes = lazy(() => import('./pages/OrdenExamenes'));
const RecetaMedica = lazy(() => import('./pages/RecetaMedica'));
const CertificadoMedico = lazy(() => import('./pages/CertificadoMedico'));
const VerificarCertificado = lazy(() => import('./pages/VerificarCertificado'));
import __Layout from './Layout.jsx';

export const PAGES = {
    OperacionClinica, RedDerivacion, Antibiograma,
    "AdminAddTopic": AdminAddTopic,
    "AdminDashboard": AdminDashboard,
    "AdminEditTopic": AdminEditTopic,
    "AdminLogin": AdminLogin,
    "AdminNewsUpdates": AdminNewsUpdates,
    "AdminPanel": AdminPanel,
    "AllCalculators": AllCalculators,
    "Category": Category,
    "ClinicalTools": ClinicalTools,
    "CreateTool": CreateTool,
    "Home": Home,
    "SRIProtocol": SRIProtocol,
    "Templates": Templates,
    "ToolsManager": ToolsManager,
    "TopicDetail": TopicDetail,
    "ProtocoloInsulina": ProtocoloInsulina,
    "FormularioGES": FormularioGES,
    "SolicitudExamenes": SolicitudExamenes,
    "InformeBiomedico": InformeBiomedico,
    "PrescripcionInteligente": PrescripcionInteligente,
    "SubdireccionMedica": SubdireccionMedica,
    "FormularioIRAGrave": FormularioIRAGrave,
    "FormularioCoqueluche": FormularioCoqueluche,
    "SolicitudMicrobiologia": SolicitudMicrobiologia,
    "SolicitudFarmacoRestringido": SolicitudFarmacoRestringido,
    "GestionPROA": GestionPROA,
    "GestionCardiovascular": GestionCardiovascular,
    "VisitaPROA": VisitaPROA,
    "AgendaDiaria": AgendaDiaria,
    "IndicacionesUrgencia": IndicacionesUrgencia,
    "NotaEvolucion": NotaEvolucion,
    "CurvaExamenes": CurvaExamenes,
    "FormulariosHODOM": FormulariosHODOM,
    "AdecuacionTerapeutica": AdecuacionTerapeutica,
    "VariosDocumentos": VariosDocumentos,
    "VistaHospitalizados": VistaHospitalizados,
    // Documentos clínicos protegidos y verificación de certificados
    "CertificadoMedico": CertificadoMedico,
    "RecetaMedica": RecetaMedica,
    "OrdenExamenes": OrdenExamenes,
    "VerificarCertificado": VerificarCertificado,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
