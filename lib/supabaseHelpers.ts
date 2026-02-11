import { supabase } from './supabase';

/**
 * Ejecuta una query de Supabase con retry logic y timeout
 * @param queryFn Función que retorna la promesa de la query
 * @param queryName Nombre de la query para logging
 * @param retryCount Contador de reintentos (interno)
 * @returns Resultado de la query
 */
/**
 * Detecta si un error es un error de red retryable
 */
const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = (error.code || '').toLowerCase();
  const errorDetails = (error.details || '').toLowerCase();
  
  // Errores de red comunes
  const networkErrorPatterns = [
    'failed to fetch',
    'network error',
    'connection reset',
    'connection refused',
    'connection closed',
    'err_quic',
    'err_connection_reset',
    'err_connection_refused',
    'err_connection_closed',
    'err_network_changed',
    'err_internet_disconnected',
    'timeout',
    'aborted',
    'load failed',
    'fetch error'
  ];
  
  // Verificar en message, code y details
  const allErrorText = `${errorMessage} ${errorCode} ${errorDetails}`;
  
  return networkErrorPatterns.some(pattern => 
    allErrorText.includes(pattern)
  ) || errorCode === 'pgrst301'; // Error de autenticación temporal
};

/**
 * Detecta si un error NO es retryable (errores de datos, no de red)
 */
const isNonRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Errores que NO deben retry (errores de datos, permisos, etc.)
  const nonRetryableCodes = ['PGRST116', '23505', '42501', '23503'];
  
  return nonRetryableCodes.includes(error.code || '');
};

export const executeQueryWithRetry = async <T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  queryName: string,
  retryCount = 0,
  customTimeout?: number
): Promise<{ data: T | null; error: any }> => {
  const MAX_RETRIES = 2;
  // Timeouts más largos para queries que sabemos pueden ser lentas (debido a RLS)
  const lowerCaseQueryName = queryName.toLowerCase();
  const isLongRunningQuery =
    lowerCaseQueryName.includes('community') ||
    lowerCaseQueryName.includes('profiles') ||
    lowerCaseQueryName.includes('agora'); // incluye feed de agora (posts, comments, polls)

  const TIMEOUT = customTimeout || (isLongRunningQuery ? 20000 : 10000);
  
  try {
    const queryStart = Date.now();
    console.log(`[SupabaseHelper] ${queryName} attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
    
    const queryPromise = queryFn();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout: ${queryName} after ${TIMEOUT}ms`));
      }, TIMEOUT);
    });
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as { data: T | null; error: any };
    const queryDuration = Date.now() - queryStart;
    
    console.log(`[SupabaseHelper] ${queryName} completed`, {
      duration: `${queryDuration}ms`,
      hasData: !!result.data,
      hasError: !!result.error,
      retryCount,
      errorMessage: result.error?.message,
      errorCode: result.error?.code
    });
    
    // Si hay error y es retryable, intentar de nuevo
    if (result.error && retryCount < MAX_RETRIES) {
      const shouldRetry = !isNonRetryableError(result.error) && isNetworkError(result.error);
      
      if (shouldRetry) {
        const delay = 1000 * (retryCount + 1);
        console.log(`[SupabaseHelper] Retrying ${queryName}... (${result.error.message || result.error.code}) - waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeQueryWithRetry(queryFn, queryName, retryCount + 1, customTimeout);
      } else {
        console.log(`[SupabaseHelper] Not retrying ${queryName} - non-retryable error: ${result.error.code || result.error.message}`);
      }
    }
    
    return result;
  } catch (err: any) {
    // Manejar excepciones que se lanzan antes de que Supabase retorne un error estructurado
    const errorMessage = err?.message || '';
    const isTimeout = errorMessage.includes('timeout');
    const isNetworkErr = isNetworkError(err);
    
      if ((isTimeout || isNetworkErr) && retryCount < MAX_RETRIES) {
      const delay = 1000 * (retryCount + 1);
      console.log(`[SupabaseHelper] Exception caught on ${queryName}, retrying... (${errorMessage}) - waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeQueryWithRetry(queryFn, queryName, retryCount + 1, customTimeout);
    }
    
    // Si no es retryable o ya agotamos los reintentos, retornar como error estructurado
    console.error(`[SupabaseHelper] ${queryName} failed after ${retryCount + 1} attempts:`, err);
    return {
      data: null,
      error: {
        message: err?.message || 'Unknown error',
        code: err?.code || '',
        details: err?.details || err?.stack || ''
      }
    };
  }
};

/**
 * Ejecuta una query con múltiples IDs en lotes para evitar timeouts
 * @param ids Array de IDs a consultar
 * @param queryFn Función que recibe un array de IDs y retorna la promesa de la query
 * @param queryName Nombre de la query para logging
 * @param batchSize Tamaño del lote (default: 50)
 * @returns Resultado combinado de todas las queries
 */
export const executeBatchedQuery = async <T = any>(
  ids: string[],
  queryFn: (batchIds: string[]) => Promise<{ data: T[] | null; error: any }>,
  queryName: string,
  batchSize = 50
): Promise<{ data: T[] | null; error: any }> => {
  if (ids.length === 0) {
    return { data: [], error: null };
  }

  // Si hay pocos IDs, ejecutar directamente sin batching
  if (ids.length <= batchSize) {
    return executeQueryWithRetry(
      () => queryFn(ids),
      queryName
    );
  }

  // Dividir en lotes
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }

  console.log(`[SupabaseHelper] ${queryName} - batching ${ids.length} IDs into ${batches.length} batches of ~${batchSize}`);

  // Ejecutar todos los lotes en paralelo
  const batchResults = await Promise.all(
    batches.map((batch, index) =>
      executeQueryWithRetry(
        () => queryFn(batch),
        `${queryName} (batch ${index + 1}/${batches.length})`
      )
    )
  );

  // Combinar resultados
  const allData: T[] = [];
  let hasError = false;
  let firstError: any = null;

  for (const result of batchResults) {
    if (result.error) {
      hasError = true;
      if (!firstError) {
        firstError = result.error;
      }
    }
    if (result.data) {
      allData.push(...result.data);
    }
  }

  return {
    data: hasError && allData.length === 0 ? null : allData,
    error: hasError ? firstError : null
  };
};

