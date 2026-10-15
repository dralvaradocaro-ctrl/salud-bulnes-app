import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function useWorkspace() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const client = useQueryClient();
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setAuthReady(true); } }).catch(() => { if (alive) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); if (!next) { client.removeQueries({ queryKey: ['pscv-workspace'] }); client.removeQueries({ queryKey: ['pscv-member'] }); } });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [client]);
  const member = useQuery({
    queryKey: ['pscv-member', session?.user.id], enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('pscv_members').select('user_id').eq('user_id', session.user.id).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  const key = ['pscv-workspace', session?.user.id];
  const query = useQuery({
    queryKey: key, enabled: !!member.data, refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from('pscv_workspace_items').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
  const mutation = useMutation({
    mutationFn: async ({ id, version, ...item }) => {
      if (!member.data) throw new Error('Se requiere acceso del equipo PSCV.');
      const request = id
        ? supabase.from('pscv_workspace_items').update({ ...item, version: version + 1 }).eq('id', id).eq('version', version)
        : supabase.from('pscv_workspace_items').insert(item);
      const { data, error } = await request.select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Otro integrante actualizó este registro. Actualiza el panel antes de volver a editar.');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['pscv-workspace'] }),
  });
  return { session, authReady, member, ...query, items: query.data || [], save: mutation.mutateAsync, saving: mutation.isPending, refresh: () => { member.refetch(); query.refetch(); } };
}
