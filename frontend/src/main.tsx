
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { WalletProvider } from "./context/WalletContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <WalletProvider>
      <App />
    </WalletProvider>
  );
