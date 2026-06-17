import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  onExport: () => void;
  isExporting: boolean;
}

export function AppLayout({ children, onExport, isExporting }: AppLayoutProps) {
  return (
    <div className="flex h-full bg-slate-50">
      <Sidebar onExport={onExport} isExporting={isExporting} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
