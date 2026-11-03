import { defineGame } from '@ig/sdk';
import { OrchestraApp } from './app/OrchestraApp';
import './styles/index.css';
import { setLocale } from './i18n';

// Звериный оркестр: зверята на сцене играют ноты и голоса, мелодию можно записать
// и сохранить на сервере игры, а в «Повтори» — повторить фразу за оркестром.
export default defineGame({
  mount(container, sdk) {
    setLocale(sdk.locale);
    const app = new OrchestraApp(sdk);
    container.appendChild(app.root);
    return {
      pause: () => app.pause(),
      resume: () => app.resume(),
      unmount: () => app.dispose(),
    };
  },
});
