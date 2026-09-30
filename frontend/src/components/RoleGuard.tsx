import React from 'react';
import type { User } from '../lib/types';
import { navigate } from '../lib/router';
import { Loading } from './ui';

const ROLE_HOME: Record<User['role'], string> = {
  citizen: '/citizen',
  planner: '/planner',
  authority: '/authority',
};

interface RoleGuardProps {
  user: User | null;
  requiredRole: User['role'];
  children: React.ReactNode;
}

export function RoleGuard({ user, requiredRole, children }: RoleGuardProps) {
  if (!user) {
    navigate('/auth');
    return <Loading label="Redirecting to login..." />;
  }

  if (user.role !== requiredRole) {
    const targetHome = ROLE_HOME[user.role] || '/citizen';
    navigate(targetHome);
    return <Loading label="Redirecting to authorized portal..." />;
  }

  return <>{children}</>;
}
