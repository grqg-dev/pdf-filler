interface SelectionBorderProps {
  children: React.ReactNode;
}

export function SelectionBorder({ children }: SelectionBorderProps) {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
    </div>
  );
}
