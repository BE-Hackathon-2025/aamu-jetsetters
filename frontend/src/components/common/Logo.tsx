import './Logo.css';
import sentraIcon from '../../assets/sentra_icon.png';
import sentraLogo from '../../assets/sentra_logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  useFullLogo?: boolean;
}

function Logo({ size = 'medium', showText = true, useFullLogo = false }: LogoProps) {
  if (useFullLogo) {
    return (
      <div className={`logo-component ${size} full-logo`}>
        <img src={sentraLogo} alt="Sentra" className="logo-image-full" />
      </div>
    );
  }

  return (
    <div className={`logo-component ${size}`}>
      <div className="logo-image-container">
        <img src={sentraIcon} alt="Sentra" className="logo-image" />
      </div>
      {showText && <span className="logo-text">Sentra</span>}
    </div>
  );
}

export default Logo;

