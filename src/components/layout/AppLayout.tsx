import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  onExport: () => void;
  isExporting: boolean;
  onFax?: () => void;
  isFaxing?: boolean;
  canExport?: boolean;
}

export function AppLayout({ children, onExport, isExporting, onFax, isFaxing, canExport = true }: AppLayoutProps) {
  return (
    <div className="flex h-full bg-slate-50">
      <Sidebar onExport={onExport} isExporting={isExporting} onFax={onFax} isFaxing={isFaxing} canExport={canExport} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
