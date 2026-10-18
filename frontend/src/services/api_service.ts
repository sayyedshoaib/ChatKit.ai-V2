import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // adjust if deployed

// --- Token storage helpers ---
export const setAuthToken = (token: string) => {
  localStorage.setItem("access_token", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const clearAuthToken = () => {
  localStorage.removeItem("access_token");
};

// --- Axios instance with auth header ---
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- API functions ---

// Tenant signup
export const signupTenant = async (name: string, email: string, password: string) => {
  const res = await api.post("/tenants/signup", { name, email, password });
  return res.data; // includes tenant info + raw API key
};

// Tenant login
export const loginTenant = async (email: string, password: string) => {
  const res = await api.post("/tenants/login", { email, password });
  // console.log("Login response:", res.data);
  const { access_token, tenant } = res.data;
  // console.log("Received access token:", access_token);

  const tenant_id = tenant.id;
  // console.log("Received tenant ID:", tenant_id);
  // setAuthToken(access_token); // store JWT for restricted APIs

  localStorage.setItem("tenant_id", tenant_id); // store tenant_id+

  // const { tenant, access_token } = res.data;

  localStorage.setItem("access_token", access_token);
  localStorage.setItem("tenant_id", tenant.id);
  localStorage.setItem("tenant_name", tenant.name);
  localStorage.setItem("tenant_email", tenant.email);

  if (tenant.api_key) {
    localStorage.setItem("api_key", tenant.api_key);
  }



  return res.data; // includes tenant info + token
};

// Regenerate API key
export const regenerateApiKey = async (tenant_id: string) => {
  const res = await api.post("/tenants/regenerate_api_key", { tenant_id });
  return res.data; // { new_api_key }
};

// Create widget token (for end users)
export const createWidgetToken = async (tenant_id: string, api_key: string, user_id: string) => {
  console.log("Creating widget token with tenant_id:", tenant_id, "api_key:", api_key, "user_id:", user_id);
  const res = await api.post("/tenants/create_widget_token", { tenant_id, api_key, user_id });
  return res.data; // { widget_token }
};


export const getTenant = async (tenant_id: string) => {
  const res = await api.get(`/tenants/${tenant_id}`);
  return res.data;
};

// Reset password
export const resetPassword = async (tenant_id: string, new_password: string) => {
  const res = await api.put("/tenants/reset_password", { tenant_id, new_password });
  return res.data;
};



// 18-07-26

// --- Chatbot Config APIs ---

// Submit initial chatbot info
// export const submitAgentInfo = async (
//   tenant_id: string,
//   description: string,
//   instruction: string,
//   welcome_message: string
// ) => {
//   const res = await api.post("/chatbot_config", {
//     tenant_id,
//     description,
//     instruction,
//     welcome_message,
//     faqs: [],
//     workflows: {},
//     rag_sources: [],
//     db_connection: "",
//     agents: []
//   });
//   return res.data;
// };


export const submitAgentInfo = async (
  tenant_id: string,
  description: string,
  instruction: string,
  welcome_message: string
) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Authentication token missing. Please log in again."
    );
  }

  if (!tenant_id) {
    throw new Error(
      "Tenant ID is missing from AuthContext."
    );
  }

  try {
    const res = await api.post("/chatbot_config/", {
      tenant_id,
      description,
      instruction,
      welcome_message,
      faqs: [],
      workflows: {},
      rag_sources: [],
      db_connection: "",
      agents: []
    });

    return res.data;
  } catch (error: any) {
    console.error(
      "Failed to save chatbot configuration:",
      error.response?.status,
      error.response?.data
    );

    throw error;
  }
};


// Add agent
export const addAgent = async (tenant_id: string, agent: { name: string; description: string }) => {
  const res = await api.post("/chatbot_config/add_agent_to_config", {
    tenant_id,
    agent
  });
  return res.data;
};

// Add FAQs
export const addFaqs = async (tenant_id: string, faq: Record<string, string>) => {
  const res = await api.post("/chatbot_config/add_faq_to_config", {
    tenant_id,
    faq
  });
  return res.data;
};

// Add DB URL
export const addDbUrl = async (tenant_id: string, db_url: string) => {
  const res = await api.post("/chatbot_config/add_db_url_to_config", {
    tenant_id,
    db_url
  });
  return res.data;
};

// Placeholder for RAG docs (not implemented in backend)
export const addRagDocs = async (tenant_id: string, docs: FileList) => {
  console.warn("addRagDocs not implemented in backend");
  return { status: "not_implemented" };
};

// Get chatbot config
export const getChatBotConfig = async (tenant_id: string) => {
  const res = await api.get(`/chatbot_config/${tenant_id}`);
  return res.data;
};
