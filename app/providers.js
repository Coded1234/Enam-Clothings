"use client";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "../client/src/context/ThemeContext";
import { AnnouncementsProvider } from "../client/src/context/AnnouncementsContext";
import { store } from "../client/src/redux/store";
import { loadUser } from "../client/src/redux/slices/authSlice";

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "744124620366-lpmacc6siit1fud76trnd2frmdfq0q29.apps.googleusercontent.com";

function AppInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return children;
}

export function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <AppInitializer>
          <ThemeProvider>
            <AnnouncementsProvider>{children}</AnnouncementsProvider>
          </ThemeProvider>
        </AppInitializer>
      </Provider>
    </GoogleOAuthProvider>
  );
}
