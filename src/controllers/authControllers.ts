import { Request, Response } from "express";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../services/authService";
import { sendResetCodeEmail } from "../services/emailService";
import { sendResponse, generateResetCode } from "../utils/helpers";
import { AuthRequest } from "../types";
import prisma from "../utils/database";
import { createUserSession } from "../services/sessionService";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendResponse(res, 400, false, "User already exists with this email");
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Create session with device tracking
    await createUserSession(user.id, token, req);

    sendResponse(res, 201, true, "User created successfully", {
      user,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    sendResponse(res, 500, false, "Internal server error during signup");
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendResponse(res, 401, false, "Invalid email or password");
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      sendResponse(res, 401, false, "Invalid email or password");
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Create session with device tracking
    await createUserSession(user.id, token, req);

    sendResponse(res, 200, true, "Login successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendResponse(res, 500, false, "Internal server error during login");
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendResponse(
        res,
        200,
        true,
        "If the email exists, a reset code will be sent"
      );
      return;
    }

    const resetCode = generateResetCode(6);
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetCode,
        resetCodeExpires,
      },
    });

    await sendResetCodeEmail(email, resetCode, user.name);

    sendResponse(res, 200, true, "Reset code sent to your email");
  } catch (error) {
    console.error("Forgot password error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error during password reset"
    );
  }
};

export const resetforgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, resetCode, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetCode,
        resetCodeExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      sendResponse(res, 400, false, "Invalid or expired reset code");
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error during password reset"
    );
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    if (!user) {
      sendResponse(res, 404, false, "User not found");
      return;
    }

    sendResponse(res, 200, true, "User retrieved successfully", {
      user: {
        ...user,
        totalCustomers: user._count.customers,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    sendResponse(res, 500, false, "Internal server error while fetching user");
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendResponse(res, 404, false, "User not found");
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      sendResponse(res, 401, false, "Invalid password");
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error during password reset"
    );
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    sendResponse(res, 200, true, "User logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    sendResponse(res, 500, false, "Internal server error during logout");
  }
};
