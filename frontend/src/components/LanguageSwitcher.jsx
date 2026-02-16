import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const matchLanguage = {
        uz: { label: "O'zbek", flag: "🇺🇿" },
        ru: { label: "Русский", flag: "🇷🇺" },
        en: { label: "English", flag: "🇬🇧" }
    };

    const currentLang = matchLanguage[i18n.language] || matchLanguage.uz;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="language-dropdown" ref={dropdownRef}>
            <button
                className="lang-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="lang-code">{i18n.language.toUpperCase()}</span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="dropdown-menu glass">
                    {Object.keys(matchLanguage).map((lng) => (
                        <button
                            key={lng}
                            className={`dropdown-item ${i18n.language === lng ? 'active' : ''}`}
                            onClick={() => changeLanguage(lng)}
                        >
                            <span className="item-flag">{matchLanguage[lng].flag}</span>
                            <span className="item-label">{matchLanguage[lng].label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LanguageSwitcher;
