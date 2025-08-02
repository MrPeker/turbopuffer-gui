import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNamespace } from '@/renderer/contexts/NamespaceContext';
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle, ArrowRight } from 'lucide-react';

interface RequireNamespaceProps {
  children: React.ReactNode;
  namespaceId?: string;
}

export const RequireNamespace: React.FC<RequireNamespaceProps> = ({ children, namespaceId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedNamespace } = useNamespace();
  const { activeConnection } = useConnection();

  // Check if we need to redirect
  // If namespaceId is provided in URL, we don't need to check if it matches selectedNamespace
  // The component should handle loading the correct namespace
  const needsNamespace = !selectedNamespace && !namespaceId;
  
  useEffect(() => {
    // Store the intended destination in session storage
    if (needsNamespace && location.pathname !== '/namespaces') {
      sessionStorage.setItem('intendedDestination', location.pathname);
    }
  }, [needsNamespace, location.pathname]);

  // If no connection, show connection required message
  if (!activeConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No Connection Selected</CardTitle>
            <CardDescription>
              Please select a connection before working with namespaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/connections')} className="gap-2">
              Go to Connections
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If namespace is needed, show selection prompt
  if (needsNamespace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Select a Namespace</CardTitle>
            <CardDescription>
              {namespaceId 
                ? "The selected namespace doesn't match the requested one."
                : "You need to select a namespace to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a namespace to work with your vectors and documents.
            </p>
            <Button onClick={() => navigate('/namespaces')} className="gap-2">
              Select Namespace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All requirements met, render children
  return <>{children}</>;
};