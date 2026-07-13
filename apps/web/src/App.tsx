import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AuthProvider } from './context/auth';
import { CategoriesProvider } from './context/categories';
import { PreferencesProvider } from './context/preferences';
import { NotFoundPage } from './pages/NotFoundPage';
import { registeredPages } from './router/pageRegistry';

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PreferencesProvider>
        <CategoriesProvider>
          <AuthProvider>
            <AppLayout>
              <Routes>
                {registeredPages.map((page) => (
                  <Route element={<page.Component />} key={page.path} path={page.path} />
                ))}
                <Route element={<NotFoundPage />} path="*" />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </CategoriesProvider>
      </PreferencesProvider>
    </BrowserRouter>
  );
}

export default App;
