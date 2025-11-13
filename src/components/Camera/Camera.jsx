import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useCameraDevice } from 'react-native-vision-camera';
import { cameraStyle as styles } from './CameraStyle';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import Loader from '../Loader/Loader';
import * as webAction from '../../Action/WebViewPageAction/WebViewPageAction';
const CameraComponent = ({
  isVisible,
  onClose,
  setBase64Image,
  webViewRef,
  base64Image,
  setShowCamera,
  setIsVisible,
  setLoader,
  loader, locationRef, webAccRef
}) => {
  const cameraRef = useRef(null);
  const lastSent = useRef(0);

  const [cameraOpen, setCameraOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [cameraData, setCameraData] = useState({ photoUri: "", resizedUri: "", thumbnailUri: "" });

  const device = useCameraDevice('back');
  useEffect(() => {

    const manageLocationTracking = async () => {
      if (isVisible) {
        // Pause tracking
        console.log("⏸ Pausing location tracking");
        await webAction.stopTracking(locationRef);

        // Open camera slightly later to avoid UI lag
        setTimeout(() => {
          setCameraOpen(true);
        }, 500);
      }
    };

    manageLocationTracking();

    return () => {
      const resumeTracking = async () => {
        console.log("▶️ Resuming location tracking");

        await webAction.startLocationTracking(locationRef, webViewRef, webAccRef);

        setCameraOpen(false);
      };

      resumeTracking();
    };

  }, [isVisible, locationRef, webViewRef]);

  // Delete a file if it exists
  const deleteFile = async (filePath) => {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) await RNFS.unlink(filePath);
    } catch (error) {
      // console.log('Failed to delete file:', error);
    }
  };

  const captureImage = useCallback(async () => {
    if (!cameraRef.current) return;
    setLoader(true);

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "speed",
        quality: 0.8,
      });

      // Helper function for compressing with size check
      const compressUntilLimit = async (path, maxW, maxH, maxKB, startQuality = 85) => {
        let quality = startQuality;
        let image = null;
        let stats = null;

        do {
          image = await ImageResizer.createResizedImage(
            path,
            maxW,
            maxH,
            "JPEG",
            quality,
            0,
            undefined,
            false,
            { mode: "cover", onlyScaleDown: true, format: "JPEG" }
          );
          stats = await RNFS.stat(image.uri);

          console.log(`👉 Trying quality ${quality}, got size ${(stats.size / 1024).toFixed(2)} KB`);

          quality -= 10; // reduce quality step by step
          if (quality < 30) break; // stop at 30% to avoid bad quality
        } while (stats.size > maxKB * 1024);

        return { image, stats };
      };

      // Compress main image (max 50KB)
      const { image: resizedImage, stats: resizedStats } = await compressUntilLimit(
        photo.path,
        800,
        800,
        50,
        85
      );

      // Compress thumbnail (max 15KB)
      const { image: thumbnailImage, stats: thumbStats } = await compressUntilLimit(
        photo.path,
        180,
        180,
        15,
        85
      );

      // ---- Read Base64 ----
      const base64Data = await RNFS.readFile(resizedImage.uri, "base64");
      const formattedBase64 = `data:image/jpeg;base64,${base64Data}`;

      const thumbBase64Data = await RNFS.readFile(thumbnailImage.uri, "base64");
      const thumbBase64DataFormatted = `data:image/jpeg;base64,${thumbBase64Data}`;

      console.log("✅ Final Sizes:");
      console.log("Main:", (resizedStats.size / 1024).toFixed(2), "KB");
      console.log("Thumb:", (thumbStats.size / 1024).toFixed(2), "KB");

      // ---- Update State ----
      setCameraData({
        photoUri: photo.path,
        resizedUri: resizedImage.uri,
        thumbnailUri: thumbnailImage.uri,
      });
      setBase64Image((pre) => ({
        ...pre,
        actualImg: formattedBase64,
        thumbnailImg: thumbBase64DataFormatted,
      }));
      setCameraOpen(false);
      setShowPreview(true);
    } catch (err) {
      console.error("Error capturing or resizing image:", err);
    }

    setLoader(false);
  }, [setBase64Image, setLoader]);



  // Confirm photo, send to WebView, clean up files
  const confirmPhoto = async () => {
    setLoader(true);
    try {
      const now = Date.now();
      if (base64Image && now - lastSent.current > 3000) {
        lastSent.current = now;
        webViewRef.current?.postMessage(JSON.stringify({ image: base64Image.actualImg, thumbnailImage: base64Image.thumbnailImg }));
      }
      if (cameraData.photoUri) await deleteFile(cameraData.photoUri);
      if (cameraData.resizedUri) await deleteFile(cameraData.resizedUri);
      if (cameraData.thumbnailUri) await deleteFile(cameraData.thumbnailUri);
      setBase64Image(pre => ({ ...pre, actualImg: "", thumbnailImg: "" }));
      setCameraData({ photoUri: null, resizedUri: null, thumbnailUri: null });
    } catch (error) {
      // console.log('Error during photo confirmation or cleanup:', error);
    }
    setLoader(false);
    handleClose();
  };

  // Close camera modal and reset preview
  const handleClose = () => {
    setCameraOpen(false);
    setShowPreview(false);
    setTimeout(() => {
      setShowCamera(false);
      setIsVisible(false);
    }, 300);
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.safeContainer}>
        <View style={styles.container}>
          {loader && <Loader />}

          <View style={styles.header}>
            <TouchableOpacity style={styles.headerLeft} onPress={onClose}>
              <Text style={styles.headerText}>
                {showPreview ? 'Proceed to save' : 'Capture Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View
              style={styles.cameraPreviewContainer}
              onLayout={() => setIsLayoutReady(true)}
            >
              {showPreview ? (
                <Image
                  source={{ uri: base64Image.actualImg }}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  onLoadEnd={() => setLoader(false)}
                />
              ) : (
                isLayoutReady &&
                device &&
                cameraOpen && (
                  <Camera
                    ref={cameraRef}
                    style={styles.cameraContainer}
                    device={device}
                    isActive={cameraOpen}
                    photo={true}
                  />
                )
              )}
            </View>

            <View style={styles.footerBotttom}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.captureTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureBtn}
                onPress={showPreview ? confirmPhoto : captureImage}
              >
                <Text style={styles.captureTxt}>
                  {showPreview ? 'Proceed' : 'Capture'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CameraComponent;