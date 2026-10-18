// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import { motion } from "framer-motion";

// function CreateChatbot() {
//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       <Navbar />

//       {/* Hero Section */}
//       <section className="flex flex-col items-center justify-center text-center py-32 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
//         <motion.h1
//           initial={{ opacity: 0, y: -30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1 }}
//           className="text-4xl font-bold mb-4"
//         >
//           Create Your Chatbot
//         </motion.h1>
//         <motion.p
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.5 }}
//           className="max-w-2xl mb-6 text-lg"
//         >
//           Configure and launch a chatbot tailored to your business needs. 
//           Choose features, set workflows, and deploy instantly.
//         </motion.p>
//       </section>

//       {/* Main Content */}
//       <main className="flex-grow py-16 px-6">
//         <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
//           >
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 1: Basic Setup</h2>
//             <p className="text-gray-600">
//               Define your chatbot’s name, welcome message, and initial configuration.
//             </p>
//           </motion.div>

//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
//           >
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 2: Integrations</h2>
//             <p className="text-gray-600">
//               Connect your chatbot with databases, APIs, and third-party services.
//             </p>
//           </motion.div>

//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
//           >
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 3: Agents</h2>
//             <p className="text-gray-600">
//               Add intelligent agents like FAQ, DB Query, and RAG for smarter responses.
//             </p>
//           </motion.div>

//           <motion.div
//             whileHover={{ scale: 1.05 }}
//             className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
//           >
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 4: Deploy</h2>
//             <p className="text-gray-600">
//               Launch your chatbot and embed it into your website or app with a widget.
//             </p>
//           </motion.div>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// }

// export default CreateChatbot;





// 19-07-26

// import { useState, useEffect } from "react";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import {
//   submitAgentInfo,
//   addAgent,
//   addFaqs,
//   addDbUrl,
//   addRagDocs,
//   getChatBotConfig,
//   createWidgetToken,
// } from "../services/api_service";

// import { useAuth } from "../AuthContext";

// function CreateChatbot() {
//   // const tenant_id = "YOUR_TENANT_ID"; // replace with actual tenant context

//   const { tenantId } = useAuth()
//   const tenant_id = tenantId || "TENANT_ID_NOT_AVAILABLE"; // fallback if tenantId is not available
//   const [step, setStep] = useState(1);
//   const [disabled, setDisabled] = useState(false);

//   const [description, setDescription] = useState("");
//   const [instruction, setInstruction] = useState("");
//   const [welcomeMessage, setWelcomeMessage] = useState("");

//   const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
//   const [dbUrl, setDbUrl] = useState("");
//   const [faqKey, setFaqKey] = useState("");
//   const [faqValue, setFaqValue] = useState("");
//   const [faqs, setFaqs] = useState<Record<string, string>>({});
//   const [documents, setDocuments] = useState<FileList | null>(null);

//   useEffect(() => {
//     // check if chatbot already configured
//     (async () => {
//       try {
//         const config = await getChatBotConfig(tenant_id);
//         // if (config && config.description) {
//         //   setDisabled(true);
//         // }
//       } catch {
//         // not configured yet
//       }
//     })();
//   }, []);

//   const handleSubmitStep1 = async () => {
//     await submitAgentInfo(tenant_id, description, instruction, welcomeMessage);
//     setStep(2);
//   };

//   const handleAddAgent = async () => {
//     for (const agent of selectedAgents) {
//       if (agent === "RAG") {
//         await addAgent(tenant_id, {
//           name: "rag",
//           description: "rag agent to answer product information queries",
//         });
//         if (documents) {
//           await addRagDocs(tenant_id, documents);
//         }
//       }
//       if (agent === "DATABASE") {
//         await addAgent(tenant_id, {
//           name: "db_query",
//           description: "db query agent to query database related queries",
//         });
//         if (dbUrl) {
//           await addDbUrl(tenant_id, dbUrl);
//         }
//       }
//       if (agent === "FAQ") {
//         await addAgent(tenant_id, {
//           name: "faq",
//           description: "faq agent to answer common customer queries",
//         });
//         if (Object.keys(faqs).length > 0) {
//           await addFaqs(tenant_id, faqs);
//         }
//       }
//     }
//     alert("Agents configured successfully!");
//   };

//   const handleGenerateWidget = async () => {
//     const token = await createWidgetToken(tenant_id, "API_KEY", "USER_ID");
//     alert("Widget token: " + token.widget_token);
//   };

//   if (disabled) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-100">
//         <h1 className="text-2xl font-bold text-red-600">
//           Chatbot already configured. Form disabled.
//         </h1>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 min-h-screen flex flex-col">
//       <Navbar />
//       <main className="flex-grow py-16 px-6">
//         {step === 1 && (
//           <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg">
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 1: Chatbot Info</h2>
//             <input
//               type="text"
//               placeholder="Description"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               className="w-full border p-2 mb-4 rounded"
//             />
//             <input
//               type="text"
//               placeholder="Instruction"
//               value={instruction}
//               onChange={(e) => setInstruction(e.target.value)}
//               className="w-full border p-2 mb-4 rounded"
//             />
//             <input
//               type="text"
//               placeholder="Hello Message"
//               value={welcomeMessage}
//               onChange={(e) => setWelcomeMessage(e.target.value)}
//               className="w-full border p-2 mb-4 rounded"
//             />
//             <button
//               onClick={handleSubmitStep1}
//               className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
//             >
//               Submit
//             </button>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg">
//             <h2 className="text-xl font-semibold mb-4 text-indigo-600">Step 2: Configure Agents</h2>
//             <select
//               multiple
//               value={selectedAgents}
//               onChange={(e) =>
//                 setSelectedAgents(Array.from(e.target.selectedOptions, (opt) => opt.value))
//               }
//               className="w-full border p-2 mb-4 rounded"
//             >
//               <option value="RAG">RAG</option>
//               <option value="DATABASE">DATABASE</option>
//               <option value="FAQ">FAQ</option>
//             </select>

//             {selectedAgents.includes("RAG") && (
//               <div className="mb-4">
//                 <label className="block mb-2">Upload Documents</label>
//                 <input type="file" multiple onChange={(e) => setDocuments(e.target.files)} />
//               </div>
//             )}

//             {selectedAgents.includes("DATABASE") && (
//               <div className="mb-4">
//                 <input
//                   type="text"
//                   placeholder="Database URL"
//                   value={dbUrl}
//                   onChange={(e) => setDbUrl(e.target.value)}
//                   className="w-full border p-2 rounded"
//                 />
//               </div>
//             )}

//             {selectedAgents.includes("FAQ") && (
//               <div className="mb-4">
//                 <input
//                   type="text"
//                   placeholder="Question"
//                   value={faqKey}
//                   onChange={(e) => setFaqKey(e.target.value)}
//                   className="w-full border p-2 mb-2 rounded"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Answer"
//                   value={faqValue}
//                   onChange={(e) => setFaqValue(e.target.value)}
//                   className="w-full border p-2 mb-2 rounded"
//                 />
//                 <button
//                   onClick={() => {
//                     setFaqs({ ...faqs, [faqKey]: faqValue });
//                     setFaqKey("");
//                     setFaqValue("");
//                   }}
//                   className="px-3 py-1 bg-gray-200 rounded"
//                 >
//                   Add FAQ
//                 </button>
//               </div>
//             )}

//             <button
//               onClick={handleAddAgent}
//               className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-4"
//             >
//               Save Agents
//             </button>
//             <button
//               onClick={handleGenerateWidget}
//               className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//             >
//               Generate Widget Token
//             </button>
//           </div>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }

// export default CreateChatbot;








// 17-10-26

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";

import {
  submitAgentInfo,
  addAgent,
  addFaqs,
  addDbUrl,
  addRagDocs,
  getChatBotConfig,
  regenerateApiKey,
} from "../services/api_service";

function CreateChatbot() {
  const {
    tenantId,
    tenantName,
    tenantEmail,
    apiKey,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [showApiKey, setShowApiKey] = useState(false);

  const [step, setStep] = useState(1);

  const [config, setConfig] = useState<any>(null);

  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const [faqs, setFaqs] = useState<Record<string, string>>({});
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const [dbUrl, setDbUrl] = useState("");

  const [documents, setDocuments] = useState<FileList | null>(null);

  const [savedAgents, setSavedAgents] = useState<string[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      const chatbot = await getChatBotConfig(tenantId!);

      setConfig(chatbot);

      setDescription(chatbot.description || "");
      setInstruction(chatbot.instruction || "");
      setWelcomeMessage(chatbot.welcome_message || "");

      if (chatbot.db_connection) {
        setDbUrl(chatbot.db_connection);
      }

      const agents =
        chatbot.agents?.map((a: any) =>
          a.name?.toLowerCase()
        ) || [];

      setSavedAgents(agents);
      setConfigured(true);
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const saveChatbotInfo = async () => {
    if (!tenantId) return;

    await submitAgentInfo(
      tenantId,
      description,
      instruction,
      welcomeMessage
    );

    setStep(2);
  };

  const saveFaqAgent = async () => {
    if (!tenantId) return;

    await addAgent(tenantId, {
      name: "faq",
      description:
        "faq agent to answer common customer queries",
    });

    await addFaqs(tenantId, faqs);

    // setSavedAgents((prev) => [...new Set([...prev, "faq"])]);

    setSavedAgents((prev) => {
      if (prev.includes("faq")) return prev;
      return [...prev, "faq"];
    });
  };

  const saveDbAgent = async () => {
    if (!tenantId) return;

    await addAgent(tenantId, {
      name: "db_query",
      description:
        "database query agent",
    });

    await addDbUrl(tenantId, dbUrl);

    // setSavedAgents((prev) => [...new Set([...prev, "db_query"])]);
    setSavedAgents((prev) => {
      if (prev.includes("faq")) return prev;
      return [...prev, "faq"];
    });
  };

  const saveRagAgent = async () => {
    if (!tenantId) return;

    await addAgent(tenantId, {
      name: "rag",
      description:
        "rag agent to answer knowledge based questions",
    });

    if (documents) {
      await addRagDocs(tenantId, documents);
    }

    // setSavedAgents((prev) => [...new Set([...prev, "rag"])]);
    setSavedAgents((prev) => {
      if (prev.includes("rag")) return prev;
      return [...prev, "rag"];
    });
  };

  const handleDelete = () => {
    alert("Delete option disabled");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey || "");
    alert("API Key copied");
  };

  const handleRegenerateApiKey = async () => {
    if (!tenantId) return;

    const res = await regenerateApiKey(tenantId);

    alert(
      `New API Key Generated:\n\n${res.new_api_key}`
    );
  };

  const addFaqEntry = () => {
    if (!faqQuestion || !faqAnswer) return;

    setFaqs({
      ...faqs,
      faqAnswer,
    });

    setFaqQuestion("");
    setFaqAnswer("");
  };

  const renderAgentBadge = (
    agentName: string
  ) => {
    const isConfigured =
      savedAgents.includes(agentName);

    return (
      <div
        className={`border rounded-lg p-4 mb-4 ${
          isConfigured
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-white"
        }`}
      >
        <div className="flex justify-between">
          <div>
            <h3 className="font-semibold">
              {agentName.toUpperCase()}
            </h3>

            <p className="text-sm text-gray-600">
              {isConfigured
                ? "Configured"
                : "Not Configured"}
            </p>
          </div>

          {isConfigured && (
            <div className="space-x-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">

          {/* Hero */}

          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-10 mb-8">
            <h1 className="text-4xl font-bold mb-3">
              Create & Manage Chatbots
            </h1>

            <p>
              Configure AI agents, knowledge
              sources and integrations for your
              business chatbot.
            </p>
          </div>

          {configured && !editMode ? (
            <>
              {/* OVERVIEW */}

              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">
                  Chatbot Overview
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p>
                      <strong>Tenant:</strong>{" "}
                      {tenantName}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {tenantEmail}
                    </p>

                    <p>
                      <strong>Tenant ID:</strong>{" "}
                      {tenantId}
                    </p>
                  </div>

                  <div>
                    <p>
                      <strong>Description:</strong>{" "}
                      {config?.description}
                    </p>

                    <p>
                      <strong>Instruction:</strong>{" "}
                      {config?.instruction}
                    </p>

                    <p>
                      <strong>Welcome:</strong>{" "}
                      {config?.welcome_message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setEditMode(true)
                  }
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Edit Configuration
                </button>
              </div>

              {/* AGENTS */}

              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">
                  Configured Agents
                </h2>

                {renderAgentBadge("faq")}
                {renderAgentBadge("db_query")}
                {renderAgentBadge("rag")}
              </div>

              {/* INTEGRATION */}

              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">
                  Widget Integration
                </h2>

                <p>
                  <strong>Tenant ID:</strong>{" "}
                  {tenantId}
                </p>

                <div className="mt-3">
                  <strong>API Key:</strong>

                  <div className="mt-2">
                    {showApiKey
                      ? apiKey
                      : "****************************"}
                  </div>

                  <div className="mt-3 space-x-2">
                    <button
                      onClick={() =>
                        setShowApiKey(
                          !showApiKey
                        )
                      }
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      Show
                    </button>

                    <button
                      onClick={copyApiKey}
                      className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                      Copy
                    </button>

                    <button
                      onClick={
                        handleRegenerateApiKey
                      }
                      className="px-3 py-1 bg-orange-600 text-white rounded"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>

              {/* EMBED */}

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Embed Script
                </h2>

                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
{`<script>
window.ChatKit = {
 tenantId: "${tenantId}",
 apiKey: "${apiKey}"
};

// widget internally calls
// create_widget_token()
// chat_session/start
</script>`}
                </pre>
              </div>
            </>
          ) : (
            <>
              {/* CONFIGURATION FLOW */}

              {step === 1 && (
                <div className="bg-white p-8 rounded-xl shadow">
                  <h2 className="text-2xl font-bold mb-6">
                    Chatbot Information
                  </h2>

                  <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    className="w-full border p-3 rounded mb-4"
                  />

                  <input
                    placeholder="Instruction"
                    value={instruction}
                    onChange={(e) =>
                      setInstruction(
                        e.target.value
                      )
                    }
                    className="w-full border p-3 rounded mb-4"
                  />

                  <input
                    placeholder="Welcome Message"
                    value={welcomeMessage}
                    onChange={(e) =>
                      setWelcomeMessage(
                        e.target.value
                      )
                    }
                    className="w-full border p-3 rounded mb-4"
                  />

                  <button
                    onClick={saveChatbotInfo}
                    className="bg-indigo-600 text-white px-6 py-2 rounded"
                  >
                    Save & Next
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">

                  <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-2xl font-bold mb-4">
                      FAQ Agent
                    </h2>

                    <input
                      placeholder="Question"
                      value={faqQuestion}
                      onChange={(e) =>
                        setFaqQuestion(
                          e.target.value
                        )
                      }
                      className="w-full border p-2 mb-2"
                    />

                    <input
                      placeholder="Answer"
                      value={faqAnswer}
                      onChange={(e) =>
                        setFaqAnswer(
                          e.target.value
                        )
                      }
                      className="w-full border p-2 mb-2"
                    />

                    <button
                      onClick={addFaqEntry}
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Add FAQ
                    </button>

                    <button
                      onClick={saveFaqAgent}
                      disabled={savedAgents.includes(
                        "faq"
                      )}
                      className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Save Agent
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-2xl font-bold mb-4">
                      Database Agent
                    </h2>

                    <input
                      placeholder="Database URL"
                      value={dbUrl}
                      onChange={(e) =>
                        setDbUrl(
                          e.target.value
                        )
                      }
                      className="w-full border p-2 mb-2"
                    />

                    <button
                      onClick={saveDbAgent}
                      disabled={savedAgents.includes(
                        "db_query"
                      )}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Save Agent
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-2xl font-bold mb-4">
                      RAG Agent
                    </h2>

                    <input
                      type="file"
                      multiple
                      onChange={(e) =>
                        setDocuments(
                          e.target.files
                        )
                      }
                    />

                    <button
                      onClick={saveRagAgent}
                      disabled={savedAgents.includes(
                        "rag"
                      )}
                      className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Save Agent
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setConfigured(true);
                      setEditMode(false);
                      loadConfig();
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded"
                  >
                    Save Configuration
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default CreateChatbot;