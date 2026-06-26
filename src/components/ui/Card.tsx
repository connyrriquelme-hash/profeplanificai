const variantStyles: Record<string, string> = {
  default:
    'bg-white border border-gray-200/80 shadow-sm',
  glass:
    'bg-white/70 backdrop-blur-md border border-white/80 shadow-sm',
  elevated:
    'bg-white border border-gray-100 shadow-md shadow-gray-200/50',
  interactive:
    'bg-white border border-gray-200/80 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-300/80 transition-all duration-200',
  gradient:
    'bg-white border border-transparent shadow-sm',
};

interface CardProps {
  variant?: keyof typeof variantStyles;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Card({ variant = 'default', className = '', children, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      className={`rounded-2xl p-5 transition-all duration-200 ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Component>
  );
}
