import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'BRIDGE — Your Abu Dhabi',description:'Find places, people and a first-week plan that fit your household in Abu Dhabi.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
