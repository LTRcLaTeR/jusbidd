import React from 'react';

const Niga = () => {
  return (
    <div style={{ backgroundColor: 'black', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <img 
        src="https://via.placeholder.com/200x300/8B4513/FFFFFF?text=Dark+Skinned+Person" 
        alt="Dark Skinned Person" 
        style={{ 
          animation: 'bounce 2s infinite',
          width: '200px',
          height: '300px'
        }} 
      />
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-30px);
            }
            60% {
              transform: translateY(-15px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Niga;