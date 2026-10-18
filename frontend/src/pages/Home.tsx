import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-800">
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-40 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl font-bold mb-4"
        >
          Empower Your Business with AI Chatbots
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mb-6 text-lg"
        >
          ChatKit.ai helps you engage customers, automate support, and scale communication effortlessly.
        </motion.p>
        <div className="space-x-4">
          <Link to="/get-started" className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100">
            Get Started
          </Link>
          <Link to="/create-chatbot" className="px-6 py-3 bg-indigo-800 text-white font-semibold rounded-lg shadow hover:bg-indigo-900">
            Configure Chatbot
          </Link>
        </div>
      </section>

      {/* Advantages Block */}
      <section className="py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-indigo-600">Why Choose ChatKit.ai?</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { title: "Boost Engagement", desc: "Deliver instant responses and keep customers connected 24/7.", icon: "💬" },
            { title: "Save Costs", desc: "Automate repetitive tasks and reduce support overhead.", icon: "💰" },
            { title: "Scale Easily", desc: "Handle thousands of conversations without breaking a sweat.", icon: "📈" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI & Agents Block */}
      <section className="py-20 px-6 bg-indigo-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">AI Agents in Business</h2>
        <p className="max-w-3xl mx-auto mb-6">
          Our intelligent agents integrate seamlessly into your workflows, powering customer support, sales, and analytics.
        </p>
        <motion.img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
          alt="AI Agents"
          className="mx-auto w-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        />
      </section>

      {/* Tools Block */}
      <section className="py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-indigo-600">Our Tools</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            { title: "FAQ Agent", desc: "Instant answers to common queries.", icon: "❓" },
            { title: "DB Query Agent", desc: "Query databases with natural language.", icon: "🗄️" },
            { title: "RAG Agent", desc: "Retrieve and generate accurate responses.", icon: "🤖" },
            { title: "Analytics", desc: "Track and optimize chatbot performance.", icon: "📊" },
          ].map((tool, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
            >
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold mb-2">{tool.title}</h3>
              <p>{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Us Block */}
      <section id="about-us" className="py-20 px-6 bg-indigo-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">About Us</h2>
        <p className="max-w-2xl mx-auto">
          At ChatKit.ai, we believe in empowering businesses with AI-driven communication tools that are simple, scalable, and effective.
        </p>
      </section>

      <Footer />
    </div>
  );
}
