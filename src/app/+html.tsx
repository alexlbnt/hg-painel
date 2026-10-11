import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * HTML raiz (somente servidor). Aqui ficam as tags de PWA: manifesto, cor do tema, ícones e
 * o registro do service worker (/sw.js). Não importe CSS global neste arquivo.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover permite ocupar toda a tela (inclusive atrás do notch) quando instalado */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <title>Honra &amp; Egoísmo — Painel HG</title>
        <meta name="description" content="Fichas, sessões e mesas da campanha Honra & Egoísmo (D&D 5e)." />

        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#110F0D" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HG Painel" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="icon" type="image/png" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Fontes do tema: Cinzel (logo e títulos) e IM Fell English (avisos e diário) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap"
        />

        {/* Fundo escuro desde o primeiro quadro (evita flash branco ao abrir e no "puxar" da rolagem) */}
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
        <ScrollViewStyleReset />

        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/**
 * CSS global mínimo:
 *  - fundo escuro desde o primeiro quadro;
 *  - contorno de foco visível em tudo que é clicável (navegação por teclado);
 *  - respeita "reduzir movimento" do sistema.
 */
const globalCss = `
html,body{background-color:#110F0D;}
[role="button"]:focus-visible,[role="tab"]:focus-visible,[role="link"]:focus-visible,a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,[tabindex]:focus-visible{
  outline:2px solid #E6C280 !important;outline-offset:2px !important;border-radius:6px;
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important;}
}
`;

// Registra o service worker só em HTTPS ou localhost (requisito dos navegadores).
const registerServiceWorker = `
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (e) {
      console.warn('Service worker não registrado:', e);
    });
  });
}
`;
