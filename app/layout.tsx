import './globals.css'; import {ReactNode} from 'react'; import {Nav} from '@/components/nav';
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body><Nav/><main className="mx-auto max-w-7xl p-6">{children}</main></body></html>}
