import { useApp } from '../../hooks/useApp';

export default function LoadingIndicator() {
  const { loading } = useApp();
  if (!loading) return null;

  return (
    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>
      Processing database request...
    </div>
  );
}
