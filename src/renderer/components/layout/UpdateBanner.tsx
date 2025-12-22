import React, { useEffect, useState } from 'react';
import { X, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UpdateInfo, UpdateState } from '../../../types/update';

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const [info, state] = await Promise.all([
        window.electronAPI.checkForUpdates(),
        window.electronAPI.getUpdateState(),
      ]);
      setUpdateInfo(info);
      setUpdateState(state);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  const handleDismiss = async () => {
    if (updateInfo?.latestVersion) {
      await window.electronAPI.dismissUpdate(updateInfo.latestVersion);
      setIsDismissed(true);
    }
  };

  const handleOpenRelease = () => {
    if (updateInfo?.releaseUrl) {
      window.electronAPI.openExternal(updateInfo.releaseUrl);
    }
  };

  // Don't show if no update, still checking, dismissed, or already dismissed this version
  if (
    isChecking ||
    !updateInfo?.hasUpdate ||
    isDismissed ||
    (updateState?.dismissedVersion && updateState.dismissedVersion === updateInfo.latestVersion)
  ) {
    return null;
  }

  return (
    <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        <span>
          A new version is available:{' '}
          <span className="font-semibold">{updateInfo.latestVersion}</span>
          <span className="text-blue-200 ml-1">(current: {updateInfo.currentVersion})</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenRelease}
          className="text-white hover:bg-blue-500 dark:hover:bg-blue-600 h-7 px-2"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Release
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-blue-500 dark:hover:bg-blue-600 h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
