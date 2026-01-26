import { ipcMain, systemPreferences } from 'electron';
import { CredentialService } from '../services/credentialService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Prompt for system authentication on Windows using PowerShell and Windows Security
 */
async function promptWindowsAuth(reason: string): Promise<void> {
  // Use PowerShell to invoke the Windows Credential UI
  // This prompts for the user's Windows password/PIN/Windows Hello
  const script = `
    Add-Type -AssemblyName System.DirectoryServices.AccountManagement
    $contextType = [System.DirectoryServices.AccountManagement.ContextType]::Machine
    $context = New-Object System.DirectoryServices.AccountManagement.PrincipalContext($contextType)

    # Get current username
    $username = [System.Environment]::UserName

    # Prompt for credentials using Windows security dialog
    $cred = Get-Credential -UserName $username -Message "${reason}"
    if ($null -eq $cred) {
      exit 1
    }

    # Validate the credentials
    $valid = $context.ValidateCredentials($cred.UserName, $cred.GetNetworkCredential().Password)
    if (-not $valid) {
      exit 2
    }
    exit 0
  `;

  try {
    await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      timeout: 60000,
      windowsHide: true,
    });
  } catch (error) {
    throw new Error('Authentication required to reveal API key');
  }
}

/**
 * Prompt for system authentication on Linux using pkexec (polkit)
 */
async function promptLinuxAuth(reason: string): Promise<void> {
  // pkexec will show a native polkit authentication dialog
  // We just run a harmless command that requires auth
  try {
    await execAsync(`pkexec --disable-internal-agent echo "authenticated"`, {
      timeout: 60000,
      env: {
        ...process.env,
        // Set DISPLAY for GUI auth dialogs
        DISPLAY: process.env.DISPLAY || ':0',
      },
    });
  } catch (error) {
    // Try alternative: zenity password dialog (if polkit fails)
    try {
      const { stdout } = await execAsync(
        `zenity --password --title="Authentication Required" --text="${reason}" 2>/dev/null`,
        { timeout: 60000 }
      );
      // If zenity returns a password, the user entered something (basic validation)
      if (!stdout || stdout.trim().length === 0) {
        throw new Error('No password entered');
      }
      // Note: We're not actually validating the password here, just checking user intent
      // For true validation, we'd need PAM integration which is more complex
    } catch {
      throw new Error('Authentication required to reveal API key');
    }
  }
}

export function setupConnectionHandlers() {
  const credentialService = new CredentialService();

  // Check if system authentication is available
  ipcMain.handle('connection:canUseBiometric', async () => {
    if (process.platform === 'darwin') {
      return systemPreferences.canPromptTouchID();
    }
    if (process.platform === 'win32') {
      // Windows always has credential UI available
      return true;
    }
    if (process.platform === 'linux') {
      // Check if pkexec or zenity is available
      try {
        await execAsync('which pkexec || which zenity');
        return true;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Reveal API key with system authentication
  ipcMain.handle('connection:revealApiKey', async (event, connectionId: string) => {
    try {
      const reason = 'Turbopuffer GUI needs to verify your identity to reveal the API key';

      if (process.platform === 'darwin') {
        // macOS: Use Touch ID
        const canUseTouchID = systemPreferences.canPromptTouchID();
        if (canUseTouchID) {
          try {
            await systemPreferences.promptTouchID('reveal API key');
          } catch {
            throw new Error('Authentication required to reveal API key');
          }
        }
      } else if (process.platform === 'win32') {
        // Windows: Use Windows Credential UI
        await promptWindowsAuth(reason);
      } else if (process.platform === 'linux') {
        // Linux: Use pkexec (polkit) or zenity
        await promptLinuxAuth(reason);
      }

      return await credentialService.getApiKeyForConnection(connectionId);
    } catch (error) {
      throw new Error(`Failed to reveal API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:save', async (event, connectionData) => {
    try {
      return await credentialService.saveConnection(connectionData);
    } catch (error) {
      throw new Error(`Failed to save connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:update', async (event, updateData) => {
    try {
      return await credentialService.updateConnection(updateData);
    } catch (error) {
      throw new Error(`Failed to update connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:load', async () => {
    try {
      return await credentialService.loadConnections();
    } catch (error) {
      throw new Error(`Failed to load connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Note: Connection testing is now done in the renderer process using the Turbopuffer SDK

  ipcMain.handle('connection:delete', async (event, connectionId) => {
    try {
      await credentialService.deleteConnection(connectionId);
    } catch (error) {
      throw new Error(`Failed to delete connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:regions', async () => {
    return credentialService.getRegions();
  });

  ipcMain.handle('connection:getForUse', async (event, connectionId) => {
    try {
      return await credentialService.getConnectionForUse(connectionId);
    } catch (error) {
      throw new Error(`Failed to get connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Note: Direct connection testing is now done in the renderer process using the Turbopuffer SDK
}