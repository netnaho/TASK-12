import { z } from 'zod';
import { ROLES } from '../../shared/constants/roles.constant';

const roleNameValues = Object.values(ROLES) as [string, ...string[]];

const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export const CreateUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => passwordRegex.uppercase.test(val), {
      message: 'Password must contain at least one uppercase letter',
    })
    .refine((val) => passwordRegex.lowercase.test(val), {
      message: 'Password must contain at least one lowercase letter',
    })
    .refine((val) => passwordRegex.number.test(val), {
      message: 'Password must contain at least one number',
    })
    .refine((val) => passwordRegex.special.test(val), {
      message: 'Password must contain at least one special character',
    }),
  displayName: z.string().min(1, 'Display name is required'),
  employeeId: z.string().optional(),
  roleName: z.enum(roleNameValues),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email('Invalid email address').optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().optional(),
});

export const AssignRoleSchema = z.object({
  roleName: z.enum(roleNameValues),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateUserBody = z.infer<typeof CreateUserSchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>;
export type AssignRoleBody = z.infer<typeof AssignRoleSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
