import React from "react";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4">{children}</div>;
};
