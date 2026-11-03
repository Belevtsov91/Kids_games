import { Component, type ReactNode } from 'react';

/** Если 3D не запустилось (нет WebGL, старый браузер), игра не падает: панель и кнопки остаются. */
export class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('Лунная долина: 3D-сцена не запустилась', error);
  }
  render() {
    return this.state.failed ? <div className="mv-scene-fallback">🌙</div> : this.props.children;
  }
}
