import { type Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import * as authService from './service.js';
import type { RegisterInput, LoginInput, RefreshInput } from './schemas.js';

export async function register(req: AuthenticatedRequest, res: Response) {
  const input = req.body as RegisterInput;
  
  const user = await authService.createUser(input);
  
  res.status(201).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: 'User registered successfully',
  });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const input = req.body as LoginInput;
  
  const result = await authService.authenticateUser(input);
  
  if (!result) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    message: 'Login successful',
  });
}

export async function refresh(req: AuthenticatedRequest, res: Response) {
  const { refreshToken } = req.body as RefreshInput;
  
  const result = await authService.refreshAccessToken(refreshToken);
  
  if (!result) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  const { refreshToken } = req.body as RefreshInput;
  
  await authService.logout(refreshToken);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}