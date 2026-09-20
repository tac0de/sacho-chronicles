import { UIManager } from './ui/UIManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App root element (#app) not found');
  }

  // Initial seed can be read from URL query param (?seed=...) or default to 1024
  const urlParams = new URLSearchParams(window.location.search);
  const seedParam = urlParams.get('seed');
  const initialSeed = seedParam ? (isNaN(Number(seedParam)) ? seedParam : Number(seedParam)) : 1024;

  const uiManager = new UIManager(appElement, initialSeed);
  uiManager.init();

  // Expose to window for rapid browser console inspection if needed
  (window as any).__sachoUiManager = uiManager;
  console.log(`[사초: 춘추필법] 게임 엔진이 성공적으로 초기화되었습니다. Seed: ${initialSeed}`);
});
