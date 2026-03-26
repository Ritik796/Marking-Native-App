import React, { useEffect, useRef, useState } from "react";
import WebView from "react-native-webview";
import {
  StyleSheet,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import LoadingScreen from "./LoadingScreen";
import CameraComponent from "../components/Camera/Camera";
import * as action from "../Action/WebViewPageAction/WebViewPageAction";
import WebViewErrorScreen from "../components/WebViewErrorScreen/WebViewErrorScreen";

const WebViewPage = () => {
  const appState = useRef(AppState.currentState);
  const webViewRef = useRef(null);
  const locationRef = useRef(null);
  const isCameraActive = useRef(null);
  const isWebViewReady = useRef(false); // ✅ New flag

  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [base64Image, setBase64Image] = useState({ actualImg: "", thumbnailImg: "" });
  const [loader, setLoader] = useState(false);
  const [webKey, setWebKey] = useState(0);
  const [netWorkError, setNetWorkError] = useState(false);
  const { ConnectivityModule } = NativeModules;
  const webAccRef = useRef(0);
  const isTrackingRef = useRef(false);
  const appLoadingRef = useRef(false);

// const WEB_URL = `https://marking-test-c61f5.web.app`; // testing
const WEB_URL = ` https://entity-markings-ea3ff.web.app`; // production

  // ✅ Setup device permission and app state listener
  useEffect(() => {
    action.requestPermissions();
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ✅ Hardware back button
  useEffect(() => {
    const backAction = () => {
      webViewRef.current?.postMessage(JSON.stringify({ type: "EXIT_REQUEST" }));
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // ✅ Listen for native network + location changes
  useEffect(() => {
    const mobileNetWorkStatus = DeviceEventEmitter.addListener("onConnectivityStatus", (mobile) => {
      if (isWebViewReady.current && mobile) {
        webViewRef?.current?.postMessage(
          JSON.stringify({ type: "onConnectivityStatus", status: mobile.isMobileDataOn })
        );
        console.log("📶 Sent network status → WebView:", mobile.isMobileDataOn);
      } else {
        console.log("⏳ WebView not ready yet — skipped network emit");
      }
    });

    const locationOnStatus = DeviceEventEmitter.addListener("onLocationStatus", (location) => {
      if (isWebViewReady.current && location) {
        webViewRef?.current?.postMessage(
          JSON.stringify({ type: "onLocationStatus", status: location.isLocationOn })
        );
        if (location.isLocationOn) {
          console.log('webAccRef', webAccRef.current);
          // ✅ Prevent multiple start calls
          if (!isTrackingRef.current) {
            isTrackingRef.current = true;
            if (webAccRef.current) {
              action.startLocationTracking(locationRef, webViewRef, webAccRef);

              console.log("🔥 Location Tracking Started");
            }
          }

        } else {

          // ✅ Prevent multiple stop calls
          if (isTrackingRef.current) {
            isTrackingRef.current = false;
            action.stopTracking(locationRef);
            console.log("🛑 Location Tracking Stopped");
          }
        }
        console.log("📍 Sent location status → WebView:", location.isLocationOn);
      } else {
        console.log("⏳ WebView not ready yet — skipped location emit");
      }
    });

    // ❌ Don't start connectivity monitoring until WebView ready
    return () => {
      mobileNetWorkStatus.remove();
      locationOnStatus.remove();
      stopConnectivityListener(ConnectivityModule);
    };
  }, []);

  // ✅ Called when WebView has loaded completely
  const handleStopLoading = () => {
    console.log("✅ WebView ready, now starting connectivity monitor");
    isWebViewReady.current = true; // 🔥 WebView is now safe to receive messages
    setTimeout(() => setLoading(false), 1000);
    startConnectivityListener(ConnectivityModule);
  };

  const startConnectivityListener = (ConnectivityModule) => {
    try {
      ConnectivityModule.startMonitoring();
    } catch (err) {
      console.error("Failed to start monitoring:", err);
    }
  };

  const stopConnectivityListener = (ConnectivityModule) => {
    try {
      ConnectivityModule.stopMonitoring();
    } catch (err) {
      console.error("Failed to stop monitoring:", err);
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    const wasCameraActive = isCameraActive.current;
    isCameraActive.current = false;

    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      if (!wasCameraActive) {
        startConnectivityListener(ConnectivityModule);
        if (appLoadingRef.current === true) {
          setLoading(true);
          setWebKey((prevKey) => prevKey + 1);
        }
        setShowCamera(false);
        setIsVisible(false);
      }
    }

    if (nextAppState.match(/inactive|background/)) {
      isTrackingRef.current = false;
      action.stopTracking(locationRef);
      stopConnectivityListener(ConnectivityModule);
    }

    appState.current = nextAppState;
  };
  const handleWebViewMessage = (event) => {
    action.readWebViewMessage(
      event,
      locationRef,
      webViewRef,
      setShowCamera,
      setIsVisible,
      isCameraActive,
      webAccRef,
      appLoadingRef
    );
  };
  const handleRetry = () => {
    setLoading(true);
    setWebKey(prevKey => prevKey + 1);
    setNetWorkError(false);
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeContainer}>
        {loading && <LoadingScreen />}
        {netWorkError && <WebViewErrorScreen handleRetry={handleRetry} />}
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
            webAccRef={webAccRef}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          enabled
        >
          <WebView
            key={webKey}
            ref={webViewRef}
            onMessage={handleWebViewMessage}
            source={{ uri: WEB_URL }}
            style={{ flex: 1 }}
            geolocationEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            onError={() => setNetWorkError(true)}
            onLoadEnd={handleStopLoading} // ✅ Mark WebView as ready here
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
});

export default WebViewPage;
