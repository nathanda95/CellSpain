import { useState } from "react";
import "./App.css";
import { AppHeader } from "./app/AppHeader";
import type { Page } from "./app/app.types";
import { useImports } from "./features/files/useImports";
import { activeQuestionnaire } from "./features/settings/questionnaire.service";
import { useDataset } from "./hooks/useDataset";
import { usePeriodFilter } from "./hooks/usePeriodFilter";
import { DashboardPage } from "./pages/DashboardPage";
import { ImportsPage } from "./pages/ImportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VerbatimsPage } from "./pages/VerbatimsPage";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const dataset = useDataset();
  const periodFilter = usePeriodFilter();
  const questionnaire = activeQuestionnaire(dataset.data.questionnaireVersions);
  const imports = useImports(questionnaire, dataset);

  return (
    <div className="app">
      <AppHeader page={page} onNavigate={setPage} />
      <main>
        {page === "dashboard" && (
          <DashboardPage
            answers={dataset.data.answers}
            verbatims={dataset.data.verbatims}
            periodState={periodFilter.state}
            periodActions={periodFilter.actions}
            bounds={periodFilter.bounds}
            onManageImports={() => setPage("reports")}
          />
        )}
        {page === "verbatims" && (
          <VerbatimsPage
            answers={dataset.data.answers}
            verbatims={dataset.data.verbatims}
            periodState={periodFilter.state}
            periodActions={periodFilter.actions}
            bounds={periodFilter.bounds}
            onUpdateVerbatim={dataset.updateVerbatim}
          />
        )}
        {page === "reports" && (
          <ImportsPage
            imports={dataset.data.imports}
            onImport={imports.importFiles}
            onRemove={imports.removeImport}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            active={questionnaire}
            onSave={dataset.activateQuestionnaire}
          />
        )}
      </main>
    </div>
  );
}

export default App;
