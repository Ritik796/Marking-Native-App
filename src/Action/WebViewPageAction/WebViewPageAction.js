/**
 * @author Ritik Parmar
 * Utility functions for permissions, location tracking, WebView messaging, and cache management.
 */

import { BackHandler, Linking, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import DeviceInfo from "react-native-device-info";
import * as RNFS from 'react-native-fs';

/**
 * Requests necessary permissions for Android devices.
 * @returns {Promise<boolean>} True if all permissions are granted, false otherwise.
 */
export const requestPermissions = async () => {
  if (Platform.OS !== "android") return true; // iOS handled differently

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    // Helper to check and log denied permissions
    const checkPermission = (perm, name) => {
      if (granted[perm] !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log(`${name} permission denied`);
        return false;
      }
      return true;
    };

    const allGranted = [
      checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA, "Camera"),
      checkPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, "Location"),
      checkPermission(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, "Read External Storage"),
      checkPermission(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, "Read Media Images"),
      checkPermission(PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION, "Access Media Location"),
    ].every(Boolean);

    return allGranted;
  } catch (err) {
    console.warn("Permission error:", err);
    return false;
  }
};

/**
 * Starts location tracking if device location is enabled.
 * Posts location updates to WebView.
 * @param {Object} locationRef - Ref object to store watchId.
 * @param {Object} webViewRef - Ref to the WebView component.
 * @returns {Function} Cleanup function to stop tracking.
 */
export const startLocationTracking = async (locationRef, webViewRef, webAccRef) => {
  const isLocationOn = await DeviceInfo.isLocationEnabled().catch((err) => {
    console.error("Error checking GPS status:", err);
    return false;
  });

  if (!isLocationOn) {
    webViewRef.current?.postMessage(JSON.stringify({ type: "Location_Disabled" }));
    return;
  }

  console.log("Starting location tracking...");
  const watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`Location update: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);

      // 🔥 Always use the UPDATED accuracy value
      if (accuracy != null && accuracy <= webAccRef.current) {
        webViewRef.current?.postMessage(JSON.stringify({
          type: "location_update",
          location: { lat: latitude, lng: longitude }
        }));
      }
    },
    (error) => { },
    {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 10000,
      fastestInterval: 6000,
      maximumAge: 0,
    }
  );

  locationRef.current = watchId;

  return () => {
    if (locationRef.current != null) {
      Geolocation.clearWatch(locationRef.current);
      locationRef.current = null;
    }
  };
};


/**
 * Stops location tracking.
 * @param {Object} locationRef - Ref object containing watchId.
 */
export const stopTracking = async (locationRef) => {
  if (locationRef?.current) {
    console.log("Location tracking stopped.", locationRef.current);
    await Geolocation.clearWatch(locationRef.current);
    locationRef.current = null;
  }
};

/**
 * Gets the current location and posts it to the webViewRef.
 * @param {Object} webViewRef - Ref to the WebView component.
 * @returns {Promise<string>} "success" or "fail"
 */
export const getCurrentLocationLatlng = (webViewRef) => {
  return new Promise((resolve) => {
    try {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          webViewRef?.current?.postMessage(
            JSON.stringify({
              type: "current_Location",
              currentLocation: { lat: latitude, lng: longitude },
            })
          );
          resolve("success");
        },
        (error) => {
          console.log(error);
          let type = "Position_error";
          if (error.code === 1) type = "Location_off";
          webViewRef?.current?.postMessage(JSON.stringify({ type }));
          resolve("fail");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    } catch (error) {
      webViewRef?.current?.postMessage(JSON.stringify({ type: "Position_error" }));
      resolve("fail");
    }
  });
};

/**
 * Handles messages from WebView and triggers corresponding actions.
 * @param {Object} event - WebView message event.
 * @param {Object} locationRef - Ref object for location tracking.
 * @param {Object} webViewRef - Ref to the WebView component.
 * @param {Function} setShowCamera - Function to show camera modal.
 * @param {Function} setIsVisible - Function to set camera visibility.
 * @param {Object} isCameraActive - Ref object for camera active state.
 */
export const readWebViewMessage = async (
  event,
  locationRef,
  webViewRef,
  setShowCamera,
  setIsVisible,
  isCameraActive,
  webAccRef
) => {
  let msg;
  try {
    const data = event?.nativeEvent?.data;
    // Handle both string and object messages
    if (typeof data === "string") {
      try {
        msg = JSON.parse(data);
      } catch {
        msg = { type: data };
      }
    } else if (typeof data === "object" && data !== null) {
      msg = data;
    } else {
      console.log("Unknown message format:", data);
      return;
    }
    switch (msg?.type) {
      case "Check_Version": {
        const version = await DeviceInfo.getVersion();
        const required = msg?.requiredVersion?.toString()?.trim();
        const current = version?.toString()?.trim();
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: required === current ? "Version_Not_Expired" : "Version_Expired",
          })
        );
        break;
      }

      case "track_location":
        webAccRef.current = msg?.accuracy || 20;

        // Stop previous GPS listener before adding new
        await stopTracking(locationRef);

        startLocationTracking(locationRef, webViewRef, webAccRef);
        break;


      case "OPEN_GOOGLE_MAP":
        if (msg.url) {
          Linking.openURL(msg.url);    // ✅ Opens Google Maps App / Browser
        }
        break;
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
      case "stopTracking":
        stopTracking(locationRef);
        break;

      case "Exit_App":
        handleExit(locationRef);
        break;
      case "Get_Location":
        getCurrentLocation(locationRef, webViewRef);
        break;

      case "resetAccuracy":
        webAccRef.current = 0;
      case "errorMessage":
      case "info":

        break;

      default:

        break;
    }
  } catch (err) {
    console.error("Error in readWebViewMessage:", err);
    webViewRef?.current?.postMessage(JSON.stringify({ type: "Message_Error" }));
  }
};

const getCurrentLocation = (locationRef, webViewRef) => {
  stopTracking(locationRef);
  setTimeout(() => {
    startLocationTracking(locationRef, webViewRef);
  }, 2000);
};
/**
 * Clears app cache and temp files.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const appCacheClear = async () => {
  try {
    const tempDirectoryPath = RNFS.TemporaryDirectoryPath;
    const cacheDirectoryPath = RNFS.CachesDirectoryPath;

    await deleteFolderContents(tempDirectoryPath);
    await deleteFolderContents(cacheDirectoryPath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Deletes all contents of a folder.
 * @param {string} folderPath - Path to the folder.
 */
const deleteFolderContents = async (folderPath) => {
  try {
    const items = await RNFS.readDir(folderPath);
    for (const item of items) {
      await RNFS.unlink(item.path);
    }
  } catch (error) {
    // Optionally log error
  }
};

/**
 * Handles app exit by stopping location tracking and exiting the app.
 * @param {Object} locationRef - Ref object for location tracking.
 */
const handleExit = (locationRef) => {
  stopTracking(locationRef);
  BackHandler.exitApp();
};