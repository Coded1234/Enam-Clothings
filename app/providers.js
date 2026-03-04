"use client";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "../client/src/context/ThemeContext";
import { store } from "../client/src/redux/store";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "744124620366-lpmacc6siit1fud76trnd2frmdfq0q29.apps.googleusercontent.com";

export function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
}
