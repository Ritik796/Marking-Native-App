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
import DeviceInfo from "react-native-device-info";
import * as RNFS from 'react-native-fs';

import LoadingScreen from "./LoadingScreen";
import CameraComponent from "../components/Camera/Camera";
import * as action from "../Action/WebViewPageAction/WebViewPageAction";

const WebViewPage = () => {
  const appState = useRef(AppState.currentState);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [base64Image, setBase64Image] = useState("");
  const [loader, setLoader] = useState(false);
  const [webKey, setWebKey] = useState(0);
  const [webData, setWebData] = useState({ userId: "", city: "" });
  const webViewRef = useRef(null);
  const locationRef = useRef(null);
  const isCameraActive = useRef(null);

  useEffect(() => {
    action.requestPermissions();

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const backAction = () => {
      console.log("backAction");
      webViewRef.current?.postMessage(JSON.stringify({ type: "EXIT_REQUEST" }));
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (webData.userId && webData.city) {
      action.startLocationTracking(webData.userId, webData.city, locationRef);
    }
  }, [webData.userId, webData.city]);

  const handleAppStateChange = async (nextAppState) => {
    console.log("AppState changed:", nextAppState);
    isCameraActive.current = false;

    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      if (isCameraActive.current) {
        console.log("Back from camera, skipping reload.");
        isCameraActive.current = false;
      } else {
        console.log("Reloading WebView on app foreground via key change.");
        setLoading(true);
        await cleanupAppCache();
        setWebKey((prevKey) => prevKey + 1);
        setShowCamera(false);
        setIsVisible(false);
      }
    }

    if (nextAppState.match(/inactive|background/)) {
      console.log("App moved to background/inactive. Stopping location tracking.", locationRef.current);
      action.stopLocationTracking(locationRef, setWebData);
    }

    appState.current = nextAppState;
  };

  const handleStopLoading = () => {
    setTimeout(() => setLoading(false), 1000);
  };

  const handleWebViewMessage = async (event) => {
    const message = event?.nativeEvent?.data;

    try {
      const data = JSON.parse(message);

      switch (data?.type) {
        case "Check_Version": {
          const version = DeviceInfo.getVersion();
          const required = data?.requiredVersion?.toString()?.trim();
          if (required === version?.toString()?.trim()) {
            webViewRef.current?.postMessage(JSON.stringify({ type: "Version_Not_Expired" }));
          } else {
            webViewRef.current?.postMessage(JSON.stringify({ type: "Version_Expired" }));
          }
          break;
        }

        case "errorMessage":
          console.log(data.msg);
          break;

        case "track_location":
          setWebData((pre) => ({
            ...pre,
            userId: data.msg.userId,
            city: data.msg.city,
          }));
          break;

        case "info":
          console.log(data.msg);
          break;

        default:
          break;
      }
    } catch (err) {
      switch (message) {
        case "open_Camera": {
          const isLocationEnabled = await DeviceInfo.isLocationEnabled();
          if (isLocationEnabled) {
            isCameraActive.current = true;
            setShowCamera(true);
            setIsVisible(true);
          } else {
            webViewRef.current?.postMessage(JSON.stringify({ type: "Location_Disabled" }));
            isCameraActive.current = false;
          }
          break;
        }

        case "Stop_location":
          action.stopLocationTracking(locationRef, setWebData);
          break;
        case "startLocation":
          action.startLocationTracking(webData.userId, webData.city, locationRef);
          break;
        case "stopTracking":
          action.stopTracking(locationRef);
          break;

        case "Exit_App":
          handleExit();
          break;

        default:
          console.warn("Unhandled WebView message:", message);
      }
    }
  };
const cleanupAppCache = async () => {
  try {
    const tempDirectoryPath = RNFS.TemporaryDirectoryPath;
    const cacheDirectoryPath = RNFS.CachesDirectoryPath;

    await deleteFolderContents(tempDirectoryPath);
    await deleteFolderContents(cacheDirectoryPath);

    console.log('App cache cleaned successfully.');
    return true;
  } catch (error) {
    console.error('Error cleaning app cache:', error);
    return false;
  }
};

const deleteFolderContents = async (folderPath) => {
  try {
    const items = await RNFS.readDir(folderPath);
    for (const item of items) {
      await RNFS.unlink(item.path);
    }
  } catch (error) {
    console.error(`Failed to clean contents of: ${folderPath}`, error);
  }
};

  const handleExit = () => {
    action.stopLocationTracking(locationRef, setWebData);
    BackHandler.exitApp();
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
            webData={webData}
            locationRef={locationRef}
          />
        )}

        {/* ✅ Improved KeyboardAvoidingView */}
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
            source={{ uri: "https://interview-8f792.web.app/" }}
            style={{ flex: 1, minHeight: "100%" }} // ✅ Ensure full height
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
    backgroundColor:"black"
  },
  container: {
    flex: 1,
  },
});

export default WebViewPage;
