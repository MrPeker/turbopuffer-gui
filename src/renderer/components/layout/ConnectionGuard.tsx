import { Navigate, useParams } from 'react-router-dom';
import { useConnections } from '../../contexts/ConnectionContext';

interface ConnectionGuardProps {
  children: React.ReactNode;
}

export function ConnectionGuard({ children }: ConnectionGuardProps) {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { connections } = useConnections();

  if (!connectionId) {
    return <Navigate to="/connections" replace />;
  }

  const connection = connections.find(c => c.id === connectionId);

  if (!connection) {
    return <Navigate to="/connections" replace />;
  }

  return <>{children}</>;
}
