'use client'

import { Suspense } from 'react'
import AuthForm from './component/auth-form'



export default function SignInPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
