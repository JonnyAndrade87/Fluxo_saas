import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse flex flex-col gap-4 w-full h-40 bg-slate-50 rounded-2xl"></div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}
