import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../shared/auth/AuthContext";
import { LocaleProvider } from "../shared/i18n/LocaleContext";
import { UnsavedChangesProvider } from "../shared/lib/useUnsavedChangesGuard";
import { DemoAccessGate } from "../features/demo-access/DemoAccessGate";
import { DemoVideoGuideProvider } from "../features/demo-video-guide/DemoVideoGuide";
import { AppRouter } from "./AppRouter";

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <DemoAccessGate>
          <AuthProvider>
            <BrowserRouter>
              <DemoVideoGuideProvider>
                <UnsavedChangesProvider>
                  <AppRouter />
                </UnsavedChangesProvider>
              </DemoVideoGuideProvider>
            </BrowserRouter>
          </AuthProvider>
        </DemoAccessGate>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
