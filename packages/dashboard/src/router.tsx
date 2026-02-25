import { createBrowserRouter } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { AppLayout } from './components/AppLayout';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ProjectListPage from './pages/ProjectList';
import ProjectSettingsPage from './pages/ProjectSettings';
import RealtimePage from './pages/Realtime';
import EventTrendPage from './pages/EventTrend';
import TopEventsPage from './pages/TopEvents';
import FunnelPage from './pages/Funnel';
import EventListPage from './pages/EventList';
import WebVitalsPage from './pages/WebVitals';
import ErrorListPage from './pages/ErrorList';
import ErrorDetailPage from './pages/ErrorDetail';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProjectListPage /> },
      { path: 'projects/:id', element: <ProjectSettingsPage /> },
      { path: 'analytics/realtime', element: <RealtimePage /> },
      { path: 'analytics/trend', element: <EventTrendPage /> },
      { path: 'analytics/top-events', element: <TopEventsPage /> },
      { path: 'analytics/funnel', element: <FunnelPage /> },
      { path: 'analytics/events', element: <EventListPage /> },
      { path: 'performance/web-vitals', element: <WebVitalsPage /> },
      { path: 'errors/list', element: <ErrorListPage /> },
      { path: 'errors/detail', element: <ErrorDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
