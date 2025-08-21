import { Request, Response } from "express";
import path from "path";
import fs from "fs-extra";
import { sendResponse } from "../utils/helpers";
import { AuthRequest } from "../types";
import {
  validateDocumentType,
  validateCardNumber,
  formatCardNumber,
  getFileInfo,
  deleteFile,
} from "../services/fileService";
import prisma from "../utils/database";

export const createCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const {
      name,
      email,
      number,
      street,
      city,
      state,
      pinCode,
      country,
      documentType,
      cardNumber,
    } = req.body;

    const documentFile = req.file;

    // Validate required document file
    if (!documentFile) {
      sendResponse(res, 400, false, "Document file is required");
      return;
    }

    // Validate document type
    if (!validateDocumentType(documentType)) {
      // Delete uploaded file if validation fails
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(res, 400, false, "Invalid document type");
      return;
    }

    // Validate card number format
    if (!validateCardNumber(documentType, cardNumber)) {
      // Delete uploaded file if validation fails
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(
        res,
        400,
        false,
        `Invalid ${documentType} card number format`
      );
      return;
    }

    // Check if customer with same email already exists for this user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email,
        userId: req.user!.id,
      },
    });

    if (existingCustomer) {
      // Delete uploaded file if customer exists
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(res, 400, false, "Customer with this email already exists");
      return;
    }

    // Get file information
    const fileInfo = getFileInfo(documentFile);
    const formattedCardNumber = formatCardNumber(documentType, cardNumber);

    // Create customer with address and document in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          number,
          userId: req.user!.id,
        },
      });

      // Create address
      const address = await prisma.address.create({
        data: {
          street,
          city,
          state,
          pinCode,
          country,
          customerId: customer.id,
        },
      });

      // Create document
      const document = await prisma.document.create({
        data: {
          type: documentType.toUpperCase(),
          cardNumber: formattedCardNumber,
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath,
          fileSize: fileInfo.fileSize,
          customerId: customer.id,
        },
      });

      return { customer, address, document };
    });

    // Return customer with all related data
    const customerWithDetails = await prisma.customer.findUnique({
      where: { id: result.customer.id },
      include: {
        address: true,
        documents: true,
      },
    });

    sendResponse(res, 201, true, "Customer created successfully", {
      customer: customerWithDetails,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    // Clean up uploaded file if there's an error
    if (req.file) {
      await deleteFile(`uploads/documents/${req.file.filename}`);
    }

    sendResponse(
      res,
      500,
      false,
      "Internal server error while creating customer"
    );
  }
};

export const getAllCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any = {
      userId: req.user.id,
    };

    if (search) {
      searchConditions.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { number: { contains: search, mode: "insensitive" } },
        {
          address: {
            city: { contains: search, mode: "insensitive" },
          },
        },
        {
          address: {
            state: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Get customers with pagination and include related data
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: searchConditions,
        include: {
          address: true,
          documents: {
            select: {
              id: true,
              type: true,
              cardNumber: true,
              fileName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.customer.count({ where: searchConditions }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    sendResponse(res, 200, true, "Customers retrieved successfully", {
      customers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all customers error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error while fetching customers"
    );
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        address: true,
        documents: {
          select: {
            id: true,
            type: true,
            cardNumber: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!customer) {
      sendResponse(res, 404, false, "Customer not found");
      return;
    }

    sendResponse(res, 200, true, "Customer retrieved successfully", {
      customer,
    });
  } catch (error) {
    console.error("Get customer by ID error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error while fetching customer"
    );
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const { id } = req.params;
    const { name, email, number, street, city, state, pinCode, country } =
      req.body;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        address: true,
      },
    });

    if (!existingCustomer) {
      sendResponse(res, 404, false, "Customer not found");
      return;
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingCustomer.email) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          email,
          userId: req.user.id,
          NOT: { id },
        },
      });

      if (duplicateCustomer) {
        sendResponse(
          res,
          400,
          false,
          "Another customer with this email already exists"
        );
        return;
      }
    }

    // Prepare update data
    const customerUpdateData: any = {};
    const addressUpdateData: any = {};

    // Customer fields
    if (name) customerUpdateData.name = name;
    if (email) customerUpdateData.email = email;
    if (number) customerUpdateData.number = number;

    // Address fields
    if (street) addressUpdateData.street = street;
    if (city) addressUpdateData.city = city;
    if (state) addressUpdateData.state = state;
    if (pinCode) addressUpdateData.pinCode = pinCode;
    if (country) addressUpdateData.country = country;

    // Update customer and address in a transaction
    const updatedCustomer = await prisma.$transaction(async (prisma) => {
      // Update customer if there are customer fields to update
      let customer = existingCustomer;
      if (Object.keys(customerUpdateData).length > 0) {
        customer = await prisma.customer.update({
          where: { id },
          data: customerUpdateData,
          include: {
            address: true,
            documents: {
              select: {
                id: true,
                type: true,
                cardNumber: true,
                fileName: true,
                createdAt: true,
              },
            },
          },
        });
      }

      // Update address if there are address fields to update
      if (
        Object.keys(addressUpdateData).length > 0 &&
        existingCustomer.address
      ) {
        await prisma.address.update({
          where: { customerId: id },
          data: addressUpdateData,
        });
      }

      // Return updated customer with all relations
      return await prisma.customer.findUnique({
        where: { id },
        include: {
          address: true,
          documents: {
            select: {
              id: true,
              type: true,
              cardNumber: true,
              fileName: true,
              createdAt: true,
            },
          },
        },
      });
    });

    sendResponse(res, 200, true, "Customer updated successfully", {
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error while updating customer"
    );
  }
};

export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const { id } = req.params;

    // Check if customer exists and belongs to user, include documents for cleanup
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        documents: true,
      },
    });

    if (!existingCustomer) {
      sendResponse(res, 404, false, "Customer not found");
      return;
    }

    // Delete customer (this will cascade delete address and documents due to schema)
    await prisma.customer.delete({
      where: { id },
    });

    // Clean up document files from file system
    if (existingCustomer.documents.length > 0) {
      for (const document of existingCustomer.documents) {
        await deleteFile(document.filePath);
      }
    }

    sendResponse(res, 200, true, "Customer deleted successfully");
  } catch (error) {
    console.error("Delete customer error:", error);
    sendResponse(
      res,
      500,
      false,
      "Internal server error while deleting customer"
    );
  }
};

export const updateDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const { customerId } = req.params;
    const { documentType, cardNumber } = req.body;
    const documentFile = req.file;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: req.user.id,
      },
      include: {
        documents: true,
      },
    });

    if (!existingCustomer) {
      // Clean up uploaded file if customer doesn't exist
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(res, 404, false, "Customer not found");
      return;
    }

    if (existingCustomer.documents.length === 0) {
      // Clean up uploaded file if no document exists
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(res, 404, false, "No document found for this customer");
      return;
    }

    const existingDocument = existingCustomer.documents[0];
    // Validate document type if provided
    if (documentType && !validateDocumentType(documentType)) {
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(res, 400, false, "Invalid document type");
      return;
    }

    // Validate card number format if provided
    const typeToValidate = documentType || existingDocument.type;
    const numberToValidate = cardNumber || existingDocument.cardNumber;

    if (cardNumber && !validateCardNumber(typeToValidate, cardNumber)) {
      if (documentFile) {
        await deleteFile(`uploads/documents/${documentFile.filename}`);
      }
      sendResponse(
        res,
        400,
        false,
        `Invalid ${typeToValidate} card number format`
      );
      return;
    }

    // Prepare update data
    const updateData: any = {};

    if (documentType) {
      updateData.type = documentType.toUpperCase();
    }

    if (cardNumber) {
      updateData.cardNumber = formatCardNumber(typeToValidate, cardNumber);
    }

    if (documentFile) {
      const fileInfo = getFileInfo(documentFile);
      updateData.fileName = fileInfo.fileName;
      updateData.filePath = fileInfo.filePath;
      updateData.fileSize = fileInfo.fileSize;
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: existingDocument.id },
      data: updateData,
    });

    // Delete old file if new file was uploaded
    if (documentFile) {
      await deleteFile(existingDocument.filePath);
    }

    sendResponse(res, 200, true, "Document updated successfully", {
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Update document error:", error);
    throw error;
  }
};

export const getDocumentFile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendResponse(res, 401, false, "User not authenticated");
      return;
    }

    const { customerId, documentId } = req.params;

    // Find the document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        customerId: customerId,
        customer: {
          userId: req.user.id,
        },
      },
    });

    if (!document) {
      sendResponse(res, 404, false, "Document not found");
      return;
    }

    // Send file
    const filePath = path.join(process.cwd(), document.filePath);

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      sendResponse(res, 404, false, "File not found on server");
      return;
    }

    res.download(filePath, document.fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        if (!res.headersSent) {
          sendResponse(res, 500, false, "Error downloading file");
        }
      }
    });
  } catch (error) {
    console.error("Get document file error:", error);
    if (!res.headersSent) {
      sendResponse(
        res,
        500,
        false,
        "Internal server error while downloading document"
      );
    }
  }
};
