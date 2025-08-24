import React from 'react';
import { View, ImageBackground, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

/**
 * SplashScreen component displays the app splash with background and logo.
 */
const SplashScreen = () => (
  <SafeAreaProvider>
    <SafeAreaView style={styles.safeContainer}>
      <ImageBackground
        source={require('../assets/images/splash-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.layout}>
          <Image
            source={require('../assets/images/company_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  </SafeAreaProvider>
);

export default SplashScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layout: {
    alignItems: 'center',
    justifyContent: 'center',
  },
logo: {
    width: 115,
    height: 115,
    marginBottom: 40,
  }
});