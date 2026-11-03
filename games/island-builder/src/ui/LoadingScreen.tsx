import { tr } from '../i18n';

export function LoadingScreen() {
  return (
    <div className="ib-loading">
      <div>
        <span>🏝️</span>
        {tr().loading}
      </div>
    </div>
  );
}
