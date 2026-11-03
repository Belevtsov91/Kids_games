import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { DashSky } from '@/dashboard/DashSky';
import { Face } from '@/parent/ui/Face';
import { useAuth } from '@/auth/AuthContext';
import { KidTimer } from '../KidTimer';
import { useKidText } from '../text';

/** Общая рамка страниц ребёнка: то же небо, что на дашборде, назад к мирам и таймер. */
export function KidFrame({ back, children }: { back?: { to: string; label: string }; children: ReactNode }) {
  const { activeChild } = useAuth();
  const k = useKidText();
  return (
    <div className="dash kid-page">
      <DashSky />
      <header className="dash-top dash-wrap">
        <Link to={back?.to ?? '/dashboard'} className="dash-chip kid-back">
          ← {back?.label ?? k.me.back}
        </Link>
        <span className="kid-top-space" />
        <KidTimer />
        {activeChild && (
          <Link to="/me" className="dash-chip kid-me-chip" aria-label={k.me.toMe}>
            <Face photo={activeChild.photo} avatar={activeChild.avatar} size={34} />
            <span className="dash-chip-name">{activeChild.name}</span>
          </Link>
        )}
      </header>
      <main className="dash-wrap kid-main">{children}</main>
    </div>
  );
}
