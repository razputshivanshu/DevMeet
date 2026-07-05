import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRouter } from './routes/AppRouter';
import { ThemeProvider, useTheme } from './contexts/theme';
import { TooltipProvider } from './components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

const ToasterWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      richColors
      position="top-right"
      theme={resolvedTheme}
      toastOptions={{
        classNames: { toast: 'border border-border shadow-lg' },
      }}
    />
  );
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <ToasterWithTheme />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
