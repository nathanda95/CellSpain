import { useState } from "react";
import "./App.css";
import { AppHeader } from "./app/AppHeader";
import type { Page } from "./app/app.types";
import { activeQuestionnaire } from "./features/settings/questionnaire.service";
import { useImports } from "./features/files/useImports";
import { useDataset } from "./hooks/useDataset";
import { usePeriodFilter } from "./hooks/usePeriodFilter";
import { DashboardPage } from "./pages/DashboardPage";
import { ImportsPage } from "./pages/ImportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VerbatimsPage } from "./pages/VerbatimsPage";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const { data, setData, updateVerbatim, activateQuestionnaire } = useDataset();
  const periodFilter = usePeriodFilter();
  const questionnaire = activeQuestionnaire(data.questionnaireVersions);
  const { importFiles, removeImport } = useImports(questionnaire, setData);

  return (
    <div className="app">
      <AppHeader page={page} onNavigate={setPage} />
      <main>
        {page === "dashboard" && (
          <DashboardPage
            answers={data.answers}
            verbatims={data.verbatims}
            periodState={periodFilter.state}
            periodActions={periodFilter.actions}
            bounds={periodFilter.bounds}
            onManageImports={() => setPage("reports")}
          />
        )}
        {page === "verbatims" && (
          <VerbatimsPage
            answers={data.answers}
            verbatims={data.verbatims}
            periodState={periodFilter.state}
            periodActions={periodFilter.actions}
            bounds={periodFilter.bounds}
            onUpdateVerbatim={updateVerbatim}
          />
        )}
        {page === "reports" && (
          <ImportsPage imports={data.imports} onImport={importFiles} onRemove={removeImport} />
        )}
        {page === "settings" && (
          <SettingsPage active={questionnaire} onSave={activateQuestionnaire} />
        )}
      </main>
    </div>
  );
}

export default App;
