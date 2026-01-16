package com.sugumarjagadeesh45.reals2chat

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.content.Intent // Import this
import com.dieam.reactnativepushnotification.modules.RNPushNotificationHelper // Import for push notifications

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Reals2Chat"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)


// Required for react-native-push-notification to handle notifications when app is already open
override fun onNewIntent(intent: Intent?) {
      super.onNewIntent(intent)
      // The RNPushNotificationHelper line is not needed and causes the error.
      // React Native and the library's receivers handle the intent automatically.
  }


  
}
