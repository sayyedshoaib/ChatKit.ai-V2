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

// import { useEffect, useState } from "react";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import { useAuth } from "../AuthContext";

// import {
//   submitAgentInfo,
//   addAgent,
//   addFaqs,
//   addDbUrl,
//   addRagDocs,
//   getChatBotConfig,
//   regenerateApiKey,
// } from "../services/api_service";

// function CreateChatbot() {
//   const {
//     tenantId,
//     tenantName,
//     tenantEmail,
//     apiKey,
//   } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [configured, setConfigured] = useState(false);
//   const [editMode, setEditMode] = useState(false);

//   const [showApiKey, setShowApiKey] = useState(false);

//   const [step, setStep] = useState(1);

//   const [config, setConfig] = useState<any>(null);

//   const [description, setDescription] = useState("");
//   const [instruction, setInstruction] = useState("");
//   const [welcomeMessage, setWelcomeMessage] = useState("");

//   const [faqs, setFaqs] = useState<Record<string, string>>({});
//   const [faqQuestion, setFaqQuestion] = useState("");
//   const [faqAnswer, setFaqAnswer] = useState("");

//   const [dbUrl, setDbUrl] = useState("");

//   const [documents, setDocuments] = useState<FileList | null>(null);

//   const [savedAgents, setSavedAgents] = useState<string[]>([]);

//   // const [documents, setDocuments] = useState<FileList | null>(null);
//   const [savingRag, setSavingRag] = useState(false);
//   const [ragError, setRagError] = useState("");
//   const [ragSuccess, setRagSuccess] = useState("");



//   useEffect(() => {
//     if (!tenantId) return;

//     loadConfig();
//   }, [tenantId]);

//   const loadConfig = async () => {
//     try {
//       const chatbot = await getChatBotConfig(tenantId!);

//       setConfig(chatbot);

//       setDescription(chatbot.description || "");
//       setInstruction(chatbot.instruction || "");
//       setWelcomeMessage(chatbot.welcome_message || "");

//       if (chatbot.db_connection) {
//         setDbUrl(chatbot.db_connection);
//       }

//       const agents =
//         chatbot.agents?.map((a: any) =>
//           a.name?.toLowerCase()
//         ) || [];

//       setSavedAgents(agents);
//       setConfigured(true);
//     } catch {
//       setConfigured(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveChatbotInfo = async () => {
//     if (!tenantId) return;

//     await submitAgentInfo(
//       tenantId,
//       description,
//       instruction,
//       welcomeMessage
//     );

//     setStep(2);
//   };

//   const saveFaqAgent = async () => {
//     if (!tenantId) return;

//     await addAgent(tenantId, {
//       name: "faq",
//       description:
//         "faq agent to answer common customer queries",
//     });

//     await addFaqs(tenantId, faqs);

//     // setSavedAgents((prev) => [...new Set([...prev, "faq"])]);

//     setSavedAgents((prev) => {
//       if (prev.includes("faq")) return prev;
//       return [...prev, "faq"];
//     });
//   };

//   const saveDbAgent = async () => {
//     if (!tenantId) return;

//     await addAgent(tenantId, {
//       name: "db_query",
//       description:
//         "database query agent",
//     });

//     await addDbUrl(tenantId, dbUrl);

//     // setSavedAgents((prev) => [...new Set([...prev, "db_query"])]);
//     setSavedAgents((prev) => {
//       if (prev.includes("faq")) return prev;
//       return [...prev, "faq"];
//     });
//   };

//   // const saveRagAgent = async () => {
//   //   if (!tenantId) return;

//   //   await addAgent(tenantId, {
//   //     name: "rag",
//   //     description:
//   //       "rag agent to answer knowledge based questions",
//   //   });

//   //   if (documents) {
//   //     await addRagDocs(tenantId, documents);
//   //   }

//   //   // setSavedAgents((prev) => [...new Set([...prev, "rag"])]);
//   //   setSavedAgents((prev) => {
//   //     if (prev.includes("rag")) return prev;
//   //     return [...prev, "rag"];
//   //   });
//   // };

//   const saveRagAgent = async () => {
//     if (!tenantId) {
//       setRagError("Tenant ID is missing. Please log in again.");
//       return;
//     }

//     if (!documents || documents.length === 0) {
//       setRagError("Please select at least one document.");
//       return;
//     }

//     setSavingRag(true);
//     setRagError("");
//     setRagSuccess("");

//     try {
//       // 1. Create/configure the RAG agent.
//       await addAgent(tenantId, {
//         name: "rag",
//         description: "RAG agent to answer knowledge-based questions",
//       });

//       // 2. Upload documents and generate embeddings.
//       const result = await addRagDocs(tenantId, documents);

//       // 3. Mark the agent as saved only after successful processing.
//       setSavedAgents((prev) =>
//         prev.includes("rag") ? prev : [...prev, "rag"]
//       );

//       setRagSuccess(
//         `Uploaded ${result.uploadedFiles.length} document(s). ` +
//         `Generated ${result.embeddings.count} embedding chunk(s).`
//       );

//       setDocuments(null);
//     } catch (error: unknown) {
//       console.error("Failed to configure RAG agent:", error);

//       if (error instanceof Error) {
//         setRagError(error.message);
//       } else {
//         setRagError("Something went wrong while configuring the RAG agent.");
//       }
//     } finally {
//       setSavingRag(false);
//     }
//   };

//   const handleDelete = () => {
//     alert("Delete option disabled");
//   };

//   const copyApiKey = () => {
//     navigator.clipboard.writeText(apiKey || "");
//     alert("API Key copied");
//   };

//   const handleRegenerateApiKey = async () => {
//     if (!tenantId) return;

//     const res = await regenerateApiKey(tenantId);

//     alert(
//       `New API Key Generated:\n\n${res.new_api_key}`
//     );
//   };

//   const addFaqEntry = () => {
//     if (!faqQuestion || !faqAnswer) return;

//     setFaqs({
//       ...faqs,
//       faqAnswer,
//     });

//     setFaqQuestion("");
//     setFaqAnswer("");
//   };

//   const renderAgentBadge = (
//     agentName: string
//   ) => {
//     const isConfigured =
//       savedAgents.includes(agentName);

//     return (
//       <div
//         className={`border rounded-lg p-4 mb-4 ${
//           isConfigured
//             ? "border-green-500 bg-green-50"
//             : "border-gray-300 bg-white"
//         }`}
//       >
//         <div className="flex justify-between">
//           <div>
//             <h3 className="font-semibold">
//               {agentName.toUpperCase()}
//             </h3>

//             <p className="text-sm text-gray-600">
//               {isConfigured
//                 ? "Configured"
//                 : "Not Configured"}
//             </p>
//           </div>

//           {isConfigured && (
//             <div className="space-x-2">
//               <button
//                 className="px-3 py-1 bg-blue-600 text-white rounded"
//               >
//                 Edit
//               </button>

//               <button
//                 onClick={handleDelete}
//                 className="px-3 py-1 bg-red-600 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="p-10">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar />

//       <div className="min-h-screen bg-gray-50 pt-24 pb-12">
//         <div className="max-w-7xl mx-auto px-6">

//           {/* Hero */}

//           <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-10 mb-8">
//             <h1 className="text-4xl font-bold mb-3">
//               Create & Manage Chatbots
//             </h1>

//             <p>
//               Configure AI agents, knowledge
//               sources and integrations for your
//               business chatbot.
//             </p>
//           </div>

//           {configured && !editMode ? (
//             <>
//               {/* OVERVIEW */}

//               <div className="bg-white rounded-xl shadow p-6 mb-6">
//                 <h2 className="text-2xl font-bold mb-4">
//                   Chatbot Overview
//                 </h2>

//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div>
//                     <p>
//                       <strong>Tenant:</strong>{" "}
//                       {tenantName}
//                     </p>

//                     <p>
//                       <strong>Email:</strong>{" "}
//                       {tenantEmail}
//                     </p>

//                     <p>
//                       <strong>Tenant ID:</strong>{" "}
//                       {tenantId}
//                     </p>
//                   </div>

//                   <div>
//                     <p>
//                       <strong>Description:</strong>{" "}
//                       {config?.description}
//                     </p>

//                     <p>
//                       <strong>Instruction:</strong>{" "}
//                       {config?.instruction}
//                     </p>

//                     <p>
//                       <strong>Welcome:</strong>{" "}
//                       {config?.welcome_message}
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() =>
//                     setEditMode(true)
//                   }
//                   className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded"
//                 >
//                   Edit Configuration
//                 </button>
//               </div>

//               {/* AGENTS */}

//               <div className="bg-white rounded-xl shadow p-6 mb-6">
//                 <h2 className="text-2xl font-bold mb-4">
//                   Configured Agents
//                 </h2>

//                 {renderAgentBadge("faq")}
//                 {renderAgentBadge("db_query")}
//                 {renderAgentBadge("rag")}
//               </div>

//               {/* INTEGRATION */}

//               <div className="bg-white rounded-xl shadow p-6 mb-6">
//                 <h2 className="text-2xl font-bold mb-4">
//                   Widget Integration
//                 </h2>

//                 <p>
//                   <strong>Tenant ID:</strong>{" "}
//                   {tenantId}
//                 </p>

//                 <div className="mt-3">
//                   <strong>API Key:</strong>

//                   <div className="mt-2">
//                     {showApiKey
//                       ? apiKey
//                       : "****************************"}
//                   </div>

//                   <div className="mt-3 space-x-2">
//                     <button
//                       onClick={() =>
//                         setShowApiKey(
//                           !showApiKey
//                         )
//                       }
//                       className="px-3 py-1 bg-gray-200 rounded"
//                     >
//                       Show
//                     </button>

//                     <button
//                       onClick={copyApiKey}
//                       className="px-3 py-1 bg-indigo-600 text-white rounded"
//                     >
//                       Copy
//                     </button>

//                     <button
//                       onClick={
//                         handleRegenerateApiKey
//                       }
//                       className="px-3 py-1 bg-orange-600 text-white rounded"
//                     >
//                       Regenerate
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* EMBED */}

//               <div className="bg-white rounded-xl shadow p-6">
//                 <h2 className="text-2xl font-bold mb-4">
//                   Embed Script
//                 </h2>

//                 <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
// {/* {`<script>
// window.ChatKit = {
//  tenantId: "${tenantId}",
//  apiKey: "${apiKey}"
// };

// // widget internally calls
// // create_widget_token()
// // chat_session/start
// </script>`} */}

// {
// <script
//   src="http://localhost:3000/chatkit-widget.js"
//   data-tenant-id="da64dc48-6315-43a1-8853-1940c3d2861e"
//   data-widget-key="ZFnkyPkCQbtyzJYmS6XH9KHWMcWfcwU6oxqBeI1eyRc"
//   data-api-base="http://localhost:8000"
//   async
// ></script>
// }

//                 </pre>
//               </div>
//             </>
//           ) : (
//             <>
//               {/* CONFIGURATION FLOW */}

//               {step === 1 && (
//                 <div className="bg-white p-8 rounded-xl shadow">
//                   <h2 className="text-2xl font-bold mb-6">
//                     Chatbot Information
//                   </h2>

//                   <input
//                     placeholder="Description"
//                     value={description}
//                     onChange={(e) =>
//                       setDescription(
//                         e.target.value
//                       )
//                     }
//                     className="w-full border p-3 rounded mb-4"
//                   />

//                   <input
//                     placeholder="Instruction"
//                     value={instruction}
//                     onChange={(e) =>
//                       setInstruction(
//                         e.target.value
//                       )
//                     }
//                     className="w-full border p-3 rounded mb-4"
//                   />

//                   <input
//                     placeholder="Welcome Message"
//                     value={welcomeMessage}
//                     onChange={(e) =>
//                       setWelcomeMessage(
//                         e.target.value
//                       )
//                     }
//                     className="w-full border p-3 rounded mb-4"
//                   />

//                   <button
//                     onClick={saveChatbotInfo}
//                     className="bg-indigo-600 text-white px-6 py-2 rounded"
//                   >
//                     Save & Next
//                   </button>
//                 </div>
//               )}

//               {step === 2 && (
//                 <div className="space-y-8">

//                   <div className="bg-white p-6 rounded-xl shadow">
//                     <h2 className="text-2xl font-bold mb-4">
//                       FAQ's
//                     </h2>

//                     <input
//                       placeholder="Question"
//                       value={faqQuestion}
//                       onChange={(e) =>
//                         setFaqQuestion(
//                           e.target.value
//                         )
//                       }
//                       className="w-full border p-2 mb-2"
//                     />

//                     <input
//                       placeholder="Answer"
//                       value={faqAnswer}
//                       onChange={(e) =>
//                         setFaqAnswer(
//                           e.target.value
//                         )
//                       }
//                       className="w-full border p-2 mb-2"
//                     />

//                     <button
//                       onClick={addFaqEntry}
//                       className="px-4 py-2 bg-gray-200 rounded"
//                     >
//                       Add FAQ
//                     </button>

//                     <button
//                       onClick={saveFaqAgent}
//                       disabled={savedAgents.includes(
//                         "faq"
//                       )}
//                       className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
//                     >
//                       Save All FAQ's
//                     </button>
//                   </div>

//                   <div className="bg-white p-6 rounded-xl shadow">
//                     <h2 className="text-2xl font-bold mb-4">
//                       Database Agent
//                     </h2>

//                     <input
//                       placeholder="Database URL"
//                       value={dbUrl}
//                       onChange={(e) =>
//                         setDbUrl(
//                           e.target.value
//                         )
//                       }
//                       className="w-full border p-2 mb-2"
//                     />

//                     <button
//                       onClick={saveDbAgent}
//                       disabled={savedAgents.includes(
//                         "db_query"
//                       )}
//                       className="px-4 py-2 bg-green-600 text-white rounded"
//                     >
//                       Save Agent
//                     </button>
//                   </div>

//                   <div className="bg-white p-6 rounded-xl shadow">
//                     <h2 className="text-2xl font-bold mb-4">RAG Agent</h2>

//                     <p className="text-sm text-gray-600 mb-3">
//                       Upload documents to build your chatbot's knowledge base.
//                     </p>

//                     <input
//                       type="file"
//                       multiple
//                       accept=".pdf,.docx,.txt,.md"
//                       disabled={savingRag || savedAgents.includes("rag")}
//                       onChange={(e) => {
//                         setDocuments(e.target.files);
//                         setRagError("");
//                         setRagSuccess("");
//                       }}
//                     />

//                     {documents && documents.length > 0 && (
//                       <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
//                         {Array.from(documents).map((file, index) => (
//                           <li key={`${file.name}-${file.size}-${index}`}>
//                             {file.name}
//                           </li>
//                         ))}
//                       </ul>
//                     )}

//                     {ragError && (
//                       <p className="mt-3 text-sm text-red-600">
//                         {ragError}
//                       </p>
//                     )}

//                     {ragSuccess && (
//                       <p className="mt-3 text-sm text-green-700">
//                         {ragSuccess}
//                       </p>
//                     )}

//                     <button
//                       type="button"
//                       onClick={saveRagAgent}
//                       disabled={
//                         savingRag ||
//                         savedAgents.includes("rag") ||
//                         !documents ||
//                         documents.length === 0
//                       }
//                       className="mt-4 ml-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
//                     >
//                       {savingRag
//                         ? "Uploading and processing..."
//                         : savedAgents.includes("rag")
//                           ? "RAG Agent Saved"
//                           : "Save Agent"}
//                     </button>
//                   </div>

//                   <button
//                     onClick={() => {
//                       setConfigured(true);
//                       setEditMode(false);
//                       loadConfig();
//                     }}
//                     className="px-6 py-3 bg-indigo-600 text-white rounded"
//                   >
//                     Save Configuration
//                   </button>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>

//       <Footer />
//     </>
//   );
// }

// export default CreateChatbot;

// 19-10-26



import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";

import {
  addAgent,
  addFaqs,
  addDbUrl,
  addRagDocs,
  getChatBotConfig,
  submitAgentInfo,
  updateChatBotConfig,
  regenerateApiKey,
  getErrorMessage,
} from "../services/api_service";

import type { ChatbotConfig, Agent } from "../services/api_service";

type AgentType = "db_query" | "rag";

type FaqMap = Record<string, string>;

type AgentExample = {
  query: string;
  expected_handling: string;
};

type ConfiguredAgent = Agent & {
  examples?: AgentExample[];
  db_url?: string;
};

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const API_BASE_URL ="http://localhost:8000";

const WIDGET_SCRIPT_URL = `${window.location.origin}/chatkit-widget.js`;

const AGENT_DETAILS: Record<
  AgentType,
  { title: string; description: string }
> = {
  db_query: {
    title: "Database Agent",
    description:
      "Queries your connected database to answer questions about your business data.",
  },
  rag: {
    title: "Knowledge Base Agent",
    description:
      "Uses uploaded documents and knowledge sources to answer questions grounded in your business information.",
  },
};

const inputClass =
  "w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

const buttonClass =
  "rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

function normalizeAgentName(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeFaqs(value: unknown): FaqMap {
  const result: FaqMap = {};

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;

      const item = entry as Record<string, unknown>;

      // Supports the newer { question, answer } structure.
      if (
        typeof item.question === "string" &&
        typeof item.answer === "string"
      ) {
        result[item.question] = item.answer;
        continue;
      }

      // Supports the existing question-to-answer object structure.
      for (const [question, answer] of Object.entries(item)) {
        if (typeof answer === "string" && question.trim()) {
          result[question] = answer;
        }
      }
    }

    return result;
  }

  if (value && typeof value === "object") {
    for (const [question, answer] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (typeof answer === "string" && question.trim()) {
        result[question] = answer;
      }
    }
  }

  return result;
}

function getExamples(agent: ConfiguredAgent | undefined): AgentExample[] {
  // if (!Array.isArray(agent?.examples)) return [];

  // return agent.examples.map((example) => ({
  //   query: typeof example?.query === "string" ? example.query : "",
  //   expected_handling:
  //     typeof example?.expected_handling === "string"
  //       ? example.expected_handling
  //       : "",
  // }));
  if (!agent || !Array.isArray(agent.examples)) return [];

  return agent.examples.map((example) => ({
    query: typeof example?.query === "string" ? example.query : "",
    expected_handling:
      typeof example?.expected_handling === "string"
        ? example.expected_handling
        : "",
  }));
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <p role="alert" className="mt-3 text-sm text-red-600">
      {children}
    </p>
  );
}

function SuccessMessage({ children }: { children: string }) {
  return (
    <p role="status" className="mt-3 text-sm text-green-700">
      {children}
    </p>
  );
}

function CreateChatbot() {
  const {
    tenantId: contextTenantId,
    tenantName,
    tenantEmail,
    apiKey,
  } = useAuth();

  const tenantId =
    contextTenantId || localStorage.getItem("tenant_id") || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [configured, setConfigured] = useState(false);

  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [agentModal, setAgentModal] = useState<AgentType | null>(null);

  const [savingBasic, setSavingBasic] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [savingFaqs, setSavingFaqs] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);

  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const [draftDescription, setDraftDescription] = useState("");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftWelcomeMessage, setDraftWelcomeMessage] = useState("");

  const [faqs, setFaqs] = useState<FaqMap>({});
  const [draftFaqs, setDraftFaqs] = useState<FaqMap>({});
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqError, setFaqError] = useState("");
  const [faqSuccess, setFaqSuccess] = useState("");
  const [faqModalOpen, setFaqModalOpen] = useState(false);

  const [dbUrl, setDbUrl] = useState("");
  const [draftDbUrl, setDraftDbUrl] = useState("");
  const [draftAgentDescription, setDraftAgentDescription] = useState("");
  const [draftExamples, setDraftExamples] = useState<AgentExample[]>([]);

  const [documents, setDocuments] = useState<FileList | null>(null);
  const [agentError, setAgentError] = useState("");
  const [agentSuccess, setAgentSuccess] = useState("");

  const [basicError, setBasicError] = useState("");
  const [basicSuccess, setBasicSuccess] = useState("");

  const [showApiKey, setShowApiKey] = useState(false);
  const [showWidgetKey, setShowWidgetKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [apiKeyValue, setApiKeyValue] = useState(
    apiKey || localStorage.getItem("api_key") || "",
  );
  const [widgetKey, setWidgetKey] = useState(
    localStorage.getItem("widget_key") || "",
  );

  const configuredAgents = useMemo(
    () =>
      ((config?.agents ?? []) as ConfiguredAgent[]).filter((agent) =>
        ["db_query", "rag"].includes(normalizeAgentName(agent.name)),
      ),
    [config],
  );

  const widgetScript = useMemo(() => {
    if (!tenantId || !widgetKey) return "";

    return `<script
  src="${WIDGET_SCRIPT_URL}"
  data-tenant-id="${tenantId}"
  data-widget-key="${widgetKey}"
  data-api-base="${API_BASE_URL}"
  async
></script>`;
  }, [tenantId, widgetKey]);

  const applyConfig = useCallback((chatbot: ChatbotConfig | null) => {
    setConfig(chatbot);
    setConfigured(Boolean(chatbot));

    setDescription(chatbot?.description || "");
    setInstruction(chatbot?.instruction || "");
    setWelcomeMessage(chatbot?.welcome_message || "");

    setFaqs(normalizeFaqs(chatbot?.faqs));
    setDbUrl(chatbot?.db_connection || "");
  }, []);

  const loadConfig = useCallback(async () => {
    if (!tenantId) {
      setConfig(null);
      setConfigured(false);
      setLoadError(
        "Your tenant ID is unavailable. Please sign in again.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const chatbot = await getChatBotConfig(tenantId);
      applyConfig(chatbot);

      setWidgetKey(localStorage.getItem("widget_key") || "");
      setApiKeyValue(
        apiKey || localStorage.getItem("api_key") || "",
      );
    } catch (error: unknown) {
      const status = (
        error as { response?: { status?: number } }
      )?.response?.status;

      if (status === 404) {
        applyConfig(null);
      } else {
        setLoadError(
          getErrorMessage(
            error,
            "Unable to load chatbot configuration.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, applyConfig, apiKey]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const refreshConfig = async () => {
    if (!tenantId) return;
    const updated = await getChatBotConfig(tenantId);
    applyConfig(updated);
  };

  const openBasicEditor = () => {
    setDraftDescription(description);
    setDraftInstruction(instruction);
    setDraftWelcomeMessage(welcomeMessage);
    setBasicError("");
    setBasicSuccess("");
    setBasicModalOpen(true);
  };

  const saveBasicConfiguration = async () => {
    if (!tenantId) {
      setBasicError("Tenant ID is missing. Please log in again.");
      return;
    }

    if (
      !draftDescription.trim() ||
      !draftInstruction.trim() ||
      !draftWelcomeMessage.trim()
    ) {
      setBasicError("Please complete all chatbot information fields.");
      return;
    }

    setSavingBasic(true);
    setBasicError("");
    setBasicSuccess("");

    try {
      let updated: ChatbotConfig;

      if (config) {
        updated = await updateChatBotConfig(tenantId, {
          description: draftDescription.trim(),
          instruction: draftInstruction.trim(),
          welcome_message: draftWelcomeMessage.trim(),
        });
      } else {
        updated = await submitAgentInfo(
          tenantId,
          draftDescription.trim(),
          draftInstruction.trim(),
          draftWelcomeMessage.trim(),
        );
      }

      try {
        updated = await getChatBotConfig(tenantId);
      } catch {
        // Keep the successful API response if refreshing fails.
      }

      applyConfig(updated);
      setBasicSuccess("Chatbot information saved successfully.");
      setBasicModalOpen(false);
      setConfigured(true);
    } catch (error: unknown) {
      setBasicError(
        getErrorMessage(error, "Unable to save chatbot information."),
      );
    } finally {
      setSavingBasic(false);
    }
  };

  const openFaqEditor = () => {
    setDraftFaqs({ ...faqs });
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqError("");
    setFaqSuccess("");
    setFaqModalOpen(true);
  };

  const addFaqToDraft = () => {
    const question = faqQuestion.trim();
    const answer = faqAnswer.trim();

    if (!question || !answer) {
      setFaqError("Enter both a question and an answer.");
      return;
    }

    setDraftFaqs((current) => ({
      ...current,
      [question]: answer,
    }));

    setFaqQuestion("");
    setFaqAnswer("");
    setFaqError("");
  };

  const removeFaqFromDraft = (question: string) => {
    setDraftFaqs((current) => {
      const next = { ...current };
      delete next[question];
      return next;
    });
  };

  const saveFaqConfiguration = async () => {
    if (!tenantId) {
      setFaqError("Tenant ID is missing. Please log in again.");
      return;
    }

    setSavingFaqs(true);
    setFaqError("");
    setFaqSuccess("");

    try {
      // FAQs are saved as FAQ data, not registered as an agent.
      await addFaqs(tenantId, draftFaqs);
      await refreshConfig();

      setFaqSuccess("FAQs saved successfully.");
      setFaqModalOpen(false);
    } catch (error: unknown) {
      setFaqError(
        getErrorMessage(error, "Unable to save FAQs."),
      );
    } finally {
      setSavingFaqs(false);
    }
  };

  const openAgentEditor = (agentType: AgentType) => {
    setAgentError("");
    setAgentSuccess("");
    setDocuments(null);

    const existing = configuredAgents.find(
      (agent) => normalizeAgentName(agent.name) === agentType,
    );

    setDraftAgentDescription(existing?.description || "");
    setDraftExamples(getExamples(existing));

    if (agentType === "db_query") {
      setDraftDbUrl(
        existing?.db_url ||
          dbUrl ||
          "",
      );
    }

    setAgentModal(agentType);
  };

  const addExample = () => {
    setDraftExamples((current) => [
      ...current,
      { query: "", expected_handling: "" },
    ]);
  };

  const updateExample = (
    index: number,
    field: keyof AgentExample,
    value: string,
  ) => {
    setDraftExamples((current) =>
      current.map((example, i) =>
        i === index ? { ...example, [field]: value } : example,
      ),
    );
  };

  const removeExample = (index: number) => {
    setDraftExamples((current) =>
      current.filter((_, i) => i !== index),
    );
  };

  const validateAgent = () => {
    if (!draftAgentDescription.trim()) {
      setAgentError(
        "Please provide a description explaining what this agent should handle.",
      );
      return false;
    }

    const incomplete = draftExamples.some(
      (example) =>
        Boolean(example.query.trim()) !==
        Boolean(example.expected_handling.trim()),
    );

    if (incomplete) {
      setAgentError(
        "Complete both fields for each example, or remove the unused example.",
      );
      return false;
    }

    return true;
  };

  const saveAgentConfiguration = async () => {
    if (!tenantId || !agentModal) {
      setAgentError("Tenant ID or agent type is missing.");
      return;
    }

    if (!validateAgent()) return;

    if (agentModal === "db_query" && !draftDbUrl.trim()) {
      setAgentError("Enter a database connection URL.");
      return;
    }

    if (
      agentModal === "rag" &&
      (!documents || documents.length === 0) &&
      !configuredAgents.some(
        (agent) => normalizeAgentName(agent.name) === "rag",
      )
    ) {
      setAgentError(
        "Select at least one document when configuring the knowledge base for the first time.",
      );
      return;
    }

    setSavingAgent(true);
    setAgentError("");
    setAgentSuccess("");

    try {
      const examples = draftExamples
        .filter(
          (example) =>
            example.query.trim() &&
            example.expected_handling.trim(),
        )
        .map((example) => ({
          query: example.query.trim(),
          expected_handling: example.expected_handling.trim(),
        }));

      const agentPayload = {
        name: agentModal,
        description: draftAgentDescription.trim(),
        examples,
        ...(agentModal === "db_query"
          ? { db_url: draftDbUrl.trim() }
          : {}),
      };

      // The API helper should send this object through to the backend.
      // The cast keeps compatibility with projects whose Agent type has
      // not yet been extended with the examples field.
      await addAgent(tenantId, agentPayload as Agent);

      if (agentModal === "db_query") {
        await addDbUrl(tenantId, draftDbUrl.trim());
      }

      if (agentModal === "rag" && documents?.length) {
        await addRagDocs(tenantId, documents);
      }

      await refreshConfig();

      setAgentSuccess(
        `${AGENT_DETAILS[agentModal].title} saved successfully.`,
      );
      setAgentModal(null);
      setDocuments(null);
    } catch (error: unknown) {
      setAgentError(
        getErrorMessage(
          error,
          `Unable to save ${AGENT_DETAILS[agentModal].title.toLowerCase()}.`,
        ),
      );
    } finally {
      setSavingAgent(false);
    }
  };

  const handleDeleteDisabled = () => {
    window.alert("Delete option disabled");
  };

  const copyText = async (value: string, label: string) => {
    if (!value) {
      window.alert(`${label} is not available.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      window.alert(`${label} copied.`);
    } catch {
      window.alert(
        `Unable to copy ${label}. Please copy it manually.`,
      );
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!tenantId || regeneratingKey) return;

    if (
      !window.confirm(
        "Regenerating your private API key may invalidate the previous key. Continue?",
      )
    ) {
      return;
    }

    setRegeneratingKey(true);
    setKeyError("");

    try {
      const response = await regenerateApiKey(tenantId);

      if (!response?.new_api_key) {
        throw new Error("The server did not return a new API key.");
      }

      setApiKeyValue(response.new_api_key);
      localStorage.setItem("api_key", response.new_api_key);
      window.alert(
        "Your new private API key has been generated. Copy and store it securely.",
      );
    } catch (error: unknown) {
      setKeyError(
        getErrorMessage(error, "Unable to regenerate the API key."),
      );
    } finally {
      setRegeneratingKey(false);
    }
  };

  const isAgentSaved = (name: AgentType) =>
    configuredAgents.some(
      (agent) => normalizeAgentName(agent.name) === name,
    );

  const renderAgentCard = (name: AgentType) => {
    const details = AGENT_DETAILS[name];
    const saved = isAgentSaved(name);
    const existing = configuredAgents.find(
      (agent) => normalizeAgentName(agent.name) === name,
    );

    return (
      <div
        key={name}
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold">{details.title}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  saved
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {saved ? "Configured" : "Not configured"}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {existing?.description || details.description}
            </p>

            {saved && (
              <p className="mt-2 text-sm text-gray-500">
                {getExamples(existing).length} example(s) configured
              </p>
            )}

            {name === "db_query" && saved && (
              <p className="mt-1 text-sm text-gray-500">
                Database connection saved
              </p>
            )}

            {name === "rag" && saved && (
              <p className="mt-1 text-sm text-gray-500">
                {(config?.rag_sources ?? []).length} source document(s) recorded
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAgentEditor(name)}
            disabled={loading || savingAgent || savingBasic}
            className={buttonClass}
          >
            {saved ? "Edit Configuration" : "Configure Agent"}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[65vh] items-center justify-center bg-gray-50 px-6 pt-24">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-gray-700">
              Loading chatbot configuration...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-4 pb-12 pt-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white shadow-sm sm:p-10">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Create & Manage Chatbots
            </h1>
            <p className="mt-3 max-w-2xl text-indigo-100">
              Configure your chatbot, customer FAQs, specialized agents, and
              website widget integration.
            </p>
          </section>

          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <ErrorMessage>{loadError}</ErrorMessage>
              <button
                type="button"
                onClick={() => void loadConfig()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Retry loading
              </button>
            </div>
          )}

          {!tenantId && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Your tenant ID is unavailable. Please sign in again.
            </div>
          )}

          {!configured && (
            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold">Set up your chatbot</h2>
              <p className="mt-2 text-gray-600">
                First, describe your chatbot's purpose, instructions, and
                greeting. You can then add FAQs and configure agents.
              </p>
              <button
                type="button"
                onClick={openBasicEditor}
                disabled={!tenantId || savingBasic}
                className={`${buttonClass} mt-5`}
              >
                Configure Chatbot
              </button>
            </section>
          )}

          {configured && (
            <>
              <section className="mb-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Chatbot Overview</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      General behavior and greeting shown to your customers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openBasicEditor}
                    disabled={savingBasic || savingAgent}
                    className={buttonClass}
                  >
                    Edit Configuration
                  </button>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p>
                      <strong>Tenant:</strong> {tenantName || "—"}
                    </p>
                    <p>
                      <strong>Email:</strong> {tenantEmail || "—"}
                    </p>
                    <p className="break-all">
                      <strong>Tenant ID:</strong> {tenantId || "—"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold">Description</p>
                      <p className="mt-1 whitespace-pre-wrap text-gray-600">
                        {description || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">General instructions</p>
                      <p className="mt-1 whitespace-pre-wrap text-gray-600">
                        {instruction || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Welcome message</p>
                      <p className="mt-1 whitespace-pre-wrap text-gray-600">
                        {welcomeMessage || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
                {basicSuccess && (
                  <SuccessMessage>{basicSuccess}</SuccessMessage>
                )}
              </section>

              <section className="mb-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Customer FAQs</h2>
                    <p className="mt-2 text-gray-600">
                      These are customer-facing questions, not AI agents.
                      The widget will display them in an expandable section
                      below the welcome message once the widget is updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openFaqEditor}
                    disabled={savingFaqs || savingAgent}
                    className={buttonClass}
                  >
                    {Object.keys(faqs).length ? "Edit FAQs" : "Configure FAQs"}
                  </button>
                </div>

                {Object.keys(faqs).length === 0 ? (
                  <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No FAQs configured yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {Object.entries(faqs).map(([question, answer]) => (
                      <details
                        key={question}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <summary className="cursor-pointer font-medium">
                          {question}
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                          {answer}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
                {faqSuccess && <SuccessMessage>{faqSuccess}</SuccessMessage>}
              </section>

              <section className="mb-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-bold">Specialized Agents</h2>
                <p className="mt-2 text-gray-600">
                  Explain each agent's responsibilities and add representative
                  examples. The orchestrator can use these descriptions and
                  examples to select a suitable agent.
                </p>

                <div className="mt-6 space-y-4">
                  {renderAgentCard("db_query")}
                  {renderAgentCard("rag")}
                </div>

                <p className="mt-5 text-sm text-gray-500">
                  Agent deletion is not available yet. The Delete option is
                  intentionally disabled until a backend delete API exists.
                </p>
                {agentSuccess && (
                  <SuccessMessage>{agentSuccess}</SuccessMessage>
                )}
              </section>

              <section className="mb-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-bold">Widget Integration</h2>
                <p className="mt-2 text-gray-600">
                  Use the public widget key in your embed script. Do not expose
                  your private API key in the script.
                </p>

                <div className="mt-6">
                  <p className="font-semibold">Tenant ID</p>
                  <p className="mt-1 break-all text-gray-700">{tenantId}</p>
                </div>

                <div className="mt-5">
                  <p className="font-semibold">Private API Key</p>
                  <p className="mt-2 break-all font-mono text-sm">
                    {apiKeyValue
                      ? showApiKey
                        ? apiKeyValue
                        : "•".repeat(24)
                      : "Not available"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowApiKey((value) => !value)}
                      className="rounded-lg bg-gray-200 px-3 py-2 hover:bg-gray-300"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(apiKeyValue, "Private API key")
                      }
                      disabled={!apiKeyValue}
                      className={buttonClass}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRegenerateApiKey()}
                      disabled={regeneratingKey}
                      className="rounded-lg bg-orange-600 px-3 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {regeneratingKey ? "Regenerating..." : "Regenerate"}
                    </button>
                  </div>
                  {keyError && <ErrorMessage>{keyError}</ErrorMessage>}
                </div>

                <div className="mt-6">
                  <p className="font-semibold">Public Widget Key</p>
                  <p className="mt-2 break-all font-mono text-sm">
                    {widgetKey
                      ? showWidgetKey
                        ? widgetKey
                        : "•".repeat(24)
                      : "Not available"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWidgetKey((value) => !value)}
                      className="rounded-lg bg-gray-200 px-3 py-2 hover:bg-gray-300"
                    >
                      {showWidgetKey ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyText(widgetKey, "Widget key")}
                      disabled={!widgetKey}
                      className={buttonClass}
                    >
                      Copy Widget Key
                    </button>
                  </div>
                  {!widgetKey && (
                    <p className="mt-2 text-sm text-amber-700">
                      Your widget key is not available in local storage.
                      Sign in again or ensure your login response includes
                      widget_key.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Embed Script</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Copy this snippet into your website HTML.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(widgetScript, "Embed script")}
                    disabled={!widgetScript}
                    className={buttonClass}
                  >
                    Copy Script
                  </button>
                </div>

                <pre className="mt-5 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-gray-900 p-4 text-sm text-green-300">
                  <code>
                    {widgetScript ||
                      "The embed script will appear when the tenant ID and widget key are available."}
                  </code>
                </pre>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* General chatbot configuration */}
      {basicModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="basic-config-title"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <h2 id="basic-config-title" className="text-2xl font-bold">
              {configured ? "Edit Chatbot Configuration" : "Configure Chatbot"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              These instructions define the chatbot's overall purpose and
              behavior. Individual agents can have their own descriptions and
              examples.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block font-medium">
                  Chatbot description
                </span>
                <textarea
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Describe your business, what this chatbot helps customers accomplish, the types of questions it should handle, and its intended audience."
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">
                  General instructions
                </span>
                <textarea
                  value={draftInstruction}
                  onChange={(event) => setDraftInstruction(event.target.value)}
                  rows={5}
                  className={inputClass}
                  placeholder="Describe the chatbot's tone, response style, business rules, information sources, limitations, and when it should direct customers to human support."
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">Welcome message</span>
                <textarea
                  value={draftWelcomeMessage}
                  onChange={(event) =>
                    setDraftWelcomeMessage(event.target.value)
                  }
                  rows={3}
                  className={inputClass}
                  placeholder="Write the short greeting customers should see when they open your website chat."
                />
              </label>
            </div>

            {basicError && <ErrorMessage>{basicError}</ErrorMessage>}

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setBasicModalOpen(false)}
                disabled={savingBasic}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveBasicConfiguration()}
                disabled={savingBasic}
                className={buttonClass}
              >
                {savingBasic ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ configuration: intentionally not an agent */}
      {faqModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-config-title"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <h2 id="faq-config-title" className="text-2xl font-bold">
              Configure FAQs
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Add common customer questions and their answers. These will be
              presented in the website widget as expandable questions.
            </p>

            <div className="mt-6 space-y-3">
              {Object.entries(draftFaqs).map(([question, answer]) => (
                <div
                  key={question}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{question}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                        {answer}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaqFromDraft(question)}
                      disabled={savingFaqs}
                      className="shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold">Add or update a question</h3>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium">Question</span>
                <input
                  value={faqQuestion}
                  onChange={(event) => setFaqQuestion(event.target.value)}
                  className={inputClass}
                  placeholder="For example: How can I track my order?"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium">Answer</span>
                <textarea
                  value={faqAnswer}
                  onChange={(event) => setFaqAnswer(event.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Write a clear, helpful answer customers can understand without contacting support."
                />
              </label>
              <button
                type="button"
                onClick={addFaqToDraft}
                disabled={savingFaqs}
                className="mt-3 rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Add / Update FAQ
              </button>
            </div>

            {faqError && <ErrorMessage>{faqError}</ErrorMessage>}

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                disabled={savingFaqs}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveFaqConfiguration()}
                disabled={savingFaqs}
                className={buttonClass}
              >
                {savingFaqs ? "Saving..." : "Save FAQs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialized agent configuration */}
      {agentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-config-title"
        >
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <h2 id="agent-config-title" className="text-2xl font-bold">
              {isAgentSaved(agentModal) ? "Edit " : "Configure "}
              {AGENT_DETAILS[agentModal].title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {AGENT_DETAILS[agentModal].description}
            </p>

            <div className="mt-6">
              <label className="block">
                <span className="mb-1 block font-medium">
                  Agent description
                </span>
                <textarea
                  value={draftAgentDescription}
                  onChange={(event) =>
                    setDraftAgentDescription(event.target.value)
                  }
                  rows={4}
                  className={inputClass}
                  placeholder="Explain the agent's responsibility, the questions it should handle, which data or tools it should use, when it should be selected, and when it should hand off or decline a request. Be specific enough for the orchestrator to distinguish this agent from the others."
                />
                <span className="mt-1 block text-xs text-gray-500">
                  This description is intended to guide both agent selection
                  and the selected agent's task.
                </span>
              </label>

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Example queries</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Provide sample user questions and explain how this agent
                      should handle each one.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addExample}
                    disabled={savingAgent}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
                  >
                    Add example
                  </button>
                </div>

                {draftExamples.length === 0 && (
                  <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                    No examples added. Add a few representative queries to
                    help guide agent delegation.
                  </p>
                )}

                <div className="mt-3 space-y-4">
                  {draftExamples.map((example, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium">Example {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeExample(index)}
                          disabled={savingAgent}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">
                          Sample user query
                        </span>
                        <textarea
                          value={example.query}
                          onChange={(event) =>
                            updateExample(index, "query", event.target.value)
                          }
                          rows={2}
                          className={inputClass}
                          placeholder="For example: What is the warranty period for this product?"
                        />
                      </label>

                      <label className="mt-3 block">
                        <span className="mb-1 block text-sm font-medium">
                          Expected handling
                        </span>
                        <textarea
                          value={example.expected_handling}
                          onChange={(event) =>
                            updateExample(
                              index,
                              "expected_handling",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className={inputClass}
                          placeholder="Explain what this agent should do, which source or tool it should use, and what a good response should contain."
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {agentModal === "db_query" && (
                <div className="mt-6">
                  <label className="block">
                    <span className="mb-2 block font-medium">
                      Database connection URL
                    </span>
                    <textarea
                      value={draftDbUrl}
                      onChange={(event) => setDraftDbUrl(event.target.value)}
                      rows={3}
                      autoComplete="off"
                      className={inputClass}
                      placeholder="Enter the SQLAlchemy-compatible database connection URL for the database this agent is allowed to query."
                    />
                  </label>
                  <p className="mt-2 text-xs text-amber-700">
                    Connection URLs may contain credentials. Do not share them
                    publicly or commit them to source control.
                  </p>
                </div>
              )}

              {agentModal === "rag" && (
                <div className="mt-6">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="font-medium">Existing knowledge sources</p>
                    {config?.rag_sources?.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {config.rag_sources.map((source, index) => (
                          <li
                            key={
                              source.source_id ||
                              `${source.path_or_url}-${index}`
                            }
                          >
                            {source.filename ||
                              source.path_or_url ||
                              `Source ${index + 1}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        No knowledge sources are recorded yet.
                      </p>
                    )}
                  </div>

                  <label className="mt-5 block">
                    <span className="mb-2 block font-medium">
                      Upload additional documents
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.md,.csv,.json"
                      disabled={savingAgent}
                      onChange={(event) =>
                        setDocuments(event.target.files)
                      }
                      className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
                    />
                  </label>
                  <p className="mt-3 text-sm text-gray-500">
                    Existing documents are retained. Select additional
                    documents to upload and process them through your RAG
                    backend.
                  </p>
                </div>
              )}
            </div>

            {agentError && <ErrorMessage>{agentError}</ErrorMessage>}

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              {isAgentSaved(agentModal) && (
                <button
                  type="button"
                  onClick={handleDeleteDisabled}
                  disabled={savingAgent}
                  className="mr-auto rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                >
                  Delete (Disabled)
                </button>
              )}
              <button
                type="button"
                onClick={() => setAgentModal(null)}
                disabled={savingAgent}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveAgentConfiguration()}
                disabled={savingAgent}
                className={buttonClass}
              >
                {savingAgent
                  ? agentModal === "rag"
                    ? "Saving agent and uploading..."
                    : "Saving agent..."
                  : "Save Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateChatbot;
