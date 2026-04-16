/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
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
import AdminAddTopic from './pages/AdminAddTopic';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditTopic from './pages/AdminEditTopic';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AllCalculators from './pages/AllCalculators';
import Category from './pages/Category';
import ClinicalTools from './pages/ClinicalTools';
import CreateTool from './pages/CreateTool';
import Home from './pages/Home';
import SRIProtocol from './pages/SRIProtocol';
import Templates from './pages/Templates';
import ToolsManager from './pages/ToolsManager';
import TopicDetail from './pages/TopicDetail';
import ProtocoloInsulina from './pages/ProtocoloInsulina';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdminAddTopic": AdminAddTopic,
    "AdminDashboard": AdminDashboard,
    "AdminEditTopic": AdminEditTopic,
    "AdminLogin": AdminLogin,
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};