import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ToastContainer } from "./components/ToastContainer.tsx"
import { doneSaving, startSaving } from "./lib/saving.ts"
import { addToast } from "./lib/toast.ts"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
  mutationCache: new MutationCache({
    onMutate: () => startSaving(),
    onSettled: () => doneSaving(),
    onError: (error) =>
      addToast(error instanceof Error ? error.message : String(error)),
  }),
})

// biome-ignore lint/style/noNonNullAssertion: Guaranteed to be present
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
