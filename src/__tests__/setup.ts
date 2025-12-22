import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.electronAPI for renderer tests
const electronAPIMock = {
  // Connection API
  saveConnection: vi.fn().mockResolvedValue({ id: 'test-id' }),
  loadConnections: vi.fn().mockResolvedValue([]),
  testConnection: vi.fn().mockResolvedValue({ success: true }),
  testConnectionDirect: vi.fn().mockResolvedValue({ success: true }),
  deleteConnection: vi.fn().mockResolvedValue(undefined),
  getRegions: vi.fn().mockResolvedValue([]),
  getConnectionForUse: vi.fn().mockResolvedValue({ apiKey: 'test-key' }),

  // Settings API
  loadSettings: vi.fn().mockResolvedValue({}),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  resetSettings: vi.fn().mockResolvedValue({}),
  exportSettings: vi.fn().mockResolvedValue('{}'),
  importSettings: vi.fn().mockResolvedValue({}),

  // App API
  getVersion: vi.fn().mockResolvedValue('1.0.0'),

  // Query History API
  loadQueryHistory: vi.fn().mockResolvedValue({ saved: [], recent: [] }),
  saveQueryHistory: vi.fn().mockResolvedValue(undefined),
  addSavedFilter: vi.fn().mockResolvedValue(undefined),
  addRecentFilter: vi.fn().mockResolvedValue(undefined),
  updateFilterCount: vi.fn().mockResolvedValue(undefined),
  deleteSavedFilter: vi.fn().mockResolvedValue(undefined),
  clearRecentFilters: vi.fn().mockResolvedValue(undefined),
  deleteAllHistory: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(window, 'electronAPI', {
  value: electronAPIMock,
  writable: true,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Export mocks for direct access in tests
export { localStorageMock, electronAPIMock };
