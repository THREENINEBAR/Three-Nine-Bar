import { ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex w-64 fixed inset-y-0 left-0 z-50" />
      
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 md:hidden">
          <MobileSidebar />
          <div className="font-bold text-primary tracking-wider">THREE NINE</div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
