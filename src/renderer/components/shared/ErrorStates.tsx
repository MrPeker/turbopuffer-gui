import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ConnectionErrorStateProps {
  error: Error;
}

export function ConnectionErrorState({ error }: ConnectionErrorStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Connection error</h2>
      <p className="text-muted-foreground max-w-md text-center">
        {error.message}
      </p>
      <Button onClick={() => navigate('/connections')}>
        Manage connections
      </Button>
    </div>
  );
}

interface NamespaceNotFoundStateProps {
  namespaceId: string;
  connectionId?: string;
}

export function NamespaceNotFoundState({ namespaceId, connectionId }: NamespaceNotFoundStateProps) {
  const navigate = useNavigate();

  const handleViewNamespaces = () => {
    if (connectionId) {
      navigate(`/connections/${connectionId}/namespaces`);
    } else {
      navigate('/connections');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Namespace not found</h2>
      <p className="text-muted-foreground max-w-md text-center">
        The namespace "{namespaceId}" doesn't exist or has been deleted.
      </p>
      <Button onClick={handleViewNamespaces}>
        View all namespaces
      </Button>
    </div>
  );
}
