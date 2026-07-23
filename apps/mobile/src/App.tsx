import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

/**
 * Mavyx Intelligence — Mobile Application
 * Built with React Native for Android and iOS.
 *
 * Screens:
 * - Login / Signup
 * - Profile (Home)
 * - AI Analysis
 * - Market
 * - Watchlist
 * - Health
 */

// ─── Theme ──────────────────────────────────────────────────────
const theme = {
  dark: '#0A0A0F',
  card: '#12121A',
  surface: '#1A1A25',
  border: '#2A2A3A',
  gold: '#C9A84C',
  goldLight: '#E8D48B',
  text: '#E8E8F0',
  textMuted: '#8888A0',
  green: '#00C853',
  red: '#FF1744',
  amber: '#FFB300',
};

// ─── Placeholder Screens ────────────────────────────────────────
// These will be replaced with full implementations

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function LoginScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MAVYX</Text>
      <Text style={styles.subtitle}>Intelligence</Text>
      <Text style={styles.description}>AI-powered Forex market intelligence</Text>
      <TouchableOpacity style={styles.btnGold} onPress={() => navigation.replace('Main')}>
        <Text style={styles.btnGoldText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnDark}>
        <Text style={styles.btnDarkText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.text}>Welcome to Mavyx Intelligence</Text>
    </View>
  );
}

function AnalysisScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Analysis</Text>
      <Text style={styles.text}>7 Specialist Agents</Text>
      <TouchableOpacity style={styles.btnGold}>
        <Text style={styles.btnGoldText}>Run Analysis</Text>
      </TouchableOpacity>
    </View>
  );
}

function MarketScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market</Text>
      <Text style={styles.text}>Live Forex Quotes</Text>
    </View>
  );
}

function WatchlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watchlist</Text>
      <Text style={styles.text}>Your Saved Pairs</Text>
    </View>
  );
}

// ─── Navigation ─────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textMuted,
        headerStyle: { backgroundColor: theme.dark },
        headerTintColor: theme.text,
      }}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>👤</Text> }} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ tabBarIcon: () => <Text>🤖</Text> }} />
      <Tab.Screen name="Market" component={MarketScreen} options={{ tabBarIcon: () => <Text>📈</Text> }} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ tabBarIcon: () => <Text>👁️</Text> }} />
    </Tab.Navigator>
  );
}

// ─── App ────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={theme.dark} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.gold,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 24,
  },
  btnGold: {
    backgroundColor: theme.gold,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnGoldText: {
    color: theme.dark,
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btnDark: {
    backgroundColor: theme.card,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  btnDarkText: {
    color: theme.text,
    fontWeight: '500',
    fontSize: 14,
  },
});
