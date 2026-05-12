import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import LevelSelectScreen from '../screens/LevelSelectScreen';
import GameScreen from '../screens/GameScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Shop: undefined;
  LevelSelect: undefined;
  Game: { levelId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { init, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        initialRouteName="Auth"
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
