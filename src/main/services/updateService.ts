import { app, net } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { UpdateInfo, UpdateState, GitHubRelease } from '../../types/update';

const GITHUB_REPO = 'MrPeker/turbopuffer-gui';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Skip update checks in development mode
const isDevelopment = !app.isPackaged;

export class UpdateService {
  private static instance: UpdateService;
  private statePath: string;
  private state: UpdateState = {
    lastCheckTime: null,
    dismissedVersion: null,
  };

  private constructor() {
    const userDataPath = app.getPath('userData');
    this.statePath = path.join(userDataPath, 'update-state.json');
  }

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  async loadState(): Promise<UpdateState> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8');
      this.state = JSON.parse(data);
      return this.state;
    } catch {
      // File doesn't exist or is invalid, use defaults
      return this.state;
    }
  }

  async saveState(): Promise<void> {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  async getUpdateState(): Promise<UpdateState> {
    await this.loadState();
    return this.state;
  }

  async dismissUpdate(version: string): Promise<void> {
    await this.loadState();
    this.state.dismissedVersion = version;
    await this.saveState();
  }

  private getCurrentVersion(): string {
    return app.getVersion();
  }

  private compareVersions(current: string, latest: string): boolean {
    // Remove 'v' prefix if present
    const cleanCurrent = current.replace(/^v/, '');
    const cleanLatest = latest.replace(/^v/, '');

    const currentParts = cleanCurrent.split('.').map(Number);
    const latestParts = cleanLatest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const curr = currentParts[i] || 0;
      const lat = latestParts[i] || 0;

      if (lat > curr) return true;
      if (lat < curr) return false;
    }

    return false;
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = this.getCurrentVersion();

    // Skip update checks in development mode
    if (isDevelopment) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        releaseUrl: null,
        releaseNotes: null,
        publishedAt: null,
      };
    }

    try {
      const release = await this.fetchLatestRelease();

      if (!release) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: null,
          releaseUrl: null,
          releaseNotes: null,
          publishedAt: null,
        };
      }

      const latestVersion = release.tag_name;
      const hasUpdate = this.compareVersions(currentVersion, latestVersion);

      // Update last check time
      await this.loadState();
      this.state.lastCheckTime = Date.now();
      await this.saveState();

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
        releaseNotes: release.body,
        publishedAt: release.published_at,
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        releaseUrl: null,
        releaseNotes: null,
        publishedAt: null,
      };
    }
  }

  private fetchLatestRelease(): Promise<GitHubRelease | null> {
    return new Promise((resolve) => {
      const request = net.request({
        method: 'GET',
        url: GITHUB_API_URL,
      });

      request.setHeader('User-Agent', `turbopuffer-gui/${this.getCurrentVersion()}`);
      request.setHeader('Accept', 'application/vnd.github.v3+json');

      let responseData = '';

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          console.error(`GitHub API returned status ${response.statusCode}`);
          resolve(null);
          return;
        }

        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          try {
            const release = JSON.parse(responseData) as GitHubRelease;
            // Skip prereleases and drafts
            if (release.prerelease || release.draft) {
              resolve(null);
            } else {
              resolve(release);
            }
          } catch {
            console.error('Failed to parse GitHub API response');
            resolve(null);
          }
        });
      });

      request.on('error', (error) => {
        console.error('GitHub API request failed:', error);
        resolve(null);
      });

      request.end();
    });
  }

  shouldCheckForUpdates(): boolean {
    if (!this.state.lastCheckTime) return true;
    return Date.now() - this.state.lastCheckTime > CHECK_INTERVAL_MS;
  }
}
