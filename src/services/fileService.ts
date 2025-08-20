import fs from 'fs-extra';
import path from 'path';

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const fileExists = await fs.pathExists(fullPath);
    
    if (fileExists) {
      await fs.remove(fullPath);
      console.log(`File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    // Don't throw error, just log it
  }
};

export const getFileInfo = (file: Express.Multer.File) => {
  return {
    fileName: file.filename,
    filePath: `uploads/documents/${file.filename}`,
    fileSize: file.size,
    originalName: file.originalname,
    mimeType: file.mimetype,
  };
};

export const validateDocumentType = (documentType: string): boolean => {
  const validTypes = ['AADHAR', 'PAN', 'PASSPORT', 'LICENCE'];
  return validTypes.includes(documentType.toUpperCase());
};

export const validateCardNumber = (documentType: string, cardNumber: string): boolean => {
  const type = documentType.toUpperCase();
  
  switch (type) {
    case 'AADHAR':
      return /^\d{12}$/.test(cardNumber.replace(/\s/g, ''));
    case 'PAN':
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cardNumber.toUpperCase());
    case 'PASSPORT':
      return /^[A-Z0-9]{6,9}$/.test(cardNumber.toUpperCase());
    case 'LICENCE':
      return /^[A-Z0-9]{8,20}$/.test(cardNumber.toUpperCase().replace(/[\s-]/g, ''));
      
    default:
      return false;
  }
};

export const formatCardNumber = (documentType: string, cardNumber: string): string => {
  const type = documentType.toUpperCase();
  const cleanNumber = cardNumber.replace(/[\s-]/g, '').toUpperCase();
  
  switch (type) {
    case 'AADHAR':
      return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    case 'PAN':
      return cleanNumber;
    case 'PASSPORT':
      return cleanNumber;
    case 'LICENCE':
      return cleanNumber;
    default:
      return cleanNumber;
  }
};

export default {
  deleteFile,
  getFileInfo,
  validateDocumentType,
  validateCardNumber,
  formatCardNumber,
};