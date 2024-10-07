import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Navigate to either Register or Login</p>
      <Link href="/register">
         <button style={{ margin: '10px' }}>Go to Register</button>
      </Link>
      <Link href="/login">
         <button style={{ margin: '10px' }}>Go to Login</button>
      </Link>
    </div>
  );
}
