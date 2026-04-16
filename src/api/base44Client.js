/**
 * Capa de compatibilidad que reemplaza el SDK de Base44.
 * Usa Supabase como base de datos y Gemini como IA.
 * Expone la misma interfaz que tenía db.entities / db.integrations / db.auth
 * para que los demás archivos no necesiten cambios.
 */
import { supabase } from '@/lib/supabase';
import { invokeLLM } from '@/lib/gemini';

// Mapeo: nombre de entidad Base44 → tabla en Supabase
const TABLE_MAP = {
  Category: 'categories',
  Topic: 'topics',
  ClinicalTool: 'clinical_tools',
  FlowStep: 'flow_steps',
  RequestTemplate: 'request_templates',
  TopicVersion: 'topic_versions',
};

function createEntityHandler(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) {
    console.warn(`[db] Entidad desconocida: ${entityName}`);
    return {
      list: async () => [],
      filter: async () => [],
      get: async () => null,
      create: async (d) => d,
      update: async (_, d) => d,
      delete: async () => ({}),
    };
  }

  return {
    /** Lista todos los registros. sort = nombre de columna para ordenar */
    async list(sort, limit, skip) {
      let q = supabase.from(table).select('*');
      if (sort) q = q.order(sort, { ascending: true });
      if (limit) q = q.limit(limit);
      if (skip && limit) q = q.range(skip, skip + limit - 1);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    /** Filtra por condiciones simples { campo: valor } */
    async filter(conditions) {
      let q = supabase.from(table).select('*');
      if (conditions) {
        for (const [key, value] of Object.entries(conditions)) {
          if (value !== undefined && value !== null) q = q.eq(key, value);
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    /** Obtiene un registro por ID */
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    /** Crea un nuevo registro */
    async create(data) {
      const { data: result, error } = await supabase.from(table).insert([data]).select().single();
      if (error) throw error;
      return result;
    },

    /** Actualiza un registro por ID */
    async update(id, data) {
      const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },

    /** Elimina un registro por ID */
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

export const db = {
  entities: new Proxy(
    {},
    {
      get(_, entityName) {
        if (typeof entityName !== 'string' || entityName === 'then' || entityName.startsWith('_'))
          return undefined;
        return createEntityHandler(entityName);
      },
    }
  ),

  integrations: {
    Core: {
      /** Sube un archivo a Supabase Storage y devuelve la URL pública */
      UploadFile: async ({ file }) => {
        const ext = file.name.split('.').pop();
        const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('files').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('files').getPublicUrl(path);
        return { file_url: data.publicUrl };
      },

      /** Llama a Gemini en lugar del LLM de Base44 */
      InvokeLLM: async (params) => invokeLLM(params),
    },
  },

  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    logout: () => {},
    redirectToLogin: () => {},
    setToken: () => {},
  },
};

// Setear el global ANTES de que las páginas se evalúen
globalThis.__B44_DB__ = db;

export { db as base44 };
export default db;
