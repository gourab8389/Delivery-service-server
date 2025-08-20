import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendResponse } from '../utils/helpers';

// User validation schemas
export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  resetCode: Joi.string().length(6).required().messages({
    'string.empty': 'Reset code is required',
    'string.length': 'Reset code must be exactly 6 digits',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password cannot exceed 128 characters',
  }),
});

// Customer validation schemas
export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Customer name is required',
    'string.min': 'Customer name must be at least 2 characters long',
    'string.max': 'Customer name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Customer email is required',
    'string.email': 'Please provide a valid email address',
  }),
  number: Joi.string().min(10).max(15).required().messages({
    'string.empty': 'Customer number is required',
    'string.min': 'Customer number must be at least 10 characters long',
    'string.max': 'Customer number cannot exceed 15 characters',
  }),
  address: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Customer address is required',
    'string.min': 'Customer address must be at least 1 character long',
    'string.max': 'Customer address cannot exceed 500 characters',
  }),
  bankDetails: Joi.string().min(5).max(200).required().messages({
    'string.empty': 'Bank details are required',
    'string.min': 'Bank details must be at least 5 characters long',
    'string.max': 'Bank details cannot exceed 200 characters',
  }),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  number: Joi.string().min(10).max(15).optional(),
  address: Joi.string().min(1).max(500).optional(),
  bankDetails: Joi.string().min(5).max(200).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return sendResponse(res, 400, false, 'Validation error', null, errorMessages.join(', '));
    }
    
    next();
  };
};