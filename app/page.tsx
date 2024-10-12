import Image from 'next/image'
import Link from 'next/link'
import ProductCard from './components/ProductCard/ProductCard'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/authOptions'
import countryside from '@/public/images/countryside.webp';
import { Metadata } from 'next';
import HeavyComponent from './components/HeavyComponent';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="relative h-screen">
      <h1 className="font-poppins">Hello { session && <span>{session.user!.name}</span> }</h1>
      <Link href="/users">Users</Link>
      <ProductCard /> 
      <HeavyComponent />
      {/* <Image src={countryside} alt="Countryside" /> */}
      {/* <Image src="https://bit.ly/react-cover" alt="Countryside" fill className="object-cover" sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" quality={100} priority/> */}
    </main>
  )
}

// export const metadata: Metadata = {
//   title: '...',
// }

// export async function generateMetadata(): Promise<Metadata> {
//   const product = await fetch('');

//   return {
//     title: product.title,
//     description: product.description
//   }
// }