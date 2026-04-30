# Tech Stack Decisions - Unit 4: Frontend

---

## 1. 핵심 기술 스택

| 기술 | 버전 | 용도 | 선택 근거 |
|---|---|---|---|
| **React** | 18.x | UI 라이브러리 | 컴포넌트 기반, 팀 친숙도, 생태계 |
| **TypeScript** | 5.x | 타입 안전성 | strict 모드, 런타임 에러 방지 |
| **Vite** | 5.x | 빌드 도구 | 빠른 HMR, 간단한 설정, ESM 기반 |
| **React Router** | 6.x | 클라이언트 라우팅 | SPA 라우팅, 인증 가드 |

---

## 2. 스타일링

| 기술 | 용도 | 선택 근거 |
|---|---|---|
| **CSS Modules** | 컴포넌트 스코프 스타일 | Vite 내장 지원, zero-config, 스코프 격리 |
| **CSS Variables** | 테마 변수 (Black Marble) | 런타임 테마 변경 가능, 추가 의존성 없음 |
| **글로벌 CSS** | 리셋, 폰트, 공통 스타일 | 기본 스타일 정의 |

---

## 3. 상태 관리

| 방식 | 용도 | 선택 근거 |
|---|---|---|
| **React Context** | 관리자 인증 상태 (AuthContext) | 전역 상태 최소, 추가 라이브러리 불필요 |
| **useState/useReducer** | 페이지 로컬 상태 | React 내장, 단순 상태 관리 |
| **localStorage** | 장바구니, 토큰, 테이블 설정 | 새로고침 시 데이터 유지 |

---

## 4. API 통신

| 기술 | 용도 | 선택 근거 |
|---|---|---|
| **Fetch API** | HTTP 요청 | 브라우저 내장, 추가 의존성 없음 |
| **EventSource** | SSE 실시간 통신 | 브라우저 내장, 자동 재연결 지원 |

---

## 5. 폼 처리

| 방식 | 용도 | 선택 근거 |
|---|---|---|
| **직접 구현** | 폼 검증 | 폼이 단순 (로그인, 메뉴 등록, 계정 생성), 라이브러리 불필요 |

---

## 6. 테스트 (설정만)

| 기술 | 용도 | 선택 근거 |
|---|---|---|
| **Vitest** | 단위 테스트 러너 | Vite 네이티브, 빠른 실행 |
| **React Testing Library** | 컴포넌트 테스트 | React 표준 테스트 도구 |
| **jsdom** | DOM 환경 | Vitest 테스트 환경 |

---

## 7. 개발 도구

| 기술 | 용도 |
|---|---|
| **Vite Dev Server** | 개발 서버 (HMR) |
| **TypeScript Compiler** | 타입 체크 |
| **Vite Proxy** | 개발 시 API 프록시 (백엔드 연동) |

---

## 8. 폰트

| 폰트 | 용도 | 로딩 방식 |
|---|---|---|
| **Playfair Display** | 메뉴명, 헤딩 (세리프) | Google Fonts CDN |
| **Inter** | 본문, UI 텍스트 (산세리프) | Google Fonts CDN |

---

## 9. 의존성 목록 (package.json)

### dependencies
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.28.0"
}
```

### devDependencies
```json
{
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.0",
  "typescript": "^5.6.0",
  "vite": "^5.4.0",
  "vitest": "^2.1.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.6.0",
  "jsdom": "^25.0.0"
}
```

**총 의존성**: 3개 (production) + 9개 (dev) = 12개
**외부 런타임 의존성**: React, React DOM, React Router DOM만

---

## 10. 빌드 설정

### Vite 설정 핵심
```typescript
// vite.config.ts
{
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'  // 백엔드 프록시
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false
  }
}
```

### TypeScript 설정 핵심
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 11. 기술 결정 요약

| 결정 사항 | 선택 | 대안 (미선택) | 근거 |
|---|---|---|---|
| 스타일링 | CSS Modules | Tailwind, styled-components | Zero-config, 경량, 스코프 격리 |
| 상태 관리 | React Context | Zustand, Redux | 전역 상태 최소, 추가 의존성 불필요 |
| HTTP 클라이언트 | Fetch API | Axios | 브라우저 내장, 의존성 최소화 |
| 폼 검증 | 직접 구현 | React Hook Form, Formik | 폼 단순, 라이브러리 불필요 |
| 빌드 도구 | Vite | Webpack, Parcel | 빠른 HMR, 간단한 설정 |
| 테스트 | Vitest + RTL | Jest | Vite 네이티브 통합 |
| 브라우저 | Chrome v120+ | 크로스 브라우저 | MVP 범위 축소 |
