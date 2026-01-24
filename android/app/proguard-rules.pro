###############################################################################
# 🔥 REQUIRED RULES – FIX R8 CRASH FOR RELEASE BUILD
###############################################################################

# Vision Camera (JSI based)
-keep class com.mrousavy.camera.** { *; }
-keepclassmembers class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# React Native Core + Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Reanimated (JSI)
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# TurboModules / JSI
-keep class com.swmansion.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep JNI native methods
-keepclasseswithmembers class * {
    native <methods>;
}

# Annotations
-keep class androidx.annotation.** { *; }
-dontwarn javax.annotation.**

###############################################################################
# ML Kit (ONLY IF YOU USE OCR)
###############################################################################
# -keep class com.google.mlkit.** { *; }
# -keep interface com.google.mlkit.** { *; }
# -dontwarn com.google.mlkit.**
