import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Basic認証の認証情報を環境変数から取得
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が設定されていない場合は認証をスキップ
  if (!basicAuthUser || !basicAuthPassword) {
    return NextResponse.next();
  }

  // Authorizationヘッダーを取得
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    // 認証ヘッダーがない場合は401を返す
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Basic認証の検証
  const auth = authHeader.split(' ')[1];
  const [user, password] = Buffer.from(auth, 'base64').toString().split(':');

  if (user === basicAuthUser && password === basicAuthPassword) {
    // 認証成功
    return NextResponse.next();
  }

  // 認証失敗
  return new NextResponse('Authentication failed', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// 認証を適用するパスを指定（すべてのパスに適用）
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
