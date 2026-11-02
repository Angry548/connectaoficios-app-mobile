import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { tabBarLayout } from './tabBarLayout';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute, StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import { badgeNoLeidos } from '../services/contadorNoLeidos';

// Cada pestaña conserva su propio historial. Los nombres de pantalla existentes
// se resuelven también entre pestañas sin duplicar instancias de las pantallas.
export function createRoleTabs(groups) {
  const Tab = createBottomTabNavigator();
  const destinations = Object.fromEntries(groups.flatMap(group => group.screens.map(([name]) => [name, group.name])));
  const stacks = groups.map(group => {
    const Stack = createNativeStackNavigator();
    const screens = group.screens.map(([name, Component]) => {
      function Screen(props) {
        const navigation = { ...props.navigation };
        navigation.navigate = (target, params, ...rest) => {
          const name = typeof target === 'string' ? target : target.name;
          const owner = destinations[name];
          if (owner && owner !== group.name) {
            props.navigation.getParent('RoleTabs').navigate(owner, {
              screen: name, params: typeof target === 'string' ? params : target.params,
              initial: false,
            });
          } else props.navigation.navigate(target, params, ...rest);
        };
        return <Component {...props} navigation={navigation} />;
      }
      return [name, Screen];
    });
    return function TabStack() {
      return <Stack.Navigator initialRouteName={group.initialRouteName ?? group.screens[0][0]} screenOptions={{ headerShown: false }}>
        {screens.map(([name, Component]) => <Stack.Screen key={name} name={name} component={Component} />)}
      </Stack.Navigator>;
    };
  });
  return function RoleTabs() {
    const { totalNoLeidos } = useUnreadMessages();
    const insets = useSafeAreaInsets();
    const { fontScale } = useWindowDimensions();
    const barra = tabBarLayout(insets, fontScale);
    return <Tab.Navigator id="RoleTabs" backBehavior="history" screenOptions={{
      headerShown: false, tabBarActiveTintColor: '#2563EB', tabBarInactiveTintColor: '#667085',
      tabBarHideOnKeyboard: true, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarItemStyle: { paddingVertical: 0 }, tabBarLabelPosition: 'below-icon',
      tabBarStyle: barra,
    }}>
      {groups.map((group, index) => <Tab.Screen key={group.name} name={group.name} component={stacks[index]}
        listeners={({ navigation, route }) => ({
          tabPress: event => {
            event.preventDefault();
            // Un acceso profundo conserva su destino; un toque en la barra abre la raíz.
            if (route.state?.key && route.state.index > 0) {
              navigation.dispatch({ ...StackActions.popToTop(), target: route.state.key });
            }
            navigation.navigate(group.name, {
              screen: group.initialRouteName ?? group.screens[0][0], initial: false,
            });
          },
        })}
        options={({ route }) => ({ title: group.label,
          tabBarBadge: group.name === 'MensajesTab' ? badgeNoLeidos(totalNoLeidos) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
          tabBarStyle: getFocusedRouteNameFromRoute(route) === 'Chat' ? { display: 'none' } : barra,
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? group.icon : group.icon + '-outline'} size={size} color={color} />,
        })} />)}
    </Tab.Navigator>;
  };
}
