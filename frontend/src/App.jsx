import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Footer from "./components/Footer.jsx";
import Post from "./pages/Post.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/posts/:id"
                    element={
                        <ProtectedRoute>
                            <Post />
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<Login />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;