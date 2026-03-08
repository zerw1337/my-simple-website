import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
    return (
        <Router>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/posts/:id" element={<Post />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile/:id" element={<Profile />} />
                </Routes>
                <Footer />
                <ScrollToTop />
            </div>
        </Router>
    );
}

export default App;