// -----------------------------------------------------------------------------
// App.tsx — top-level component: navigation + auth protection
// -----------------------------------------------------------------------------
// This mirrors the web app's App.tsx. While we wait to know if a saved login
// token is still valid we show nothing (to avoid a login flash), then render
// the Auth screen or the Dashboard based on whether a user is logged in.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMe } from "./src/api";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import { colors } from "./src/theme";
import type { User } from "./src/types";

export type RootStackParamList = {
  Auth: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // "user" starts as null (nobody logged in). "ready" lets us wait before
  // rendering so we don't flash the login screen at logged-in users.
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Run once when the app launches.
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setReady(true); // no token -> definitely logged out
        return;
      }
      try {
        const me = await fetchMe(); // is this token still valid?
        setUser(me);
      } catch {
        await AsyncStorage.removeItem("token"); // bad token -> clear it
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Until we know if the token is valid, show nothing to avoid flicker.
  if (!ready) return null;

  async function handleLogout() {
    await AsyncStorage.removeItem("token");
    setUser(null);
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* headerShown false: each screen draws its own header (like the web navbar). */}
        <Stack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
        >
          {user ? (
            // Render the Dashboard only when someone is logged in…
            <Stack.Screen name="Dashboard">
              {() => <DashboardScreen user={user} onUserUpdate={setUser} onLogout={handleLogout} />}
            </Stack.Screen>
          ) : (
            // …and the Auth screen when nobody is.
            <Stack.Screen name="Auth">
              {() => <AuthScreen onAuth={setUser} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}