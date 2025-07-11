import React from 'react';
import { View, ImageBackground, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer}>
      
        <ImageBackground
          source={require('../assets/images/splash-bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.layout}>
            <Image
              source={require('../assets/images/wevois_payment_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layout: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30%',
  },
  logo: {
    width: 150,
    height: 180,
    marginBottom: 50,
  },
});
