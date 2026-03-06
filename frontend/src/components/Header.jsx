import { FaUser, FaSignInAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function Header() {
    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1rem",
            }}
        >
            <span className="logo">
                <Link to="/">zerw1337's website</Link>
            </span>

            <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <Link to="/">Домой</Link>
                <Link to="/blog">Блог</Link>
                <Link to="/about">О себе</Link>
                <Link to="/contact">Контакты</Link>

                <Link to="/login" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <FaSignInAlt /> Login
                </Link>
                <Link to="/register" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <FaUser /> Register
                </Link>
            </nav>
        </header>
    );
}

export default Header;