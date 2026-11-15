import { defineGame } from '@ig/sdk';
import { StudioApp } from './app/StudioApp';
import { setLocale } from './i18n';
import './styles/index.css';

// Бит-студия: пульт 4×4 с барабанами, басом, аккордами и эффектами, секвенсор на 16 шагов,
// сохранение битов на сервере игры и «Показать родителям». Ведущий — медвежонок Тёпа.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const app = new StudioApp(sdk);
    container.appendChild(app.root);
    return {
      pause: () => app.pause(),
      resume: () => app.resume(),
      unmount: () => app.dispose(),
    };
  },
});
