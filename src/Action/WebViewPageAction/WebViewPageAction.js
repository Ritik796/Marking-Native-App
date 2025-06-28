import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import DeviceInfo from "react-native-device-info";
import * as service from "../../Services/locationService";

export const requestPermissions = async () => {
  try {
    if (Platform.OS !== "android") return true; // iOS handled differently

    let isPermission = true;
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
    ]);

    if (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("Camera permission denied");
      isPermission = false;
    }

    if (
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !==
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("Location permission denied");
      isPermission = false;
    }
    if (
      granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !==
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("READ_EXTERNAL_STORAGE permission denied");
      isPermission = false;
    }
    if (
      granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] !==
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("READ_MEDIA_IMAGES permission denied");
      isPermission = false;
    }
    if (
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION] !==
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("ACCESS_MEDIA_LOCATION permission denied");
      isPermission = false;
    }

    return isPermission;
  } catch (err) {
    console.warn("Permission error:", err);
    return false;
  }
};


// export const startLocationTracking = async (userId, city, locationRef) => {
//   if (!userId || !city) {
//     console.warn("Invalid userId or city");
//     return () => {};
//   }

//   const isLocationOn = await DeviceInfo.isLocationEnabled().catch((err) => {
//     console.error("Error checking GPS status:", err);
//     return false;
//   });

//   if (!isLocationOn) {
//     console.warn("Device location is OFF. Saving blank.");
//     service.updateLocationByUserId(userId, city, "", "");
//     return () => {};
//   }

//   console.log("📡 Starting location tracking...");
//   let previousTime = null; // No time initially → first update happens

//   const watchId = Geolocation.watchPosition(
//     (position) => {
//       const { latitude, longitude, accuracy } = position.coords;
//       const currentTime = Date.now(); // Current time in ms

//       console.log("📍 GPS:", latitude, longitude, "Accuracy:", accuracy);

//       if (accuracy <= 15) {
//         if (!previousTime) {
//           // First update
//           console.log("✅ First location → saving immediately");
//           service.updateLocationByUserId(userId, city, latitude, longitude);
//           previousTime = currentTime;
//         } else {
//           const secondsPassed = Math.floor((currentTime - previousTime) / 1000);
//           console.log("⏱️ Seconds since last update:", secondsPassed);

//           if (secondsPassed >= 8) {
//             console.log("✅ 8+ seconds passed → saving location");
//             service.updateLocationByUserId(userId, city, latitude, longitude);
//             previousTime = currentTime;
//           } else {
//             console.log("⏳ Less than 5s → Skipping update");
//           }
//         }
//       } else {
//         console.log("⚠️ Low accuracy (" + accuracy + "m) → Skipping update");
//       }
//     },
//     (error) => {
//       console.error("❌ Geolocation error:", error);
//       service.updateLocationByUserId(userId, city, "", "");
//     },
//     {
//       enableHighAccuracy: true,
//       distanceFilter: 10,
//       interval: 10000,
//       fastestInterval: 6000,
//       maximumAge: 0,
//       useSignificantChanges: false,
//     }
//   );

//   locationRef.current = watchId;

//   return () => {
//     if (locationRef.current != null) {
//       console.log("🛑 Stopping location tracking...");
//       Geolocation.clearWatch(locationRef.current);
//       locationRef.current = null;
//     }
//   };
// };
export const startLocationTracking = async (userId, city, locationRef) => {
  if (!userId || !city) {
    console.warn("Invalid userId or city");
    return () => { };
  }

  console.log("Checking if device location is enabled…");
  const isLocationOn = await DeviceInfo.isLocationEnabled().catch((err) => {
    console.error("Error checking GPS status:", err);
    return false;
  });

  if (!isLocationOn) {
    console.warn("Device location (GPS) is OFF. Recording blank location.");
    service.updateLocationByUserId(userId, city, "", "");
    return () => { };
  }
  console.log("Starting watchPosition…");
  const watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("watchPosition callback:", latitude, longitude, accuracy);

      if (accuracy != null && accuracy <= 15) {
        service.updateLocationByUserId(userId, city, latitude, longitude);
      } else {
        console.log("Skipped low-accuracy position:", accuracy);
      }
    },
    (error) => {
      service.updateLocationByUserId(userId, city, "", "");
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10,          // Trigger every ~10 meter
      interval: 10000,            // Regular update every 10s
      fastestInterval: 6000,      // Minimum interval for updates
      useSignificantChanges: false,
      maximumAge: 0
    }

  );

  locationRef.current = watchId;
  console.log("watchId stored:", watchId);

  return () => {
    if (locationRef.current != null) {
      console.log("Clearing watchPosition with id:", locationRef.current);
      Geolocation.clearWatch(locationRef.current);
      locationRef.current = null;
    }
  };
}

export const stopLocationTracking = (locationRef, setWebData) => {
  if (locationRef?.current) {
    console.log("Location tracking stopped.", locationRef.current);
    Geolocation.clearWatch(locationRef.current);
    locationRef.current = null;

    if (setWebData) {
      setWebData((prev) => ({ ...prev, userId: "", city: "" }));
    }
  }
};

export const stopTracking = async (locationRef) => {
  if (locationRef?.current) {
    console.log("Location tracking stopped.", locationRef.current);
    await Geolocation.clearWatch(locationRef.current);
    locationRef.current = null;
  }
};

export const getCurrentLocationLatlng = (webViewRef) => {
  return new Promise((resolve) => {
    try {
      Geolocation.getCurrentPosition((pos) => {
        let { latitude, longitude, accuracy } = pos.coords;
        webViewRef?.current?.postMessage(JSON.stringify({ type: "current_Location", currentLocation: { lat: latitude, lng: longitude } }));
        resolve('success');

      }, (error) => {
        console.log(error);
        if (error.code === 1) {
          webViewRef?.current?.postMessage(JSON.stringify({ type: "Location_off" }));
          resolve('fail');
        }
        else if (error.code === 2) {
          webViewRef?.current?.postMessage(JSON.stringify({ type: "Position_error" }));
          resolve('fail');
        }
        else if (error.code === 3) {
          webViewRef?.current?.postMessage(JSON.stringify({ type: "Position_error" }));
          resolve('fail');
        }
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      });
    } catch (error) {
      webViewRef?.current?.postMessage(JSON.stringify({ type: "Position_error" }));
    }
  });
};
