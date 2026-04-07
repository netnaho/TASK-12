import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { usersService } from './users.service';
import {
  CreateUserBody,
  UpdateUserBody,
  AssignRoleBody,
  ListUsersQuery,
} from './users.schemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListUsersQuery;
  const result = await usersService.findAll(filters);
  res.status(200).json(paginated(result.data, result.meta));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateUserBody;
  const user = await usersService.create(data, req.userId);
  res.status(201).json(created(user));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.findById(req.params.id);
  res.status(200).json(success(user));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateUserBody;
  const user = await usersService.update(req.params.id, data, req.userId);
  res.status(200).json(success(user));
});

export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const { roleName } = req.body as AssignRoleBody;
  const user = await usersService.assignRole(req.params.id, roleName, req.userId);
  res.status(200).json(success(user));
});

export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.removeRole(
    req.params.id,
    req.params.roleName,
    req.userId,
  );
  res.status(200).json(success(user));
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.deactivate(req.params.id, req.userId);
  res.status(200).json(success(user));
});
