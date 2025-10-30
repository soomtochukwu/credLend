"use client"
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="cred-page flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <div className="logo-circle">
          <Image src="/assets/logo.png" alt="Credlend" width={88} height={88} />
        </div>

        <h1 className="mt-2 text-xl sm:text-3xl font-semibold text-white text-center">Welcome to Cred<span className='text-[#000000]'>Lend</span></h1>
        <div className="bouncy-dots" aria-hidden>
          <span></span><span></span><span></span>
        </div>

        <button onClick={() => router.push('/home')} className="mt-2 w-full max-w-xs sm:max-w-sm px-6 py-3 rounded-xl text-white font-semibold" style={{ background: '#0ea79b' }}>
          View Wallet
        </button>
      </div>
    </div>
  )
}
