import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import type { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeGuard } from './tenant-scope.guard';

type RequestFixture = {
  method: string;
  originalUrl: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  user: CurrentUserPayload;
};

const localAdmin: CurrentUserPayload = {
  userId: 'caller-1',
  email: 'diretor@example.com',
  role: UserRole.DIRECTOR,
  institutionId: 'institution-a',
  firstName: 'Diretor',
  lastName: 'Local',
};

function executionContext(request: RequestFixture): ExecutionContext {
  return {
    getHandler: () => class Handler {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function requestFixture(
  overrides: Partial<RequestFixture> = {},
): RequestFixture {
  return {
    method: 'GET',
    originalUrl: '/users/target-user',
    params: { id: 'target-user' },
    query: {},
    body: {},
    user: localAdmin,
    ...overrides,
  };
}

describe('TenantScopeGuard', () => {
  const prisma = {
    userInstitution: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    examAttempt: { findUnique: jest.fn() },
  };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  };

  let guard: TenantScopeGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.userInstitution.findMany.mockResolvedValue([]);
    guard = new TenantScopeGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('allows a record from the caller institution', async () => {
    prisma.user.findUnique.mockResolvedValue({
      institutionId: 'institution-a',
    });

    await expect(
      guard.canActivate(executionContext(requestFixture())),
    ).resolves.toBe(true);
  });

  it('blocks an ID that belongs to another institution', async () => {
    prisma.user.findUnique.mockResolvedValue({
      institutionId: 'institution-b',
    });

    await expect(
      guard.canActivate(executionContext(requestFixture())),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks an explicit cross-tenant institutionId before the controller', async () => {
    const request = requestFixture({
      method: 'POST',
      originalUrl: '/subjects',
      params: {},
      body: { institutionId: 'institution-b' },
    });

    await expect(
      guard.canActivate(executionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('blocks a cross-tenant userId in nested routes', async () => {
    prisma.user.findUnique.mockResolvedValue({
      institutionId: 'institution-b',
    });
    const request = requestFixture({
      originalUrl: '/rankings/user/target-user',
      params: { userId: 'target-user' },
    });

    await expect(
      guard.canActivate(executionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a linked active institution', async () => {
    prisma.userInstitution.findMany.mockResolvedValue([
      { institutionId: 'institution-b' },
    ]);
    prisma.user.findUnique.mockResolvedValue({
      institutionId: 'institution-b',
    });

    await expect(
      guard.canActivate(executionContext(requestFixture())),
    ).resolves.toBe(true);
  });

  it('keeps the global administrator unrestricted', async () => {
    const request = requestFixture({
      user: { ...localAdmin, role: UserRole.SUPER_ADMIN_GLOBAL },
    });

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(
      true,
    );
    expect(prisma.userInstitution.findMany).not.toHaveBeenCalled();
  });

  it('blocks a student from opening another student attempt', async () => {
    prisma.examAttempt.findUnique.mockResolvedValue({
      studentId: 'student-b',
      exam: { institutionId: 'institution-a' },
    });
    const request = requestFixture({
      originalUrl: '/exams/attempts/attempt-b/result',
      params: { attemptId: 'attempt-b' },
      user: {
        ...localAdmin,
        role: UserRole.STUDENT,
        studentId: 'student-a',
      },
    });

    await expect(
      guard.canActivate(executionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
