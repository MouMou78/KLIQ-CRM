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
        console.log("[Amplemarket API] Outbound Request:", {
          method: config.method?.toUpperCase(),
          path: config.url, // Path only, no secrets
          authMethod: "Authorization: Bearer", // Header name only
          hasApiKey: !!this.apiKey, // Boolean, not the value
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
        console.log("[Amplemarket API] Response:", {
          status: response.status,
          path: response.config.url,
          dataKeys: Object.keys(response.data || {}),
        });
        return response;
      },
      (error) => {
        // Enhanced 404 logging per Amplemarket support requirements
        if (error.response?.status === 404) {
          const fullPath = error.config?.url || "unknown";
          const method = error.config?.method?.toUpperCase() || "GET";
          const baseUrl = this.client.defaults.baseURL || "";
          const absoluteUrl = fullPath.startsWith("http") ? fullPath : `${baseUrl}${fullPath}`;
          
          console.error("[Amplemarket API] 404 ERROR - Endpoint does not exist:", {
            fullPath: absoluteUrl,
            method,
            statusText: error.response?.statusText,
            responseBody: error.response?.data,
            message: `The endpoint ${absoluteUrl} does not exist or is not accessible with current credentials`
          });
          
          // Wrap error with clear message
          const enhancedError = new Error(
            `Amplemarket endpoint does not exist: ${method} ${absoluteUrl}. ` +
            `Please verify the API endpoint with Amplemarket support. ` +
            `Response: ${JSON.stringify(error.response?.data)}`
          );
          (enhancedError as any).originalError = error;
          (enhancedError as any).status = 404;
          return Promise.reject(enhancedError);
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
