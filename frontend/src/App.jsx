import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />

            </Routes>
        </Router>
    );
}

export default App;