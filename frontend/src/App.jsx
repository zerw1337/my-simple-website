import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import './App.css';
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Footer from "./components/Footer.jsx";
import Post from "./pages/Post.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { AuthContext } from "./context/AuthContext";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import Banned from "./pages/Banned";
import ResetPassword from "./pages/ResetPassword";
import Messanger from "./pages/Messanger";

function getIsBanned() {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    try { return JSON.parse(atob(token.split(".")[1])).is_banned === true; } catch { return false; }
}

function BannedRoute({ children }) {
    const { isBanned, loading } = useContext(AuthContext);
    if (loading) return null;
    if (isBanned) return <Banned />;
    return children;
}

function GuestRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null;
    if (user) return <Navigate to="/" replace />;
    return children;
}

function App() {
    return (
        <Router>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Header />
                <Routes>
                    <Route path="/banned" element={<Banned />} />
                    <Route path="*" element={
                        <BannedRoute>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/posts/:id" element={<Post />} />
                                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/profile/:id" element={<Profile />} />
                                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/contact" element={<Contacts />} />
                                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                                <Route path="/reset-password/:url" element={<ResetPassword />} />
                                <Route path="/messages" element={<ProtectedRoute><Messanger /></ProtectedRoute>} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </BannedRoute>
                    } />
                </Routes>
                <Footer />
                <ScrollToTop />
            </div>
        </Router>
    );
}

export default App;