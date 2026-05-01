
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
    },
  };

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? MyDarkTheme : MyLightTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* <Stack.Screen name="signin" options={{ headerShown: false }} /> */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}



// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/use-color-scheme';

// // 👇 apna colors import karo
// import { Colors } from '@/constants/theme';

// // export const unstable_settings = {
// //   anchor: '(tabs)',
// // };


// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   // 👇 custom theme bana rahe hain
//   const MyLightTheme = {
//     ...DefaultTheme,
//     colors: {
//       ...DefaultTheme.colors,
//       background: Colors.light.background, // 🔥 yaha se control hoga
//     },
//   };

//   const MyDarkTheme = {
//     ...DarkTheme,
//     colors: {
//       ...DarkTheme.colors,
//       background: Colors.dark.background,
//     },
//   };

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? MyDarkTheme : MyLightTheme}>
//       <Stack>
//           {/* 👇 Welcome first */}
//         <Stack.Screen name="index" options={{ headerShown: false }} />

//         {/* 👇 Auth */}
//         <Stack.Screen name="signin" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         {/* <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }



