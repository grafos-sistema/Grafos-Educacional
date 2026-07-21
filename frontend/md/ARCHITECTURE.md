# 🏗️ Arquitetura do Frontend

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP ROUTER                      │
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  (auth)       │  │  (dashboard) │  │   Middleware      │  │
│  │  - login      │  │  - dashboard │  │   - Auth check    │  │
│  │  - register   │  │  - students  │  │   - Role guard    │  │
│  └───────────────┘  │  - teachers  │  └───────────────────┘  │
│                     │  - classes   │                          │
│                     │  - grades    │                          │
│                     │  - etc...    │                          │
│                     └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        REACT COMPONENTS                         │
│                                                                 │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐ │
│  │ Layout     │  │ Forms    │  │ Charts  │  │  UI Base     │ │
│  │ - Sidebar  │  │ - Login  │  │ - Line  │  │  - Button    │ │
│  │ - Header   │  │ - Student│  │ - Bar   │  │  - Input     │ │
│  │ - Navbar   │  │ - Grade  │  │ - Pie   │  │  - Select    │ │
│  └────────────┘  └──────────┘  └─────────┘  │  - Modal     │ │
│                                              │  - Table     │ │
│                                              └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
│                                                                 │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │ Zustand       │  │ TanStack Query │  │ React Context   │  │
│  │ - Auth State  │  │ - API Cache    │  │ - Auth Context  │  │
│  │ - UI State    │  │ - Mutations    │  │ - Theme Context │  │
│  └───────────────┘  └────────────────┘  │ - Notifications │  │
│                                          └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICES LAYER                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ API Services (Axios)                                    │  │
│  │ - auth.service.ts                                       │  │
│  │ - students.service.ts                                   │  │
│  │ - teachers.service.ts                                   │  │
│  │ - grades.service.ts                                     │  │
│  │ - attendance.service.ts                                 │  │
│  │ - ... (29 services total)                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REST API                                │
│                   (NestJS Backend - Port 3001)                  │
│                     160+ Endpoints                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

```
User Action
    │
    ▼
React Component
    │
    ▼
Custom Hook (useStudents, useGrades, etc.)
    │
    ▼
TanStack Query + API Service
    │
    ▼
Axios HTTP Request
    │
    ▼
NestJS Backend API
    │
    ▼
Response (JSON)
    │
    ▼
TanStack Query Cache
    │
    ▼
React Component Re-render
    │
    ▼
UI Update
```

## 🎯 Padrões de Componentes

### 1. Page Components (App Router)
```typescript
// src/app/(dashboard)/students/page.tsx
export default function StudentsPage() {
  const { data, isLoading } = useStudents();

  return (
    <div>
      <Header title="Alunos" />
      <StudentTable data={data} />
    </div>
  );
}
```

### 2. Feature Components
```typescript
// src/components/features/StudentTable.tsx
interface StudentTableProps {
  data: Student[];
}

export function StudentTable({ data }: StudentTableProps) {
  // Component logic
}
```

### 3. UI Components
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  // Component logic
}
```

## 🔐 Autenticação Flow

```
┌──────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│  Login   │─────▶│   Auth   │─────▶│  Store  │─────▶│ Protected│
│  Page    │      │ Service  │      │  Token  │      │  Routes  │
└──────────┘      └──────────┘      └─────────┘      └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │  Backend │
                  │   JWT    │
                  └──────────┘
```

1. Usuário envia credenciais
2. AuthService chama API `/auth/login`
3. Backend retorna JWT token + user data
4. Token é armazenado (localStorage ou cookies)
5. AuthContext atualiza estado global
6. Usuário é redirecionado para dashboard
7. Middleware valida token em rotas protegidas

## 📋 Estrutura de Dados (TypeScript)

### User Type
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}
```

### Student Type
```typescript
interface Student {
  id: string;
  userId: string;
  user: User;
  dateOfBirth: Date;
  guardian: string;
  phone: string;
  address: string;
  enrollments: Enrollment[];
}
```

### Grade Type
```typescript
interface Grade {
  id: string;
  enrollmentId: string;
  subjectId: string;
  academicPeriodId: string;
  name: string;
  score: number;
  maxScore: number;
  isPublished: boolean;
  createdAt: Date;
}
```

## 🎨 Theme Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // ... mais cores
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

## 🔌 API Integration Pattern

```typescript
// src/services/students.service.ts
import api from '@/lib/api';
import { Student } from '@/types/student.types';

export const studentsService = {
  getAll: (params?: QueryParams) =>
    api.get<Student[]>('/students', { params }),

  getById: (id: string) =>
    api.get<Student>(`/students/${id}`),

  create: (data: CreateStudentDto) =>
    api.post<Student>('/students', data),

  update: (id: string, data: UpdateStudentDto) =>
    api.patch<Student>(`/students/${id}`, data),

  delete: (id: string) =>
    api.delete(`/students/${id}`),
};
```

```typescript
// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '@/services/students.service';

export function useStudents(params?: QueryParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsService.getAll(params),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

## 🛡️ Protected Routes

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
```

## 📊 Dashboard Architecture

```
Dashboard (Role-based)
├── Coordinator Dashboard
│   ├── Overview Stats
│   ├── Performance Charts
│   ├── Recent Activity
│   └── Alerts
│
├── Teacher Dashboard
│   ├── My Classes
│   ├── Pending Tasks
│   ├── Recent Content
│   └── Quick Actions
│
└── Parent Dashboard
    ├── Children Overview
    ├── Recent Grades
    ├── Attendance
    └── Upcoming Events
```

## 🎯 Optimization Strategies

### 1. Code Splitting
```typescript
// Lazy loading components
const StudentModal = dynamic(() => import('@/components/StudentModal'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 2. Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="Avatar"
  width={40}
  height={40}
  priority
/>
```

### 3. API Caching
```typescript
// TanStack Query automatic caching
useQuery({
  queryKey: ['students'],
  queryFn: getStudents,
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
});
```

## 🔄 State Management Strategy

### Local State
- useState para estado de componente único
- Formulários controlados

### Global State (Zustand)
- Auth state
- UI preferences (theme, sidebar)
- Filters and search

### Server State (TanStack Query)
- Todos os dados da API
- Automatic caching
- Background refetching

## 📱 Responsive Design Breakpoints

```typescript
// Tailwind breakpoints
sm:  640px   // Mobile landscape
md:  768px   // Tablet
lg:  1024px  // Desktop
xl:  1280px  // Large desktop
2xl: 1536px  // Extra large
```

## 🧪 Testing Strategy

```
Unit Tests (Jest + RTL)
├── Components
├── Hooks
└── Utilities

Integration Tests
├── API Services
└── Forms

E2E Tests (Playwright)
├── Authentication flow
├── CRUD operations
└── User workflows
```

## 🚀 Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Lighthouse Score: > 90
- Bundle Size: < 200KB (gzipped)

---

**Última atualização:** 2025-10-22
