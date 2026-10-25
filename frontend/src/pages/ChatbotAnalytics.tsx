
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api_service";
// import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Overview = {
  total_conversations: number;
  total_messages: number;
  user_messages: number;
  unique_visitors: number;
  average_messages_per_conversation: number;
  total_events: number;
  average_response_time_ms: number;
  success_events: number;
  fallback_events: number;
  error_events: number;
};

type ActivityItem = {
  date: string;
  conversations: number;
};

type Performance = {
  success: number;
  fallback: number;
  error: number;
  unknown: number;
  average_response_time_ms: number;
  max_response_time_ms: number;
};

type AgentItem = {
  agent_name?: string;
  name?: string;
  calls?: number;
  usage_count?: number;
  average_response_time_ms?: number;
  errors?: number;
};

type Knowledge = {
  events: number;
  faq_matches: number;
  faq_misses: number;
  faq_unknown: number;
  rag_zero_results: number;
  rag_searches_with_count: number;
  rag_results_total: number;
};

type Conversation = {
  chat_id: string;
  user_id?: string;
  created_at?: string;
  last_activity_at?: string;
  message_count: number;
  user_message_count: number;
  average_response_time_ms?: number | null;
  status?: string;
};

type ConversationPage = {
  items: Conversation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type Message = {
  sender: string;
  text: string;
  timestamp?: string;
};

type ConversationDetail = {
  chat_id: string;
  tenant_id?: string;
  user_id?: string;
  user_info?: Record<string, unknown>;
  messages: Message[];
  analytics_events?: Array<{
    event_id?: string;
    timestamp?: string;
    status?: string;
    response_time_ms?: number;
    agent_names?: string[];
    faq_matched?: boolean | null;
    rag_results_count?: number | null;
    error_type?: string | null;
  }>;
  created_at?: string;
  last_activity_at?: string;
};

const EMPTY_OVERVIEW: Overview = {
  total_conversations: 0,
  total_messages: 0,
  user_messages: 0,
  unique_visitors: 0,
  average_messages_per_conversation: 0,
  total_events: 0,
  average_response_time_ms: 0,
  success_events: 0,
  fallback_events: 0,
  error_events: 0,
};

const EMPTY_PERFORMANCE: Performance = {
  success: 0,
  fallback: 0,
  error: 0,
  unknown: 0,
  average_response_time_ms: 0,
  max_response_time_ms: 0,
};

const EMPTY_KNOWLEDGE: Knowledge = {
  events: 0,
  faq_matches: 0,
  faq_misses: 0,
  faq_unknown: 0,
  rag_zero_results: 0,
  rag_searches_with_count: 0,
  rag_results_total: 0,
};

const numberFormat = new Intl.NumberFormat("en-IN");

function formatNumber(value?: number | null): string {
  return numberFormat.format(value ?? 0);
}

function formatDuration(value?: number | null): string {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }

  return `${Math.round(value)} ms`;
}

// function formatDate(value?: string): string {
//   if (!value) return "—";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

function formatDateTime(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClasses(status?: string): string {
  switch (status?.toLowerCase()) {
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "fallback":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "error":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-500/20";
  }
}

function StatCard({
  label,
  value,
  detail,
  icon,
  iconClass = "bg-indigo-50 text-indigo-600",
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  iconClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-500">{detail}</p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-500">
        ◌
      </div>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function ConversationModal({
  detail,
  loading,
  error,
  onClose,
}: {
  detail: ConversationDetail | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  if (!detail && !loading && !error) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-modal-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="conversation-modal-title"
              className="text-lg font-bold text-gray-900"
            >
              Conversation details
            </h2>
            <p className="mt-1 truncate text-xs text-gray-500">
              {detail?.chat_id ?? "Loading conversation…"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close conversation details"
            className="rounded-lg px-3 py-2 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {loading && (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading conversation…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Started</p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {formatDateTime(detail.created_at)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Last activity</p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {formatDateTime(detail.last_activity_at)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Messages</p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {formatNumber(detail.messages?.length ?? 0)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-semibold text-gray-900">
                  Conversation transcript
                </h3>

                {detail.messages?.length ? (
                  <div className="space-y-4">
                    {detail.messages.map((message, index) => {
                      const isUser =
                        message.sender?.toLowerCase() === "user";

                      return (
                        <div
                          key={`${index}-${message.sender}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                              isUser
                                ? "rounded-br-md bg-indigo-600 text-white"
                                : "rounded-bl-md border border-gray-100 bg-gray-50 text-gray-800"
                            }`}
                          >
                            <p
                              className={`mb-1 text-xs font-semibold ${
                                isUser ? "text-indigo-100" : "text-gray-500"
                              }`}
                            >
                              {isUser ? "Visitor" : message.sender || "Bot"}
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.text}
                            </p>
                            {message.timestamp && (
                              <p
                                className={`mt-2 text-[11px] ${
                                  isUser ? "text-indigo-100" : "text-gray-400"
                                }`}
                              >
                                {formatDateTime(message.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No messages found"
                    description="This conversation has no transcript messages."
                  />
                )}
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Recorded analytics events
                </h3>
                {detail.analytics_events?.length ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Timestamp</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Response time</th>
                          <th className="px-4 py-3 font-medium">RAG results</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detail.analytics_events.map((event, index) => (
                          <tr key={event.event_id ?? index}>
                            <td className="px-4 py-3 text-gray-600">
                              {formatDateTime(event.timestamp)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(event.status)}`}
                              >
                                {event.status ?? "unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDuration(event.response_time_ms)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {event.rag_results_count == null
                                ? "Unknown"
                                : event.rag_results_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No analytics events are recorded for this conversation.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatbotAnalytics() {
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [performance, setPerformance] =
    useState<Performance>(EMPTY_PERFORMANCE);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge>(EMPTY_KNOWLEDGE);
  const [conversations, setConversations] = useState<ConversationPage>({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [
        overviewResponse,
        activityResponse,
        performanceResponse,
        agentsResponse,
        knowledgeResponse,
      ] = await Promise.all([
        api.get<Overview>("/analytics/overview"),
        api.get<ActivityItem[]>("/analytics/activity"),
        api.get<Performance>("/analytics/performance"),
        api.get<AgentItem[]>("/analytics/agents"),
        api.get<Knowledge>("/analytics/knowledge"),
      ]);

      setOverview({ ...EMPTY_OVERVIEW, ...overviewResponse.data });
      setActivity(Array.isArray(activityResponse.data) ? activityResponse.data : []);
      setPerformance({
        ...EMPTY_PERFORMANCE,
        ...performanceResponse.data,
      });
      setAgents(Array.isArray(agentsResponse.data) ? agentsResponse.data : []);
      setKnowledge({ ...EMPTY_KNOWLEDGE, ...knowledgeResponse.data });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String(
              (err as { response?: { data?: { detail?: string } } }).response
                ?.data?.detail ?? "Unable to load analytics data."
            )
          : "Unable to load analytics data. Check your connection and sign-in status.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get<ConversationPage>(
        "/analytics/conversations",
        {
          params: {
            page,
            page_size: 20,
            ...(selectedStatus !== "all" ? { status: selectedStatus } : {}),
          },
        }
      );

      setConversations({
        items: response.data.items ?? [],
        total: response.data.total ?? 0,
        page: response.data.page ?? page,
        page_size: response.data.page_size ?? 20,
        total_pages: response.data.total_pages ?? 0,
      });
    } catch {
      setConversations({
        items: [],
        total: 0,
        page,
        page_size: 20,
        total_pages: 0,
      });
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const visibleConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations.items;

    return conversations.items.filter((conversation) =>
      [
        conversation.chat_id,
        conversation.user_id,
        conversation.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [conversations.items, search]);

  const maxActivity = Math.max(
    1,
    ...activity.map((item) => item.conversations ?? 0)
  );

  const activityTotal = activity.reduce(
    (sum, item) => sum + (item.conversations ?? 0),
    0
  );

  const statusTotal =
    performance.success +
    performance.fallback +
    performance.error +
    performance.unknown;

  const closeConversation = () => {
    setSelectedConversation(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const openConversation = async (chatId: string) => {
    setSelectedConversation(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await api.get<ConversationDetail>(
        `/analytics/conversations/${encodeURIComponent(chatId)}`
      );
      setSelectedConversation(response.data);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String(
              (err as { response?: { data?: { detail?: string } } }).response
                ?.data?.detail ?? "Unable to load this conversation."
            )
          : "Unable to load this conversation. Please try again.";

      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);

    try {
      const response = await api.get("/analytics/export", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "chatkit-analytics.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.alert(
        "CSV export failed. Please check your sign-in status and try again."
      );
    } finally {
      setExporting(false);
    }
  };

  const isEmpty =
    !loading &&
    !error &&
    overview.total_conversations === 0 &&
    overview.total_events === 0;

  return (
    
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              ChatKit.ai workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Chatbot Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Monitor conversations, chatbot performance, knowledge retrieval,
              and visitor activity in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadDashboard(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{refreshing ? "↻" : "⟳"}</span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>↓</span>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-rose-800">
                Could not load analytics
              </p>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => void loadDashboard(true)}
              className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="h-80 animate-pulse rounded-2xl bg-white" />
              <div className="h-80 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        ) : (
          <>
            {isEmpty && (
              <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="font-semibold text-indigo-900">
                  Your analytics workspace is ready
                </p>
                <p className="mt-1 text-sm leading-6 text-indigo-800">
                  No conversation activity has been recorded yet. Once visitors
                  start chatting with your widget, their recorded activity will
                  appear here.
                </p>
              </div>
            )}

            <section className="mb-9">
              <SectionTitle
                title="Overview"
                description="A snapshot of your chatbot's recorded activity."
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total conversations"
                  value={formatNumber(overview.total_conversations)}
                  detail="Conversation sessions created"
                  icon="▤"
                />
                <StatCard
                  label="Total messages"
                  value={formatNumber(overview.total_messages)}
                  detail={`${formatNumber(overview.user_messages)} visitor messages`}
                  icon="☰"
                  iconClass="bg-sky-50 text-sky-600"
                />
                <StatCard
                  label="Unique visitors"
                  value={formatNumber(overview.unique_visitors)}
                  detail="Distinct visitor IDs in recorded sessions"
                  icon="♙"
                  iconClass="bg-violet-50 text-violet-600"
                />
                <StatCard
                  label="Average response time"
                  value={formatDuration(overview.average_response_time_ms)}
                  detail={`${formatNumber(overview.total_events)} recorded response events`}
                  icon="◷"
                  iconClass="bg-amber-50 text-amber-600"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Average messages per conversation
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {Number(
                      overview.average_messages_per_conversation ?? 0
                    ).toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Successful processing events
                  </p>
                  <p className="mt-2 text-xl font-bold text-emerald-600">
                    {formatNumber(overview.success_events)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Fallback / error events</p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {formatNumber(overview.fallback_events)}{" "}
                    <span className="font-normal text-gray-300">/</span>{" "}
                    {formatNumber(overview.error_events)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-9">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
                  <SectionTitle
                    title="Conversation activity"
                    description="Conversations grouped by date returned by your API."
                    action={
                      <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                        {formatNumber(activityTotal)} total in series
                      </span>
                    }
                  />

                  {activity.length === 0 ? (
                    <EmptyState
                      title="No activity data yet"
                      description="Daily conversation activity will appear here once sessions are recorded."
                    />
                  ) : (
                    <div className="pt-2">
                      <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-0 sm:gap-4">
                        {activity.map((item) => {
                          const height = Math.max(
                            5,
                            ((item.conversations ?? 0) / maxActivity) * 100
                          );

                          return (
                            <div
                              key={item.date}
                              className="flex h-full min-w-[42px] flex-1 flex-col items-center justify-end gap-2"
                              title={`${item.date}: ${item.conversations} conversations`}
                            >
                              <span className="text-xs font-semibold text-gray-700">
                                {item.conversations}
                              </span>
                              <div className="flex h-[72%] w-full items-end justify-center">
                                <div
                                  className="w-full max-w-12 rounded-t-lg bg-indigo-500 transition-all hover:bg-indigo-600"
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {activity.map((item) => (
                          <div
                            key={item.date}
                            className="min-w-[42px] flex-1 text-center text-[10px] text-gray-400 sm:text-xs"
                          >
                            {item.date.slice(5)}
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 text-xs text-gray-400">
                        Dates are shown as returned by the backend. This chart
                        does not fill in dates that have no returned records.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                  <SectionTitle
                    title="Response performance"
                    description="Recorded event status breakdown."
                  />

                  {statusTotal === 0 ? (
                    <EmptyState
                      title="No response events yet"
                      description="Status and latency statistics will appear when events are recorded."
                    />
                  ) : (
                    <>
                      <div className="space-y-5">
                        {[
                          {
                            label: "Success",
                            value: performance.success,
                            color: "bg-emerald-500",
                          },
                          {
                            label: "Fallback",
                            value: performance.fallback,
                            color: "bg-amber-400",
                          },
                          {
                            label: "Error",
                            value: performance.error,
                            color: "bg-rose-500",
                          },
                          {
                            label: "Unknown",
                            value: performance.unknown,
                            color: "bg-gray-400",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-600">
                                {item.label}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {item.value}{" "}
                                <span className="font-normal text-gray-400">
                                  (
                                  {Math.round(
                                    (item.value / statusTotal) * 100
                                  )}
                                  %)
                                </span>
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all ${item.color}`}
                                style={{
                                  width: `${(item.value / statusTotal) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">
                            Average response
                          </p>
                          <p className="mt-2 text-lg font-bold text-gray-900">
                            {formatDuration(
                              performance.average_response_time_ms
                            )}
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">
                            Maximum response
                          </p>
                          <p className="mt-2 text-lg font-bold text-gray-900">
                            {formatDuration(performance.max_response_time_ms)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <p className="mt-4 text-xs leading-5 text-gray-400">
                    A successful event means processing completed; it does not
                    independently verify answer correctness.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-9">
              <SectionTitle
                title="Agents & knowledge"
                description="Agent usage and knowledge retrieval based on recorded events."
              />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="font-bold text-gray-900">Agent usage</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Agent activity returned by the backend.
                  </p>

                  {agents.length === 0 ? (
                    <EmptyState
                      title="No agent usage recorded"
                      description="This may mean no agent activity has been recorded yet. Confirm that the orchestrator emits agent analytics when agents run."
                    />
                  ) : (
                    <div className="mt-5 space-y-3">
                      {agents.map((agent, index) => (
                        <div
                          key={`${agent.agent_name ?? agent.name ?? "agent"}-${index}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-800">
                              {agent.agent_name ?? agent.name ?? "Unnamed agent"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatNumber(
                                agent.calls ?? agent.usage_count ?? 0
                              )}{" "}
                              recorded calls
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              {formatDuration(agent.average_response_time_ms)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatNumber(agent.errors ?? 0)} errors
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="font-bold text-gray-900">
                    FAQ & RAG knowledge
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Recorded FAQ tracking and retrieval results.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-800">
                        FAQ matches
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {formatNumber(knowledge.faq_matches)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-4">
                      <p className="text-sm text-rose-800">FAQ misses</p>
                      <p className="mt-2 text-2xl font-bold text-rose-700">
                        {formatNumber(knowledge.faq_misses)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">FAQ unknown</p>
                      <p className="mt-2 text-2xl font-bold text-gray-800">
                        {formatNumber(knowledge.faq_unknown)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-sm text-amber-800">
                        RAG searches with zero results
                      </p>
                      <p className="mt-2 text-2xl font-bold text-amber-700">
                        {formatNumber(knowledge.rag_zero_results)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">
                        Total retrieved RAG results
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatNumber(knowledge.rag_results_total)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">
                        Events with knowledge tracking
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatNumber(knowledge.events)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">
                        RAG searches with result count
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatNumber(knowledge.rag_searches_with_count)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-gray-400">
                    Unknown FAQ status is not counted as a miss. RAG result
                    counts describe retrieval activity, not answer quality.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5 sm:p-6">
                <SectionTitle
                  title="Conversation explorer"
                  description="Find a session and inspect its recorded transcript."
                  action={
                    <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      {formatNumber(conversations.total)} conversations
                    </span>
                  }
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ⌕
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search this page by conversation or visitor ID…"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(event) => {
                      setPage(1);
                      setSelectedStatus(event.target.value);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    aria-label="Filter conversations by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="success">Success</option>
                    <option value="fallback">Fallback</option>
                    <option value="error">Error</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Search filters the currently loaded page. Status filtering is
                  sent to the backend.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead className="bg-gray-50">
                    <tr className="text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-4 font-semibold">
                        Conversation
                      </th>
                      <th className="px-5 py-4 font-semibold">Started</th>
                      <th className="px-5 py-4 font-semibold">Messages</th>
                      <th className="px-5 py-4 font-semibold">
                        Avg. response
                      </th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleConversations.map((conversation) => (
                      <tr
                        key={conversation.chat_id}
                        className="transition hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">
                            {conversation.chat_id.slice(0, 13)}…
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Visitor:{" "}
                            {conversation.user_id
                              ? `${conversation.user_id.slice(0, 8)}…`
                              : "Unknown"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDateTime(conversation.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {formatNumber(conversation.message_count)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatNumber(conversation.user_message_count)}{" "}
                            visitor
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatDuration(
                            conversation.average_response_time_ms
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(conversation.status)}`}
                          >
                            {conversation.status ?? "unknown"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              void openConversation(conversation.chat_id)
                            }
                            className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {visibleConversations.length === 0 && (
                  <EmptyState
                    title={
                      conversations.items.length === 0
                        ? "No conversations found"
                        : "No matching conversations"
                    }
                    description={
                      conversations.items.length === 0
                        ? "Conversations will appear here after visitors start chatting with your widget."
                        : "Try a different search term or change the status filter."
                    }
                  />
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {conversations.page || page} of{" "}
                  {Math.max(1, conversations.total_pages)} ·{" "}
                  {formatNumber(conversations.total)} total
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={
                      page >= conversations.total_pages ||
                      conversations.total_pages === 0
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(conversations.total_pages, current + 1)
                      )
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <p className="mt-6 text-center text-xs text-gray-400">
              ChatKit.ai Analytics · Metrics reflect the data currently
              recorded by your backend.
            </p>
          </>
        )}
      </main>
        <Footer />
        
      <ConversationModal
        detail={selectedConversation}
        loading={detailLoading}
        error={detailError}
        onClose={closeConversation}
      />
    </div>
  );
}
