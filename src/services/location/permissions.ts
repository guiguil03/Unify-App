import { Utils } from '@nativescript/core';

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    if (Utils.ios) {
      return await requestIosPermissions();
    } else if (Utils.android) {
      return await requestAndroidPermissions();
    }
    return false;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

async function requestIosPermissions(): Promise<boolean> {
  const CLLocationManager = require("@nativescript/core/platform").ios.CLLocationManager;
  const manager = CLLocationManager.alloc().init();
  
  const status = CLLocationManager.authorizationStatus();
  if (status === CLLocationManager.AuthorizationStatus.NotDetermined) {
    manager.requestWhenInUseAuthorization();
  }
  
  return status !== CLLocationManager.AuthorizationStatus.Denied;
}

async function requestAndroidPermissions(): Promise<boolean> {
  const { android } = require("@nativescript/core/application");
  const PERMISSIONS = android.Manifest.permission;
  
  try {
    const hasPermission = await android.requestPermissions([
      PERMISSIONS.ACCESS_FINE_LOCATION,
      PERMISSIONS.ACCESS_COARSE_LOCATION
    ]);
    return hasPermission;
  } catch (error) {
    console.error('Error requesting Android permissions:', error);
    return false;
  }
}