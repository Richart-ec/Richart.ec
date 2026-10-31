/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// SVG filters, Google Fonts and large product PNGs can take a while on first paint.
Config.setDelayRenderTimeoutInMilliseconds(120000);

// Only for sandboxed/cloud machines whose network goes through a proxy: point
// REMOTION_BROWSER_WRAPPER at a script that launches Chrome with --proxy-server.
// On a normal machine this variable is unset and Remotion uses its own browser.
if (process.env.REMOTION_BROWSER_WRAPPER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_WRAPPER);
}
