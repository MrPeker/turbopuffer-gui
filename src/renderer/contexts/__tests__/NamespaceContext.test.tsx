import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NamespaceProvider, useNamespace } from '../NamespaceContext';
import { localStorageMock } from '@/__tests__/setup';

vi.mock('../../services/turbopufferService', () => ({
  turbopufferService: {
    initializeClient: vi.fn(),
    getClient: vi.fn(() => null),
  },
}));

vi.mock('../../services/namespaceService', () => ({
  namespaceService: {
    setClient: vi.fn(),
    getNamespaceById: vi.fn(),
    listNamespaces: vi.fn().mockResolvedValue({ namespaces: [] }),
  },
}));

describe('NamespaceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NamespaceProvider>{children}</NamespaceProvider>
  );

  it('should provide namespace context with required functions', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.recentNamespaces).toEqual([]);
    expect(typeof result.current.addRecentNamespace).toBe('function');
    expect(typeof result.current.clearRecentNamespaces).toBe('function');
    expect(typeof result.current.getNamespaceById).toBe('function');
    expect(typeof result.current.loadNamespacesForConnection).toBe('function');
  });

  it('should add namespace to recent namespaces', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });
    const testNamespace = { id: 'test-namespace', name: 'Test Namespace' };

    act(() => {
      result.current.addRecentNamespace('conn-1', testNamespace);
    });

    expect(result.current.recentNamespaces).toHaveLength(1);
    expect(result.current.recentNamespaces[0]).toEqual(testNamespace);
  });

  it('should persist recent namespaces to localStorage', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });
    const testNamespace = { id: 'test-namespace', name: 'Test Namespace' };

    act(() => {
      result.current.addRecentNamespace('conn-1', testNamespace);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'recentNamespaces',
      expect.stringContaining('"id":"test-namespace"')
    );
  });

  it('should limit recent namespaces to MAX_RECENT_NAMESPACES (3)', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    act(() => {
      result.current.addRecentNamespace('conn-1', { id: 'ns-1', name: 'NS 1' });
      result.current.addRecentNamespace('conn-1', { id: 'ns-2', name: 'NS 2' });
      result.current.addRecentNamespace('conn-1', { id: 'ns-3', name: 'NS 3' });
      result.current.addRecentNamespace('conn-1', { id: 'ns-4', name: 'NS 4' });
    });

    expect(result.current.recentNamespaces).toHaveLength(3);
    expect(result.current.recentNamespaces[0].id).toBe('ns-4');
    expect(result.current.recentNamespaces[2].id).toBe('ns-2');
  });

  it('should not add duplicate namespaces', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });
    const testNamespace = { id: 'test-namespace', name: 'Test Namespace' };

    act(() => {
      result.current.addRecentNamespace('conn-1', testNamespace);
      result.current.addRecentNamespace('conn-1', testNamespace);
    });

    expect(result.current.recentNamespaces).toHaveLength(1);
  });

  it('should move existing namespace to front when re-added', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    act(() => {
      result.current.addRecentNamespace('conn-1', { id: 'ns-1', name: 'NS 1' });
      result.current.addRecentNamespace('conn-1', { id: 'ns-2', name: 'NS 2' });
      result.current.addRecentNamespace('conn-1', { id: 'ns-1', name: 'NS 1' });
    });

    expect(result.current.recentNamespaces).toHaveLength(2);
    expect(result.current.recentNamespaces[0].id).toBe('ns-1');
    expect(result.current.recentNamespaces[1].id).toBe('ns-2');
  });

  it('should clear recent namespaces', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    act(() => {
      result.current.addRecentNamespace('conn-1', { id: 'ns-1', name: 'NS 1' });
    });

    expect(result.current.recentNamespaces).toHaveLength(1);

    act(() => {
      result.current.clearRecentNamespaces();
    });

    expect(result.current.recentNamespaces).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('recentNamespaces');
  });

  it('should load recent namespaces from localStorage on mount', () => {
    const storedData = {
      namespaces: [{ id: 'stored-namespace', name: 'Stored NS' }],
      connectionId: 'conn-1',
      timestamp: new Date().toISOString(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.recentNamespaces).toEqual([{ id: 'stored-namespace', name: 'Stored NS' }]);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.recentNamespaces).toEqual([]);
  });

  it('should not add namespace without connectionId', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    act(() => {
      result.current.addRecentNamespace('', { id: 'ns-1', name: 'NS 1' });
    });

    expect(result.current.recentNamespaces).toHaveLength(0);
  });

  it('throws error when useNamespace is used outside provider', () => {
    expect(() => {
      renderHook(() => useNamespace());
    }).toThrow('useNamespace must be used within a NamespaceProvider');
  });
});
