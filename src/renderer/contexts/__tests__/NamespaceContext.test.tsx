import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { NamespaceProvider, useNamespace } from '../NamespaceContext';
import { ConnectionProvider } from '../ConnectionContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock connection context
jest.mock('../ConnectionContext', () => ({
  useConnection: jest.fn(() => ({
    selectedConnection: { id: 'test-connection' },
  })),
  ConnectionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('NamespaceContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConnectionProvider>
      <NamespaceProvider>{children}</NamespaceProvider>
    </ConnectionProvider>
  );

  it('should provide namespace context', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.selectedNamespace).toBeNull();
    expect(typeof result.current.selectNamespace).toBe('function');
    expect(typeof result.current.clearNamespace).toBe('function');
  });

  it('should select and persist namespace', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });
    const testNamespace = { id: 'test-namespace' };

    act(() => {
      result.current.selectNamespace(testNamespace);
    });

    expect(result.current.selectedNamespace).toEqual(testNamespace);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'selectedNamespace',
      expect.stringContaining('"namespace":{"id":"test-namespace"}')
    );
  });

  it('should clear namespace', () => {
    const { result } = renderHook(() => useNamespace(), { wrapper });
    const testNamespace = { id: 'test-namespace' };

    act(() => {
      result.current.selectNamespace(testNamespace);
    });

    act(() => {
      result.current.clearNamespace();
    });

    expect(result.current.selectedNamespace).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('selectedNamespace');
  });

  it('should load namespace from localStorage on mount', () => {
    const storedData = {
      namespace: { id: 'stored-namespace' },
      connectionId: 'test-connection',
      timestamp: new Date().toISOString(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.selectedNamespace).toEqual({ id: 'stored-namespace' });
  });

  it('should not load namespace if connection ID does not match', () => {
    const storedData = {
      namespace: { id: 'stored-namespace' },
      connectionId: 'different-connection',
      timestamp: new Date().toISOString(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    const { result } = renderHook(() => useNamespace(), { wrapper });

    expect(result.current.selectedNamespace).toBeNull();
  });
});