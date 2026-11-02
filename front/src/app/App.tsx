import { BrowserRouter, Route, Routes } from 'react-router';
import { MenuPage } from '@/pages/MenuPage';
import { GamePage } from '@/pages/GamePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/play/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}
