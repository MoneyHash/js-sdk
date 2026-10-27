/**
 * Styles for the launcher and the panel frame, rendered in a shadow root so
 * the host page's CSS can't reach them. Colors and radius come from the
 * `--mh-*` properties set on the host element from the widget's appearance.
 */
export const CHAT_WIDGET_STYLES = `
  :host {
    all: initial;
  }

  .launcher {
    position: fixed;
    inset-inline-end: 24px;
    bottom: 24px;
    z-index: 2147483647;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    padding: 0;
    border: 2px solid var(--mh-border);
    border-radius: 50%;
    background: var(--mh-background);
    color: var(--mh-foreground);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    cursor: pointer;
    overflow: hidden;
    transition: transform 150ms ease-out;
  }

  .launcher:hover {
    transform: scale(1.07);
  }

  .launcher:active {
    transform: scale(0.94);
  }

  .launcher:focus-visible {
    outline: 2px solid var(--mh-primary);
    outline-offset: 2px;
  }

  .launcher-icon {
    grid-area: 1 / 1;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms;
  }

  .launcher-icon img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .launcher-icon svg {
    width: 28px;
    height: 28px;
  }

  .launcher[aria-expanded="true"] .launcher-logo,
  .launcher[aria-expanded="false"] .launcher-close {
    transform: scale(0) rotate(90deg);
    opacity: 0;
  }

  .panel {
    position: fixed;
    inset-inline-end: 24px;
    bottom: 88px;
    z-index: 2147483647;
    width: min(28rem, calc(100vw - 1.5rem));
    height: min(690px, calc(100vh - 96px));
    border-radius: var(--mh-panel-radius);
    box-shadow: rgba(9, 14, 21, 0.9) 0 5px 40px 0;
    overflow: hidden;
    transform-origin: bottom right;
    opacity: 0;
    transform: translateY(12px) scale(0.95);
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
      width 220ms cubic-bezier(0.16, 1, 0.3, 1),
      height 220ms cubic-bezier(0.16, 1, 0.3, 1),
      visibility 0s linear 220ms;
  }

  .panel[data-open] {
    opacity: 1;
    transform: none;
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  .panel[data-expanded] {
    width: min(40rem, calc(100vw - 1.5rem));
    height: min(1020px, calc(100vh - 96px));
  }

  .panel iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
    color-scheme: normal;
  }

  @media (max-width: 639px) {
    .panel,
    .panel[data-expanded] {
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
      box-shadow: none;
    }

    .launcher[aria-expanded="true"] {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .launcher,
    .launcher-icon,
    .panel {
      transition: none;
    }
  }
`;

export const MONEYHASH_LOGO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M32 0H0v17.5h11.125l.826-2.76H9l.452-2.04h2.99l1.26-4.3h2.577l-1.26 4.3h3.856l1.26-4.3h2.596l-1.259 4.3H32V0Zm0 14.74H20.98l-.826 2.76H23.2l-.469 2.04h-3.069l-1.18 4.06h-2.597l1.2-4.06H13.25l-1.22 4.06H9.453l1.2-4.06H0V32h32V14.74Zm-17.453 0-.806 2.76h3.836l.807-2.76h-3.837Z"/></svg>`;

export const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
