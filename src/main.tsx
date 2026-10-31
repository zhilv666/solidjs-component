import { render } from "solid-js/web";
import App from "@/App";
import { applyTheme, getPreferredTheme } from "@/theme/mode";
import "@/theme/theme.css";
import "@/theme/base.css";
import "virtual:uno.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

applyTheme(getPreferredTheme());
render(() => <App />, root);
