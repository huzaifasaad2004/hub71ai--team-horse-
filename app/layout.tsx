import type { Metadata } from 'next';
import './globals.css';
import './chapter.css';
export const metadata:Metadata={title:'BRIDGE — Your Abu Dhabi',description:'Moving to Abu Dhabi? Help your partner find a career and friends, and your children feel at home. A personal plan for every person.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
