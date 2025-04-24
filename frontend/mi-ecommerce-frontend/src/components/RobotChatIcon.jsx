const RobotChatIcon = ({ size = 200, showSpeechBubble = true }) => {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 hover:scale-105"
        aria-label="Robot Chat Icon"
      >
        {/* Speech bubble */}
        {showSpeechBubble && (
          <path
            d="M240 80C240 69.5066 231.493 61 221 61H180C169.507 61 161 69.5066 161 80V90C161 100.493 169.507 109 180 109H221C231.493 109 240 100.493 240 90V80Z"
            fill="#7FEEF3"
          />
        )}
  
        {/* Robot head - outer gradient */}
        <defs>
          <linearGradient id="headGradient" x1="150" y1="120" x2="150" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#A8E7F0" />
          </linearGradient>
        </defs>
        <path
          d="M210 180C210 213.137 183.137 240 150 240C116.863 240 90 213.137 90 180V160C90 126.863 116.863 100 150 100C183.137 100 210 126.863 210 160V180Z"
          fill="url(#headGradient)"
          stroke="#E0F7FA"
          strokeWidth="2"
        />
  
        {/* Robot ears */}
        <path d="M90 170C90 170 80 170 80 180C80 190 80 190 90 190" fill="#1A2E4C" />
        <path d="M210 170C210 170 220 170 220 180C220 190 220 190 210 190" fill="#1A2E4C" />
  
        {/* Robot face screen - dark background */}
        <defs>
          <linearGradient id="screenGradient" x1="150" y1="130" x2="150" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1A2E4C" />
            <stop offset="1" stopColor="#0D1B2A" />
          </linearGradient>
        </defs>
        <path
          d="M190 170C190 190.987 172.091 208 150 208C127.909 208 110 190.987 110 170V160C110 139.013 127.909 122 150 122C172.091 122 190 139.013 190 160V170Z"
          fill="url(#screenGradient)"
        />
  
        {/* Robot eyes with blinking animation */}
        <g className="eyes-group">
          <ellipse 
            cx="130" 
            cy="165" 
            rx="12" 
            ry="20" 
            fill="#7FEEF3" 
            className="animate-blink"
            style={{ animationDelay: '0.5s' }}
          />
          <ellipse 
            cx="170" 
            cy="165" 
            rx="12" 
            ry="20" 
            fill="#7FEEF3" 
            className="animate-blink"
            style={{ animationDelay: '0.5s' }}
          />
        </g>
  
        {/* Robot sensor/camera */}
        <circle cx="150" cy="115" r="5" fill="#1A2E4C" />
  
        {/* Subtle highlight line across screen */}
        <path
          d="M115 145C115 145 130 155 150 155C170 155 185 145 185 145"
          stroke="#2A4C76"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
}

export default RobotChatIcon;