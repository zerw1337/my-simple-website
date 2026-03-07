import { FaGithub, FaTelegramPlane, FaSteam, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

function Footer(){
    return (
        <footer className="footer" style={{paddingTop: "5rem"}}>
            <div className="social-icons">
                <a href="https://github.com/zerw1337" target="_blank" rel="noopener noreferrer">
                    <FaGithub size={28} />
                </a>
                <a href="https://t.me/glebus777" target="_blank" rel="noopener noreferrer">
                    <FaTelegramPlane size={28} />
                </a>
                <a href="https://steamcommunity.com/id/zerw1337" target="_blank" rel="noopener noreferrer">
                    <FaSteam size={28} />
                </a>
                <a href="mailto:ivanovgleb2011@gmail.com">
                    <FaEnvelope size={28} />
                </a>
            </div><br/>
            <p>Made with ❤️ by <a href="https://t.me/glebus777"> zerw1337</a>  © 2026.</p>
        </footer>
    )
}

export default Footer;