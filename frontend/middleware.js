import { NextResponse } from 'next/server';

export function middleware(request) {
  if(request.nextUrl.pathname.startsWith('/api')) {
    let apiUrl = process.env.API_URL && process.env.API_URL != '' ? process.env.API_URL : 'http://127.0.0.1:3010';
    
    let newUrl = new URL(request.nextUrl.pathname.replace(/^\/api/, '') +
                    request.nextUrl.search,
                  apiUrl);
    return NextResponse.rewrite(newUrl);
  }
}
