/**
 * Local UI guard against accidental writes. This is NOT a server-side
 * permission — Turbopuffer API keys are not scoped, so the same key can write
 * fine from any other client. The flag exists so users can mark a connection
 * "look-but-don't-touch" within this GUI specifically.
 */
export class PermissionService {
  private isReadOnly = false;

  setReadOnly(readOnly: boolean): void {
    this.isReadOnly = readOnly;
  }

  checkWritePermission(): void {
    if (this.isReadOnly) {
      throw new Error(
        'Write blocked by this GUI: connection is marked read-only (UI guard). ' +
        'Edit the connection to allow writes from this app.'
      );
    }
  }

  canWrite(): boolean {
    return !this.isReadOnly;
  }

  getReadOnlyStatus(): boolean {
    return this.isReadOnly;
  }
}

export const permissionService = new PermissionService();
