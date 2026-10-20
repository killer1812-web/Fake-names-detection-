import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { SingleRecordAnalysis } from './pages/SingleRecordAnalysis';
import { BulkCsvUpload } from './pages/BulkCsvUpload';
import { RecordsExplorer } from './pages/RecordsExplorer';
import { DataAnalytics } from './pages/DataAnalytics';
import { MachineLearning } from './pages/MachineLearning';
import { ReviewQueue } from './pages/ReviewQueue';
import { Reports } from './pages/Reports';
import { SettingsAbout } from './pages/SettingsAbout';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewDashboard />} />
          <Route path="single-analysis" element={<SingleRecordAnalysis />} />
          <Route path="upload" element={<BulkCsvUpload />} />
          <Route path="records" element={<RecordsExplorer />} />
          <Route path="analytics" element={<DataAnalytics />} />
          <Route path="ml" element={<MachineLearning />} />
          <Route path="reviews" element={<ReviewQueue />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsAbout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
