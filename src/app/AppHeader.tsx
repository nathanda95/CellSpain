import { BarChart3, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";
import type { Page } from "./app.types";

const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "verbatims", label: "Verbatims", icon: MessageSquareText },
  { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppHeader({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <header>
      <div className="brand">CellSpain</div>
      <nav>
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-tools">
        <button
          className="settings-link"
          onClick={() => onNavigate("settings")}
          title="Questionnaire configuration"
        >
          <Settings size={19} />
        </button>
      </div>
    </header>
  );
}
