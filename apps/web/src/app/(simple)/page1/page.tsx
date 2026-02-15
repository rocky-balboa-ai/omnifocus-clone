import Link from 'next/link';

export default function Page1() {
  return (
    <div style={{ padding: 40, color: 'white', background: '#111' }}>
      <h1>PAGE 1</h1>
      <Link href="/page2" style={{ color: '#8B5CF6', fontSize: 24 }}>
        Go to Page 2 →
      </Link>
    </div>
  );
}
