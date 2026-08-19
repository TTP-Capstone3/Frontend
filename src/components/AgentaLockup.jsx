import AgentaMark from './AgentaMark';

// The mark next to the wordmark. The wordmark is live text in Manrope, which
// index.html already loads, so it matches the rest of the app.
export default function AgentaLockup({ size = 26 }) {
  return (
    <span className='inline-flex items-center gap-2'>
      <AgentaMark size={size} />
      <span className='font-bold tracking-tight'>agenta</span>
    </span>
  );
}
