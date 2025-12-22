export class PermissionService {
  private isReadOnly: boolean = false;

  setReadOnly(readOnly: boolean): void {
    this.isReadOnly = readOnly;
  }

  checkWritePermission(): void {
    if (this.isReadOnly) {
      throw new Error('Write operation blocked: Connection is in read-only mode');
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
