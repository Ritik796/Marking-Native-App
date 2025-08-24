import React, { useEffect, useRef, useState } from "react";
import WebView from "react-native-webview";
import {
  StyleSheet,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import LoadingScreen from "./LoadingScreen";
import CameraComponent from "../components/Camera/Camera";
import * as action from "../Action/WebViewPageAction/WebViewPageAction";

const WebViewPage = () => {
  // Refs and state
  const appState = useRef(AppState.currentState);
  const webViewRef = useRef(null);
  const locationRef = useRef(null);
  const isCameraActive = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [base64Image, setBase64Image] = useState("");
  const [loader, setLoader] = useState(false);
  const [webKey, setWebKey] = useState(0);

  // Request permissions and subscribe to app state changes
  useEffect(() => {
    action.requestPermissions();

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      webViewRef.current?.postMessage(JSON.stringify({ type: "EXIT_REQUEST" }));
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  /**
   * Handles app state changes (foreground/background).
   * @param {string} nextAppState
   */
  const handleAppStateChange = async (nextAppState) => {
    isCameraActive.current = false;

    // App comes to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      if (isCameraActive.current) {
        // Back from camera, skip reload
        isCameraActive.current = false;
      } else {
        // Reload WebView on app foreground
        setLoading(true);
        await cleanupAppCache();
        setWebKey((prevKey) => prevKey + 1);
        setShowCamera(false);
        setIsVisible(false);
      }
    }

    // App goes to background/inactive
    if (nextAppState.match(/inactive|background/)) {
      action.stopTracking(locationRef);
    }

    appState.current = nextAppState;
  };

  /**
   * Handles WebView loading end.
   */
  const handleStopLoading = () => {
    setTimeout(() => setLoading(false), 1000);
  };

  /**
   * Handles messages from WebView.
   * @param {Object} event
   */
  const handleWebViewMessage = (event) => {
    action.readWebViewMessage(
      event,
      locationRef,
      webViewRef,
      setShowCamera,
      setIsVisible,
      isCameraActive
    );
  };

  /**
   * Clears app cache.
   */
  const cleanupAppCache = async () => {
    await action.appCacheClear();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer}>
        {loading && <LoadingScreen />}

        {showCamera && (
          <CameraComponent
            loader={loader}
            setLoader={setLoader}
            isCameraActive={isCameraActive}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            setBase64Image={setBase64Image}
            setShowCamera={setShowCamera}
            webViewRef={webViewRef}
            base64Image={base64Image}
            locationRef={locationRef}
          />
        )}

        {/* KeyboardAvoidingView for input fields */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          enabled
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <WebView
            key={webKey}
            ref={webViewRef}
            onMessage={handleWebViewMessage}
            source={{ uri: "https://marking-app-5557a.web.app" }}
            style={{ flex: 1, minHeight: "100%" }}
            geolocationEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            onLoadEnd={handleStopLoading}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
  },
});

export default WebViewPage;