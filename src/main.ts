import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import './app/thema.css';
import { mount } from 'svelte';
import App from './app/App.svelte';
import { installeerTikEffect } from './ui/tikEffect';
import { registerSW } from 'virtual:pwa-register';

installeerTikEffect();

// Nieuwe versie? Dan laadt de app zichzelf meteen opnieuw (en kijkt vaker of er iets nieuws is),
// zodat Lana niet pas na twee keer openen de nieuwste versie krijgt.
const updaten = registerSW({
  immediate: true,
  onRegisteredSW(_url, registratie) {
    if (!registratie) return;
    const kijk = () => void registratie.update().catch(() => {});
    setInterval(kijk, 30 * 60_000);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && kijk());
  },
  onNeedRefresh() {
    void updaten(true);
  },
});

const app = mount(App, { target: document.getElementById('app')! });

export default app;
