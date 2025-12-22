import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Build configuration from environment variables
const signingIdentity = process.env.APPLE_SIGNING_IDENTITY;
const macUpdateUrl = process.env.MAC_UPDATE_MANIFEST_URL;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    appBundleId: 'com.peker.turbopuffer',
    appCategoryType: 'public.app-category.developer-tools',
    ...(signingIdentity && {
      osxSign: {
        identity: signingIdentity,
        'hardened-runtime': true,
        'gatekeeper-assess': false,
        entitlements: 'entitlements.plist',
        'entitlements-inherit': 'entitlements.plist'
      }
    }),
    ...(process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD && process.env.APPLE_TEAM_ID && {
      osxNotarize: {
        tool: 'notarytool',
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID
      }
    })
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // Windows will use assets/icon.png via packagerConfig
    }),
    new MakerZIP({
      ...(macUpdateUrl && { macUpdateManifestBaseUrl: macUpdateUrl })
    }, ['darwin']),
    new MakerDMG({
      icon: './assets/icon.icns',
    }),
    new MakerDeb({
      options: {
        icon: './assets/icon.png',
        categories: ['Development', 'Utility'],
        maintainer: 'Mehmet Ali Peker',
      }
    }),
    new MakerRpm({
      options: {
        icon: './assets/icon.png',
        categories: ['Development', 'Utility'],
      }
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'MrPeker',
        name: 'turbopuffer-gui',
      },
      prerelease: false,
      draft: true, // Create as draft first, then manually publish
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
