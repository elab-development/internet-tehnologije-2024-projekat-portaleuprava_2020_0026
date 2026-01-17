import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const NAVY = "#0B1F3B";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider
        theme={{
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          colors: {
            blue: [
              "#E7F0FF",
              "#D1E3FF",
              "#A3C7FF",
              "#75ABFF",
              "#4E8FFF",
              "#2F76FF",
              "#1C5FE8",
              "#134AC2",
              "#0E3492",
              NAVY,
            ],
          },
          primaryColor: "blue",
          components: {
            Button: { defaultProps: { radius: "xl" } },
            Paper: { defaultProps: { radius: "xl" } },
          },
        }}
        defaultColorScheme="light"
      >
        <Notifications position="top-right" />
        <App />
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);
