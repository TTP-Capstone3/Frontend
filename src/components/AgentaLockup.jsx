import AgentaMark from './AgentaMark';

// The mark next to the wordmark. The wordmark is live text in Manrope, which
// index.html already loads, so it matches the rest of the app.
export default function AgentaLockup({ size = 50, animated = false }) {
  return (
    <span className='inline-flex items-center gap-2'>
      <AgentaMark size={size} animated={animated} />
      {/* Hidden at phone widths so the navbar keeps just the mark. */}
      <span className='font-bold tracking-tight max-[480px]:hidden'>agenta</span>
    </span>
  );
}
