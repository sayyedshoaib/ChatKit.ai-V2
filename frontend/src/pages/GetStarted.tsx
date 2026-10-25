
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    number: "01",
    title: "Create your chatbot",
    description:
      "Set up your chatbot with a name, welcome message, description, and custom instructions.",
    icon: "🤖",
    action: "Create Chatbot",
    path: "/create-chatbot",
  },
  {
    number: "02",
    title: "Configure your agents",
    description:
      "Add FAQ agents, connect your database, and configure the knowledge your chatbot can use.",
    icon: "⚙️",
    action: "Configure Agents",
    path: "/create-chatbot",
  },
  {
    number: "03",
    title: "Integrate your widget",
    description:
      "Get your integration script and add your ChatKit.ai chatbot to your website.",
    icon: "💻",
    action: "View Chatbot Setup",
    path: "/create-chatbot",
  },
  {
    number: "04",
    title: "Track performance",
    description:
      "Review conversations, response times, chatbot activity, and available analytics.",
    icon: "📊",
    action: "View Analytics",
    path: "/analytics",
  },
];

function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 px-6 py-16 text-white sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative mx-auto max-w-6xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              Your chatbot journey starts here
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Let's build your
              <span className="block text-indigo-200">
                AI chatbot.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
              Welcome to ChatKit.ai! Follow these simple steps to create,
              customize, and integrate an AI chatbot for your business.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/create-chatbot")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Create Your Chatbot
                <span aria-hidden="true">→</span>
              </button>

              <button
                onClick={() => navigate("/analytics")}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/20"
              >
                Explore Analytics
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-indigo-100">
              <span className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                Simple setup
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                Customizable agents
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-300">✓</span>
                Website integration
              </span>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="px-6 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                  Getting started
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Everything you need to launch
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                  Follow the steps below to get your chatbot ready for your
                  website.
                </p>
              </div>

              <span className="w-fit rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                4 simple steps
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-7"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                      {step.icon}
                    </div>
                    <span className="text-sm font-bold tracking-widest text-gray-300">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-3 min-h-[72px] leading-6 text-gray-600">
                    {step.description}
                  </p>

                  <button
                    onClick={() => navigate(step.path)}
                    className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 transition group-hover:gap-3 hover:text-indigo-800"
                  >
                    {step.action}
                    <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Help banner */}
        <section className="px-6 pb-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Ready to get started?
              </h2>
              <p className="mt-2 max-w-2xl leading-6 text-gray-600">
                Start by creating your chatbot. You can configure its behavior
                and agents next.
              </p>
            </div>

            <button
              onClick={() => navigate("/create-chatbot")}
              className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Get Started Now →
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default GetStarted;
