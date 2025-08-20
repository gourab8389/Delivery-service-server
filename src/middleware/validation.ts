import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendResponse } from '../utils/helpers';

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

export const resetForgotPasswordSchema = Joi.object({
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

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password cannot exceed 128 characters',
  }),
});

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
  street: Joi.string().min(5).max(200).required().messages({
    'string.empty': 'Street address is required',
    'string.min': 'Street address must be at least 5 characters long',
    'string.max': 'Street address cannot exceed 200 characters',
  }),
  city: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 50 characters',
  }),
  state: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'State is required',
    'string.min': 'State must be at least 2 characters long',
    'string.max': 'State cannot exceed 50 characters',
  }),
  pinCode: Joi.string().min(5).max(10).required().messages({
    'string.empty': 'Pin code is required',
    'string.min': 'Pin code must be at least 5 characters long',
    'string.max': 'Pin code cannot exceed 10 characters',
  }),
  country: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Country is required',
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country cannot exceed 50 characters',
  }),
  documentType: Joi.string().valid('AADHAR', 'PAN', 'PASSPORT', 'LICENCE').required().messages({
    'string.empty': 'Document type is required',
    'any.only': 'Document type must be one of: AADHAR, PAN, PASSPORT, LICENCE',
  }),
  cardNumber: Joi.string().min(6).max(20).required().messages({
    'string.empty': 'Card number is required',
    'string.min': 'Card number must be at least 6 characters long',
    'string.max': 'Card number cannot exceed 20 characters',
  }),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  number: Joi.string().min(10).max(15).optional(),
  street: Joi.string().min(5).max(200).optional(),
  city: Joi.string().min(2).max(50).optional(),
  state: Joi.string().min(2).max(50).optional(),
  pinCode: Joi.string().min(5).max(10).optional(),
  country: Joi.string().min(2).max(50).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const updateDocumentSchema = Joi.object({
  documentType: Joi.string().valid('AADHAR', 'PAN', 'PASSPORT', 'LICENCE').optional(),
  cardNumber: Joi.string().min(6).max(20).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for document update',
});

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