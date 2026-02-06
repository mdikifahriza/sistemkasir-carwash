'use client';

import { useAuthStore } from '@/store/authStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRole } from '@/lib/utils/roles';
import { MobileMenu } from './MobileMenu';

import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function Header() {
  const logout = useAuthStore((state) => state.logout);
  const user = useCurrentUser();
  const currentShiftId = useDataStore((state) => state.currentShiftId);
  const shiftSessions = useDataStore((state) => state.shiftSessions);
  const shifts = useDataStore((state) => state.shifts);
  const { toggleSidebar } = useUIStore();

  const currentShift = shiftSessions.find((session) => session.id === currentShiftId);
  const shiftInfo = currentShift
    ? shifts.find((shift) => shift.id === currentShift.shiftId)
    : null;
  const overtimeInfo = (() => {
    if (!currentShift || !shiftInfo) return null;
    const sessionDate = currentShift.sessionDate || currentShift.openedAt?.slice(0, 10);
    if (!sessionDate) return null;
    const normalizeTime = (value?: string) => (value ? value.slice(0, 5) : null);
    const startTime = normalizeTime(shiftInfo.startTime);
    const endTime = normalizeTime(shiftInfo.endTime);
    if (!startTime || !endTime) return null;

    const startDate = new Date(`${sessionDate}T${startTime}:00`);
    let endDate = new Date(`${sessionDate}T${endTime}:00`);
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const now = new Date();
    if (now <= endDate) return null;
    const minutes = Math.floor((now.getTime() - endDate.getTime()) / 60000);
    return { minutes };
  })();

  const overtimeLabel = overtimeInfo
    ? (() => {
        const hours = Math.floor(overtimeInfo.minutes / 60);
        const minutes = overtimeInfo.minutes % 60;
        if (hours > 0) {
          return `Over jam ${hours}j ${minutes}m`;
        }
        return `Over jam ${minutes}m`;
      })()
    : null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-10 w-10 p-0 flex items-center justify-center rounded-xl hover:bg-surface-2 transition-colors border border-border/50"
        >
          <Menu size={20} className="text-ink" />
        </Button>
        <div className="hidden sm:block ml-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">POS PRO SYSTEM</p>
          <h2 className="text-sm font-black text-ink tracking-tight">
            {shiftInfo?.shiftName || 'Sistem Kasir'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 font-sans">
        <Badge variant={currentShift ? 'success' : 'warning'} className="hidden xs:inline-flex">
          {currentShift ? 'Shift Buka' : 'Shift Tutup'}
        </Badge>
        {overtimeLabel ? (
          <Badge variant="danger" className="hidden xs:inline-flex">
            {overtimeLabel}
          </Badge>
        ) : null}

        <div className="flex items-center gap-3 border-l border-border pl-3 md:pl-4">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-bold text-ink leading-tight">{user?.fullName || 'Pengguna'}</p>
            <p className="text-[10px] font-bold uppercase text-ink-muted tracking-tight">{formatRole(user?.role)}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="h-8 px-3 text-xs font-bold md:h-10 md:px-4 md:text-sm border-danger/20 text-danger hover:bg-danger/5 hover:border-danger/30"
          >
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
