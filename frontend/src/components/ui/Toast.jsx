import { useApp } from '../../hooks/useApp';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className={`alert-popup alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  );
}
