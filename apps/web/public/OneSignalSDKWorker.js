/* OneSignal Web Push service worker (dashboard default root path + scope "/").
 * Do not register a second root-scope worker (e.g. /sw.js) alongside this file —
 * competing registrations abort pushManager.subscribe mid-flight.
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
