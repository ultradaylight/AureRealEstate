import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p>© {new Date().getFullYear()} AureRealEstate. All rights reserved.</p>
        <div className="footer__links">
          <a 
            href="https://github.com/ultradaylight" 
            className="footer__link" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
