"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { BsCheckLg } from 'react-icons/bs'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'react-hot-toast'

export default function SignupPage() {
	const router = useRouter()
	const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' })
	const [loading, setLoading] = useState(false)
	const [show, setShow] = useState(false)
	const [agree, setAgree] = useState(false)

	async function handleSubmit(e) {
		e.preventDefault()
		
		// Validation
		if (form.password !== form.confirm_password) {
			return toast.error('Passwords do not match')
		}
		
		if (!agree) {
			return toast.error('Please agree to the Terms of Service and Privacy Policy')
		}

		setLoading(true)
		try {
			const payload = {
				first_name: form.first_name,
				last_name: form.last_name,
				email: form.email,
				password1: form.password,
				password2: form.confirm_password
			}

			const res = await fetch('https://credlend.pythonanywhere.com/api/users/auth/signup/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})

			const data = await res.json()
			
			if (res.ok) {
				// ✅ SUCCESS: Store tokens and redirect
				console.log('Signup response:', data) // Debug log
				
				// Check for tokens in different possible response formats
				const accessToken = data.tokens?.access || data.access || data.access_token
				const refreshToken = data.tokens?.refresh || data.refresh || data.refresh_token
				
				if (accessToken) {
					// Store tokens in localStorage
					localStorage.setItem('accessToken', accessToken)
					if (refreshToken) {
						localStorage.setItem('refreshToken', refreshToken)
					}
					
					toast.success('Account created successfully!')
					router.push('/welcome')
				} else {
					// If no tokens in signup response, try to auto-login
					await attemptAutoLogin(form.email, form.password)
				}
			} else {
				// Handle different error formats
				const errorMessage = data.detail || 
								   data.email?.[0] || 
								   data.password1?.[0] || 
								   data.password2?.[0] ||
								   data.non_field_errors?.[0] ||
								   'Signup failed. Please try again.'
				toast.error(errorMessage)
			}
		} catch (err) {
			console.error('Signup error:', err)
			toast.error('Network error. Please check your connection.')
		} finally { 
			setLoading(false) 
		}
	}

	// Auto-login function if tokens not provided in signup response
	const attemptAutoLogin = async (email, password) => {
		try {
			const loginRes = await fetch('https://credlend.pythonanywhere.com/api/users/auth/login/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			})

			const loginData = await loginRes.json()
			
			if (loginRes.ok) {
				// Store tokens from login response
				const accessToken = loginData.tokens?.access || loginData.access || loginData.access_token
				const refreshToken = loginData.tokens?.refresh || loginData.refresh || loginData.refresh_token
				
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken)
					if (refreshToken) {
						localStorage.setItem('refreshToken', refreshToken)
					}
					
					toast.success('Account created and logged in successfully!')
					router.push('/welcome')
				} else {
					// If still no tokens, redirect to login
					toast.success('Account created! Please log in.')
					router.push('/login')
				}
			} else {
				// If auto-login fails, redirect to login page
				toast.success('Account created! Please log in.')
				router.push('/login')
			}
		} catch (loginError) {
			console.error('Auto-login error:', loginError)
			toast.success('Account created! Please log in.')
			router.push('/login')
		}
	}

	return (
		<div className="min-h-screen bg-[#fbfbf9] px-4 pt-10 relative">
			<div className="w-full max-w-md mx-auto">

				<h1 className="text-2xl font-semibold text-gray-900 mt-6 sm:mt-0">Sign Up</h1>
				<p className="text-sm text-gray-500 mt-1">It only takes a minute to create your account</p>

				<div className="mt-4 px-4 py-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<input 
								required
								placeholder="First Name" 
								value={form.first_name} 
								onChange={e => setForm(s => ({ ...s, first_name: e.target.value }))} 
								className="rounded-lg border border-gray-200 p-3 text-sm h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent" 
							/>
							<input 
								required
								placeholder="Last Name" 
								value={form.last_name} 
								onChange={e => setForm(s => ({ ...s, last_name: e.target.value }))} 
								className="rounded-lg border border-gray-200 p-3 text-sm h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent" 
							/>
						</div>

						<div>
							<input 
								required 
								value={form.email} 
								onChange={e => setForm(s => ({ ...s, email: e.target.value }))} 
								type="email" 
								placeholder="Email address" 
								className="w-full rounded-lg border border-gray-200 p-4 text-sm h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent" 
							/>
						</div>

						<div>
							<div className="relative">
								<input 
									required 
									value={form.password} 
									onChange={e => setForm(s => ({ ...s, password: e.target.value }))} 
									type={show ? 'text' : 'password'} 
									placeholder="Password" 
									className="w-full rounded-lg border border-gray-200 p-4 text-sm pr-12 h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent" 
								/>
								<button 
									type="button" 
									onClick={() => setShow(s => !s)} 
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
								>
									{show ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
								</button>
							</div>
						</div>

						<div>
							<input 
								required 
								value={form.confirm_password} 
								onChange={e => setForm(s => ({ ...s, confirm_password: e.target.value }))} 
								type={show ? 'text' : 'password'} 
								placeholder="Confirm password" 
								className="w-full rounded-lg border border-gray-200 p-4 text-sm h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--cred-teal)] focus:border-transparent" 
							/>
						</div>

						{/* ✅ Terms Section */}
						<div className="flex items-start gap-3">
							<button
								type="button"
								onClick={() => setAgree(a => !a)}
								className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
									agree 
										? 'bg-[var(--cred-teal)] border-[var(--cred-teal)]' 
										: 'border-gray-300 bg-white'
								}`}
							>
								{agree ? <BsCheckLg size={12} color="#fff" /> : null}
							</button>
							<div className="text-sm text-gray-600 flex-1">
								I agree to the{" "}
								<button
									type="button"
									onClick={() => router.push('/policy')}
									className="text-[var(--cred-teal)] underline hover:text-teal-700"
								>
									Terms of Service
								</button>{" "}
								and{" "}
								<button
									type="button"
									onClick={() => router.push('/policy')}
									className="text-[var(--cred-teal)] underline hover:text-teal-700"
								>
									Privacy Policy
								</button>
							</div>
						</div>

						<button
							disabled={loading || !agree}
							className="w-full mt-2 rounded-lg py-4 text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
							style={{ 
								background: 'linear-gradient(180deg, #14B9B5 0%, #0ea79b 100%)',
								transform: loading ? 'scale(0.98)' : 'scale(1)'
							}}
						>
							{loading ? (
								<div className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Creating Account...
								</div>
							) : (
								'Create Account'
							)}
						</button>

						<div className="flex items-center my-2">
							<div className="flex-1 h-px bg-gray-200" />
							<div className="px-3 text-xs text-gray-400">OR</div>
							<div className="flex-1 h-px bg-gray-200" />
						</div>

						<button 
							type="button" 
							className="w-full border border-[var(--cred-teal)] rounded-xl py-3 flex items-center justify-center gap-3 text-sm hover:bg-gray-50 transition-colors"
						>
							<FcGoogle size={20} />
							Continue with Google
						</button>

						<div className="text-center mt-6 text-sm text-gray-500">
							Already registered?{" "}
							<button
								type="button"
								className="text-[var(--cred-teal)] underline hover:text-teal-700"
								onClick={() => router.push('/login')}
							>
								Sign In
							</button>
						</div>
					</form>

					<div className="mt-6 text-center text-xs text-gray-400">
						By creating an account you agree to our terms.
					</div>
				</div>
			</div>
		</div>
	)
}