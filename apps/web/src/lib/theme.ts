export const THEME_STORAGE_KEY = 'site-projetos:theme';
export const SIDEBAR_STORAGE_KEY = 'site-projetos:sidebar';

export const themeBootScript = `(function(){try{var themeKey=${JSON.stringify(THEME_STORAGE_KEY)};var stored=localStorage.getItem(themeKey);var theme=stored==="light"||stored==="dark"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;var sideKey=${JSON.stringify(SIDEBAR_STORAGE_KEY)};document.documentElement.dataset.sidebar=localStorage.getItem(sideKey)==="collapsed"?"collapsed":"expanded";}catch(e){}})();`;
