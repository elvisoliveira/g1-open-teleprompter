# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep custom Bluetooth native module - CRITICAL for APK builds
-keep class com.teleprompter.BluetoothAdapterModule { *; }
-keep class com.teleprompter.BluetoothAdapterPackage { *; }
-keep class com.teleprompter.BluetoothAdapterModule$* { *; }

# Keep React Native bridge classes and annotations
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.core.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
-keep @com.facebook.react.bridge.ReactModule class * { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }

# Add any project specific keep options here:
