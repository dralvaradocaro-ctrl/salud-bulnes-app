import { useState, useEffect } from 'react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useAuth } from '@/medispense/contexts/AuthContext';

export type AppRole = 'admin' | 'nurse';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          console.error('useUserRole error:', queryError);
          setError(queryError.message);
          setRole(null);
        } else {
          setRole((data?.role as AppRole) ?? null);
        }
        setLoading(false);
      });
  }, [user]);

  const isAdmin = role === 'admin';
  const isNurse = role === 'nurse';
  const canDelete = isAdmin;

  return { role, loading, error, isAdmin, isNurse, canDelete };
}
