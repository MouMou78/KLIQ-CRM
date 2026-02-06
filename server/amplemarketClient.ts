import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

/**
 * Unified Amplemarket API client with proper authentication and comprehensive logging
 */
export class AmplemarketClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: "https://api.amplemarket.com",
      headers: {
        "Content-Type": "application/json",
        // Amplemarket uses Bearer token authentication
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        const correlationId = `AM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        (config as any).correlationId = correlationId;
        
        const baseUrl = this.client.defaults.baseURL || "";
        const fullPath = config.url?.startsWith("http") ? config.url : `${baseUrl}${config.url || ""}`;
        
        console.log(`[Amplemarket API] [${correlationId}] OUTBOUND REQUEST:`, {
          method: config.method?.toUpperCase(),
          fullUrl: fullPath,
          path: config.url,
          queryParams: config.params,
          requestBody: config.data ? JSON.stringify(config.data).substring(0, 500) : undefined,
          authMethod: "Authorization: Bearer",
          hasApiKey: !!this.apiKey,
          contentType: config.headers["Content-Type"],
        });
        return config;
      },
      (error) => {
        console.error("[Amplemarket API] Request Error:", error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const correlationId = (response.config as any).correlationId || "unknown";
        console.log(`[Amplemarket API] [${correlationId}] RESPONSE SUCCESS:`, {
          status: response.status,
          statusText: response.statusText,
          path: response.config.url,
          dataKeys: Object.keys(response.data || {}),
          dataPreview: JSON.stringify(response.data).substring(0, 500),
        });
        return response;
      },
      (error) => {
        const correlationId = (error.config as any)?.correlationId || "unknown";
        const method = error.config?.method?.toUpperCase() || "GET";
        const fullPath = error.config?.url || "unknown";
        const baseUrl = this.client.defaults.baseURL || "";
        const absoluteUrl = fullPath.startsWith("http") ? fullPath : `${baseUrl}${fullPath}`;
        const status = error.response?.status;
        
        console.error(`[Amplemarket API] [${correlationId}] RESPONSE ERROR:`, {
          status,
          statusText: error.response?.statusText,
          method,
          fullUrl: absoluteUrl,
          path: fullPath,
          queryParams: error.config?.params,
          requestBody: error.config?.data,
          responseBody: error.response?.data,
          responseHeaders: error.response?.headers,
        });
        
        // Enhanced 404 logging per Amplemarket support requirements
        if (status === 404) {
          const enhancedError = new Error(
            `Amplemarket endpoint does not exist: ${method} ${absoluteUrl}. ` +
            `Please verify the API endpoint with Amplemarket support. ` +
            `Response: ${JSON.stringify(error.response?.data)}`
          );
          (enhancedError as any).originalError = error;
          (enhancedError as any).status = 404;
          return Promise.reject(enhancedError);
        }
        
        // Enhanced 400 logging for invalid requests
        if (status === 400) {
          const enhancedError = new Error(
            `Amplemarket rejected the request (400): ${JSON.stringify(error.response?.data)}. ` +
            `Request: ${method} ${absoluteUrl} with params ${JSON.stringify(error.config?.params)}`
          );
          (enhancedError as any).originalError = error;
          (enhancedError as any).status = 400;
          return Promise.reject(enhancedError);
        }
        
        // Retry logic for 429 (rate limit) and 5xx (server errors)
        if (status === 429 || (status >= 500 && status < 600)) {
          const retryCount = (error.config as any).__retryCount || 0;
          const maxRetries = 3;
          
          if (retryCount < maxRetries) {
            (error.config as any).__retryCount = retryCount + 1;
            
            // Exponential backoff with jitter: 1s, 2s, 4s + random 0-1s
            const baseDelay = Math.pow(2, retryCount) * 1000;
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;
            
            console.warn(`[Amplemarket API] [${correlationId}] Retrying after ${status} error (attempt ${retryCount + 1}/${maxRetries}) in ${Math.round(delay)}ms`);
            
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this.client.request(error.config));
              }, delay);
            });
          } else {
            const enhancedError = new Error(
              `Amplemarket API failed after ${maxRetries} retries: ${status} ${error.response?.statusText}. ` +
              `Last response: ${JSON.stringify(error.response?.data)}`
            );
            (enhancedError as any).originalError = error;
            (enhancedError as any).status = status;
            return Promise.reject(enhancedError);
          }
        }
        
        console.error("[Amplemarket API] Response Error:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          path: error.config?.url,
          responseBody: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get list of users from Amplemarket
   */
  async getUsers() {
    const response = await this.client.get("/users");
    return response.data;
  }

  /**
   * Get list of lead lists from Amplemarket
   */
  async getLists() {
    const response = await this.client.get("/lead-lists");
    return response.data;
  }

  /**
   * Get list of sequences from Amplemarket
   */
  async getSequences() {
    const response = await this.client.get("/sequences");
    return response.data;
  }

  /**
   * Get single list by ID with full details including leads
   */
  async getListById(listId: string) {
    const response = await this.client.get(`/lead-lists/${listId}`);
    return response.data;
  }

  /**
   * Get contacts from Amplemarket
   */
  async getContacts(params?: { list_id?: string; limit?: number; offset?: number }) {
    const response = await this.client.get("/contacts", { params });
    return response.data;
  }

  /**
   * Get tasks from Amplemarket (includes email tasks)
   * @param params - Query parameters
   * @param params.type - Task type filter (e.g., 'email')
   * @param params.user_id - User ID to scope tasks to specific user
   * @param params.limit - Maximum number of tasks to return
   * @param params.offset - Pagination offset
   */
  async getTasks(params?: { type?: string; user_id?: string; limit?: number; offset?: number }) {
    const response = await this.client.get("/tasks", { params });
    return response.data;
  }

}

/**
 * Create an Amplemarket client instance with the given API key
 */
export function createAmplemarketClient(apiKey: string): AmplemarketClient {
  if (!apiKey) {
    throw new Error("Amplemarket API key is required");
  }
  return new AmplemarketClient(apiKey);
}
