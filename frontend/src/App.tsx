import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import CreateChatbot from "./pages/CreateChatbot";
import ChatbotAnalytics from "./pages/ChatbotAnalytics";
import GetStarted from "./pages/GetStarted";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "./services/api_service";
import { JSX } from "react/jsx-runtime";
import { AuthProvider } from "./AuthContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/" replace />; // redirect to Sign In
  }
  return children;
}


function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        {/* Default landing page */}
        <Route path="/" element={<SignIn />} />

        {/* Other routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create-chatbot" element={<ProtectedRoute><CreateChatbot /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><ChatbotAnalytics /></ProtectedRoute>} />
        <Route path="/get-started" element={<ProtectedRoute><GetStarted /></ProtectedRoute>} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
