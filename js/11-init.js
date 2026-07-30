// ══ MOBILE NAVIGATION ══
const isMobile = () => window.innerWidth <= 768;

const initMobileNav = () => {
  const mobileNav = document.getElementById('mobile-nav');
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (isMobile()) {
    if (mobileNav) mobileNav.style.display = 'flex';
    if (menuBtn) menuBtn.style.display = 'flex';
  } else {
    if (mobileNav) mobileNav.style.display = 'none';
    if (menuBtn) menuBtn.style.display = 'none';
  }
};

const toggleMobileMenu = () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen = sidebar?.classList.contains('mobile-open');
  sidebar?.classList.toggle('mobile-open', !isOpen);
  overlay?.classList.toggle('active', !isOpen);
};

const closeMobileMenu = () => {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
};

const setMobileActive = (btn) => {
  document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  closeMobileMenu();
};

// Sincronizza active con qualsiasi navigazione (anche dalla sidebar)
const syncMobileActive = (page) => {
  document.querySelectorAll('.mobile-nav-item[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  // Pagine non in navbar: deseleziona tutto
  const navPages = ['home','campagna','mondo','sessione','generatori','compendio','schermo'];
  if (!navPages.includes(page)) {
    document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
  }
};

// Override App.navigateTo per sincronizzare la navbar mobile
const _origNavigateTo = App.navigateTo.bind(App);
App.navigateTo = (page) => {
  _origNavigateTo(page);
  syncMobileActive(page);
  closeMobileMenu();
};

window.addEventListener('resize', initMobileNav);
window.addEventListener('load', initMobileNav);
document.addEventListener('DOMContentLoaded', initMobileNav);