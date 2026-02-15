import Link from 'next/link';

export default function Page2() {
  return (
    <div style={{ padding: 40, color: 'white', background: '#111' }}>
      <h1>PAGE 2</h1>
      <Link href="/page1" style={{ color: '#8B5CF6', fontSize: 24 }}>
        ← Go to Page 1
      </Link>
    </div>
  );
}
