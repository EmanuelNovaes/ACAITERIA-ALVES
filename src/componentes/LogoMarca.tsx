import React from 'react';

interface PropriedadesLogoMarca {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'white';
}

export const LogoMarca: React.FC<PropriedadesLogoMarca> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-20',
    md: 'h-24',
    lg: 'h-28',
    xl: 'h-32',
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src="/logo.webp"
        alt="Açaiteria Alves"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
};
