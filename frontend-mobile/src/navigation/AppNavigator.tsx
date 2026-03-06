import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../lib/auth-context";
import { COLORS } from "../lib/constants";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import MoodScreen from "../screens/MoodScreen";
import ChatScreen from "../screens/ChatScreen";
import JournalScreen from "../screens/JournalScreen";
import CommunityScreen from "../screens/CommunityScreen";
import ExercisesScreen from "../screens/ExercisesScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  const [screen, setScreen] = useState<"login" | "register">("login");

  if (screen === "register") {
    return <RegisterScreen onNavigateLogin={() => setScreen("login")} />;
  }
  return <LoginScreen onNavigateRegister={() => setScreen("register")} />;
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerTitle: "HealMind",
        }}
      >
        {() => <DashboardScreen onNavigate={() => {}} />}
      </Tab.Screen>
      <Tab.Screen
        name="Mood"
        component={MoodScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="😊" color={color} />,
          headerTitle: "Mood Tracker",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="💬" color={color} />,
          headerTitle: "AI Therapist",
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="📝" color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="☰" color={color} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenu} options={{ headerTitle: "More" }} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="Exercises" component={ExercisesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

import { TouchableOpacity, Text, StyleSheet } from "react-native";

function MoreMenu({ navigation }: any) {
  const menuItems = [
    { label: "Community", icon: "👥", screen: "Community" },
    { label: "Exercises", icon: "🧘", screen: "Exercises" },
    { label: "Settings", icon: "⚙️", screen: "Settings" },
  ];

  return (
    <View style={menuStyles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={menuStyles.menuItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={menuStyles.menuIcon}>{item.icon}</Text>
          <Text style={menuStyles.menuLabel}>{item.label}</Text>
          <Text style={menuStyles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TabIcon({ icon }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <HomeTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: { fontSize: 24, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "500", color: COLORS.text },
  menuArrow: { fontSize: 22, color: COLORS.textTertiary },
});
