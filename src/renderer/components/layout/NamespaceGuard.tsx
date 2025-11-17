import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useConnections } from '../../contexts/ConnectionContext';
import { turbopufferService } from '../../services/turbopufferService';
import { namespaceService } from '../../services/namespaceService';

interface NamespaceGuardProps {
  children: React.ReactNode;
}

export function NamespaceGuard({ children }: NamespaceGuardProps) {
  const { connectionId, namespaceId } = useParams<{
    connectionId: string;
    namespaceId: string;
  }>();
  const { connections } = useConnections();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateNamespace = async () => {
      if (!connectionId || !namespaceId) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      const connection = connections.find(c => c.id === connectionId);
      if (!connection) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);
        await turbopufferService.initializeClient(
          connectionDetails.apiKey,
          connectionDetails.region
        );

        const client = turbopufferService.getClient();
        if (!client) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        namespaceService.setClient(client);
        const namespace = await namespaceService.getNamespaceById(namespaceId);

        setIsValid(!!namespace);
      } catch (error) {
        console.error('Failed to validate namespace:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateNamespace();
  }, [connectionId, namespaceId, connections]);

  if (!connectionId || !namespaceId) {
    return <Navigate to="/connections" replace />;
  }

  const connection = connections.find(c => c.id === connectionId);
  if (!connection) {
    return <Navigate to="/connections" replace />;
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading namespace...</div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to={`/connections/${connectionId}/namespaces`} replace />;
  }

  return <>{children}</>;
}
