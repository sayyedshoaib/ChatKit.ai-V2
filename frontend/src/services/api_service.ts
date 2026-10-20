// import axios from "axios";

// const API_BASE_URL = "http://localhost:8000"; // adjust if deployed

// // --- Token storage helpers ---
// export const setAuthToken = (token: string) => {
//   localStorage.setItem("access_token", token);
// };

// export const getAuthToken = (): string | null => {
//   return localStorage.getItem("access_token");
// };

// export const clearAuthToken = () => {
//   localStorage.removeItem("access_token");
// };

// // --- Axios instance with auth header ---
// const api = axios.create({
//   baseURL: API_BASE_URL,
// });

// api.interceptors.request.use((config) => {
//   const token = getAuthToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // --- API functions ---

// // Tenant signup
// export const signupTenant = async (name: string, email: string, password: string) => {
//   const res = await api.post("/tenants/signup", { name, email, password });
//   return res.data; // includes tenant info + raw API key
// };

// // Tenant login
// export const loginTenant = async (email: string, password: string) => {
//   const res = await api.post("/tenants/login", { email, password });
//   // console.log("Login response:", res.data);
//   const { access_token, tenant } = res.data;
//   // console.log("Received access token:", access_token);

//   const tenant_id = tenant.id;
//   // console.log("Received tenant ID:", tenant_id);
//   // setAuthToken(access_token); // store JWT for restricted APIs

//   localStorage.setItem("tenant_id", tenant_id); // store tenant_id+

//   // const { tenant, access_token } = res.data;

//   localStorage.setItem("access_token", access_token);
//   localStorage.setItem("tenant_id", tenant.id);
//   localStorage.setItem("tenant_name", tenant.name);
//   localStorage.setItem("tenant_email", tenant.email);

//   if (tenant.api_key) {
//     localStorage.setItem("api_key", tenant.api_key);
//   }



//   return res.data; // includes tenant info + token
// };

// // Regenerate API key
// export const regenerateApiKey = async (tenant_id: string) => {
//   const res = await api.post("/tenants/regenerate_api_key", { tenant_id });
//   return res.data; // { new_api_key }
// };

// // Create widget token (for end users)
// export const createWidgetToken = async (tenant_id: string, api_key: string, user_id: string) => {
//   console.log("Creating widget token with tenant_id:", tenant_id, "api_key:", api_key, "user_id:", user_id);
//   const res = await api.post("/tenants/create_widget_token", { tenant_id, api_key, user_id });
//   return res.data; // { widget_token }
// };


// export const getTenant = async (tenant_id: string) => {
//   const res = await api.get(`/tenants/${tenant_id}`);
//   return res.data;
// };

// // Reset password
// export const resetPassword = async (tenant_id: string, new_password: string) => {
//   const res = await api.put("/tenants/reset_password", { tenant_id, new_password });
//   return res.data;
// };



// // 18-07-26

// // --- Chatbot Config APIs ---

// // Submit initial chatbot info
// // export const submitAgentInfo = async (
// //   tenant_id: string,
// //   description: string,
// //   instruction: string,
// //   welcome_message: string
// // ) => {
// //   const res = await api.post("/chatbot_config", {
// //     tenant_id,
// //     description,
// //     instruction,
// //     welcome_message,
// //     faqs: [],
// //     workflows: {},
// //     rag_sources: [],
// //     db_connection: "",
// //     agents: []
// //   });
// //   return res.data;
// // };


// export const submitAgentInfo = async (
//   tenant_id: string,
//   description: string,
//   instruction: string,
//   welcome_message: string
// ) => {
//   const token = getAuthToken();

//   if (!token) {
//     throw new Error(
//       "Authentication token missing. Please log in again."
//     );
//   }

//   if (!tenant_id) {
//     throw new Error(
//       "Tenant ID is missing from AuthContext."
//     );
//   }

//   try {
//     const res = await api.post("/chatbot_config/", {
//       tenant_id,
//       description,
//       instruction,
//       welcome_message,
//       faqs: [],
//       workflows: {},
//       rag_sources: [],
//       db_connection: "",
//       agents: []
//     });

//     return res.data;
//   } catch (error: any) {
//     console.error(
//       "Failed to save chatbot configuration:",
//       error.response?.status,
//       error.response?.data
//     );

//     throw error;
//   }
// };


// // Add agent
// export const addAgent = async (tenant_id: string, agent: { name: string; description: string }) => {
//   const res = await api.post("/chatbot_config/add_agent_to_config", {
//     tenant_id,
//     agent
//   });
//   return res.data;
// };

// // Add FAQs
// export const addFaqs = async (tenant_id: string, faq: Record<string, string>) => {
//   const res = await api.post("/chatbot_config/add_faq_to_config", {
//     tenant_id,
//     faq
//   });
//   return res.data;
// };

// // Add DB URL
// export const addDbUrl = async (tenant_id: string, db_url: string) => {
//   const res = await api.post("/chatbot_config/add_db_url_to_config", {
//     tenant_id,
//     db_url
//   });
//   return res.data;
// };

// // Placeholder for RAG docs (not implemented in backend)
// // export const addRagDocs = async (tenant_id: string, docs: FileList) => {
// //   console.warn("addRagDocs not implemented in backend");
// //   return { status: "not_implemented" };
// // };

// // 18-10-26
// // --- RAG document upload and embeddings ---

// export const addRagDocs = async (
//   tenant_id: string,
//   docs: FileList
// ) => {
//   if (!docs || docs.length === 0) {
//     throw new Error("Please select at least one document.");
//   }

//   const uploadedFiles = [];

//   // Upload each file using the existing Axios instance.
//   for (const file of Array.from(docs)) {
//     const formData = new FormData();
//     formData.append("file", file);

//     const response = await api.post(
//       `/chatbot_config/${encodeURIComponent(tenant_id)}/upload_rag_source`,
//       formData
//     );

//     uploadedFiles.push(response.data);
//   }

//   // Generate embeddings after all files have uploaded.
//   const embeddingResponse = await api.post(
//     `/chatbot_config/generate_embeddings/${encodeURIComponent(tenant_id)}`
//   );

//   const result = embeddingResponse.data;

//   // Report processing failures instead of silently marking the agent saved.
//   if (result.failed_documents?.length > 0) {
//     const errors = result.failed_documents
//       .map(
//         (item: { filename: string; error: string }) =>
//           `${item.filename}: ${item.error}`
//       )
//       .join("; ");

//     throw new Error(`Some documents could not be processed: ${errors}`);
//   }

//   if (result.processed_documents === 0) {
//     throw new Error(
//       "No documents were processed. Check that your files contain readable text."
//     );
//   }

//   return {
//     uploadedFiles,
//     embeddings: result,
//   };
// };


// // Get chatbot config
// export const getChatBotConfig = async (tenant_id: string) => {
//   const res = await api.get(`/chatbot_config/${tenant_id}`);
//   return res.data;
// };




// services/api_service.ts

import axios from "axios";

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  email: string;
  api_key?: string;
  widget_key?: string;
  [key: string]: unknown;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface AgentExample {
  query: string;
  expected_handling: string;
}

export interface Agent {
  name: string;
  description?: string;
  examples?: AgentExample[];
  [key: string]: unknown;
}

export interface RagSource {
  source_id?: string;
  filename?: string;
  type?: string;
  path_or_url?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ChatbotConfig {
  id?: string;
  tenant_id: string;
  description?: string;
  instruction?: string;
  welcome_message?: string;
  faqs?: Faq[] | Record<string, string>;
  workflows?: Record<string, unknown>;
  rag_sources?: RagSource[];
  db_connection?: string;
  agents?: Agent[];
  [key: string]: unknown;
}

export interface WidgetTokenResponse {
  widget_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface RagUploadResult {
  uploadedFiles: unknown[];
  embeddings: {
    message?: string;
    processed_documents?: number;
    failed_documents?: Array<{
      filename: string;
      error: string;
    }>;
    count?: number;
    [key: string]: unknown;
  };
}

// --------------------------------------------------
// Authentication token helpers
// --------------------------------------------------

export const setAuthToken = (token: string): void => {
  localStorage.setItem("access_token", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const clearAuthToken = (): void => {
  localStorage.removeItem("access_token");
};

const getTenantId = (): string | null => {
  return localStorage.getItem("tenant_id");
};

const requireTenantId = (tenantId?: string): string => {
  const resolved = tenantId || getTenantId();

  if (!resolved) {
    throw new Error("Tenant ID is missing. Please log in again.");
  }

  return resolved;
};

const requireAuthToken = (): string => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  return token;
};

// --------------------------------------------------
// Axios instance
// --------------------------------------------------

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; message?: string }
      | undefined;

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export { getErrorMessage };

// --------------------------------------------------
// Tenant signup and login
// --------------------------------------------------

export const signupTenant = async (
  name: string,
  email: string,
  password: string
) => {
  const response = await api.post("/tenants/signup", {
    name,
    email,
    password,
  });

  return response.data;
};

export const loginTenant = async (
  email: string,
  password: string
) => {
  const response = await api.post("/tenants/login", {
    email,
    password,
  });

  const { access_token, tenant } = response.data;

  if (!access_token || !tenant?.id) {
    throw new Error("The server returned an invalid login response.");
  }

  setAuthToken(access_token);

  localStorage.setItem("tenant_id", tenant.id);
  localStorage.setItem("tenant_name", tenant.name || "");
  localStorage.setItem("tenant_email", tenant.email || "");

  if (tenant.api_key) {
    localStorage.setItem("api_key", tenant.api_key);
  }

  if (tenant.widget_key) {
    localStorage.setItem("widget_key", tenant.widget_key);
  }

  return response.data;
};

export const logoutTenant = (): void => {
  clearAuthToken();

  localStorage.removeItem("tenant_id");
  localStorage.removeItem("tenant_name");
  localStorage.removeItem("tenant_email");
  localStorage.removeItem("api_key");
  localStorage.removeItem("widget_key");
};

// --------------------------------------------------
// Tenant APIs
// --------------------------------------------------

export const getTenant = async (tenant_id: string) => {
  const response = await api.get(
    `/tenants/${encodeURIComponent(tenant_id)}`
  );

  return response.data;
};

export const regenerateApiKey = async (tenant_id: string) => {
  const response = await api.post("/tenants/regenerate_api_key", {
    tenant_id,
  });

  if (response.data?.new_api_key) {
    localStorage.setItem("api_key", response.data.new_api_key);
  }

  return response.data;
};

export const resetPassword = async (
  tenant_id: string,
  new_password: string
) => {
  const response = await api.put("/tenants/reset_password", {
    tenant_id,
    new_password,
  });

  return response.data;
};

// --------------------------------------------------
// Widget token API
// --------------------------------------------------

export const createWidgetToken = async (
  tenant_id: string,
  widget_key: string,
  user_id: string
): Promise<WidgetTokenResponse> => {
  if (!tenant_id || !widget_key || !user_id) {
    throw new Error(
      "Tenant ID, widget key, and user ID are required."
    );
  }

  const response = await api.post<WidgetTokenResponse>(
    "/tenants/create_widget_token",
    {
      tenant_id,
      widget_key,
      user_id,
    }
  );

  return response.data;
};

// --------------------------------------------------
// Chatbot configuration APIs
// --------------------------------------------------

export const submitAgentInfo = async (
  tenant_id: string,
  description: string,
  instruction: string,
  welcome_message: string
): Promise<ChatbotConfig> => {
  requireAuthToken();
  const resolvedTenantId = requireTenantId(tenant_id);

  const response = await api.post<ChatbotConfig>("/chatbot_config/", {
    tenant_id: resolvedTenantId,
    description,
    instruction,
    welcome_message,
    faqs: [],
    workflows: {},
    rag_sources: [],
    db_connection: "",
    agents: [],
  });

  return response.data;
};

export const updateChatBotConfig = async (
  tenant_id: string,
  changes: Partial<ChatbotConfig>
): Promise<ChatbotConfig> => {
  requireAuthToken();
  const resolvedTenantId = requireTenantId(tenant_id);

  const current = await getChatBotConfig(resolvedTenantId);

  const payload: ChatbotConfig = {
    ...current,
    ...changes,
    tenant_id: resolvedTenantId,
    agents: changes.agents ?? current.agents ?? [],
    faqs: changes.faqs ?? current.faqs ?? [],
    workflows: changes.workflows ?? current.workflows ?? {},
    rag_sources: changes.rag_sources ?? current.rag_sources ?? [],
    db_connection:
      changes.db_connection ?? current.db_connection ?? "",
  };

  const response = await api.post<ChatbotConfig>(
    "/chatbot_config/",
    payload
  );

  return response.data;
};

export const getChatBotConfig = async (
  tenant_id: string
): Promise<ChatbotConfig> => {
  const resolvedTenantId = requireTenantId(tenant_id);

  try {
    const response = await api.get<ChatbotConfig>(
      `/chatbot_config/${encodeURIComponent(resolvedTenantId)}`
    );

    return response.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      throw error;
    }

    throw new Error(
      getErrorMessage(error, "Failed to load chatbot configuration.")
    );
  }
};

export const getChatBotConfigOrNull = async (
  tenant_id: string
): Promise<ChatbotConfig | null> => {
  try {
    return await getChatBotConfig(tenant_id);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return null;
    }

    throw error;
  }
};

// --------------------------------------------------
// Agent APIs
// --------------------------------------------------

export const addAgent = async (
  tenant_id: string,
  agent: Agent
) => {
  const resolvedTenantId = requireTenantId(tenant_id);

  if (!agent.name?.trim()) {
    throw new Error("Agent name is required.");
  }

  const response = await api.post(
    "/chatbot_config/add_agent_to_config",
    {
      tenant_id: resolvedTenantId,
      agent,
    }
  );

  return response.data;
};

export const saveAgent = async (
  tenant_id: string,
  agent: Agent
) => {
  return addAgent(tenant_id, agent);
};

// --------------------------------------------------
// FAQ APIs
// --------------------------------------------------

/**
 * Accepts either:
 *   [{ question: "...", answer: "..." }]
 * or:
 *   { "Question": "Answer" }
 *
 * Sends the question-to-answer object expected by the existing
 * add_faq_to_config endpoint.
 */
export const addFaqs = async (
  tenant_id: string,
  faqs: Faq[] | Record<string, string>
) => {
  const resolvedTenantId = requireTenantId(tenant_id);
  const cleanedFaqs: Record<string, string> = {};

  if (Array.isArray(faqs)) {
    for (const item of faqs) {
      const question = item?.question?.trim();
      const answer = item?.answer?.trim();

      if (question && answer) {
        cleanedFaqs[question] = answer;
      }
    }
  } else {
    for (const [question, answer] of Object.entries(faqs)) {
      const cleanQuestion = question.trim();
      const cleanAnswer = answer?.trim();

      if (cleanQuestion && cleanAnswer) {
        cleanedFaqs[cleanQuestion] = cleanAnswer;
      }
    }
  }

  if (Object.keys(cleanedFaqs).length === 0) {
    throw new Error("Enter at least one FAQ question and answer.");
  }

  const response = await api.post(
    "/chatbot_config/add_faq_to_config",
    {
      tenant_id: resolvedTenantId,
      faq: cleanedFaqs,
    }
  );

  return response.data;
};

// --------------------------------------------------
// Database connection API
// --------------------------------------------------

export const addDbUrl = async (
  tenant_id: string,
  db_url: string
) => {
  const resolvedTenantId = requireTenantId(tenant_id);

  if (!db_url.trim()) {
    throw new Error("Database connection URL is required.");
  }

  const response = await api.post(
    "/chatbot_config/add_db_url_to_config",
    {
      tenant_id: resolvedTenantId,
      db_url: db_url.trim(),
    }
  );

  return response.data;
};

// --------------------------------------------------
// RAG document upload and embeddings
// --------------------------------------------------

export const addRagDocs = async (
  tenant_id: string,
  docs: FileList | File[]
): Promise<RagUploadResult> => {
  const resolvedTenantId = requireTenantId(tenant_id);
  const files = Array.from(docs || []);

  if (files.length === 0) {
    throw new Error("Please select at least one document.");
  }

  const uploadedFiles: unknown[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/chatbot_config/${encodeURIComponent(
        resolvedTenantId
      )}/upload_rag_source`,
      formData
    );

    uploadedFiles.push(response.data);
  }

  const embeddingResponse = await api.post(
    `/chatbot_config/generate_embeddings/${encodeURIComponent(
      resolvedTenantId
    )}`
  );

  const result = embeddingResponse.data;

  if (result.failed_documents?.length > 0) {
    const errors = result.failed_documents
      .map(
        (item: { filename: string; error: string }) =>
          `${item.filename}: ${item.error}`
      )
      .join("; ");

    throw new Error(
      `Some documents could not be processed: ${errors}`
    );
  }

  const processedCount =
    result.processed_documents ?? result.count ?? 0;

  if (processedCount === 0) {
    throw new Error(
      "No documents were processed. Check that the files contain readable text."
    );
  }

  return {
    uploadedFiles,
    embeddings: result,
  };
};

// --------------------------------------------------
// Optional generic API helpers
// --------------------------------------------------

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong."
): string => {
  return getErrorMessage(error, fallback);
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 401
  );
};
