import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertCompanySchema, insertAccountSchema, insertJournalEntrySchema, insertJournalEntryLineSchema, insertCustomerSchema, insertVendorSchema, insertInvoiceSchema, insertInvoiceLineSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

// Session middleware setup
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    currentCompanyId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Company access middleware
  const checkCompanyAccess = async (req: any, res: any, next: any) => {
    const companyId = parseInt(req.params.companyId || req.body.companyId || req.session.currentCompanyId);
    if (!companyId) {
      return res.status(400).json({ message: "Company ID required" });
    }

    const userCompanies = await storage.getCompaniesByUser(req.session.userId);
    const hasAccess = userCompanies.some(company => company.id === companyId);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "No access to this company" });
    }

    req.companyId = companyId;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      req.session!.userId = user.id;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session!.userId = user.id;
      
      // Get user's companies
      const companies = await storage.getCompaniesByUser(user.id);
      if (companies.length > 0) {
        req.session!.currentCompanyId = companies[0].id;
      }

      res.json({ 
        user: { ...user, password: undefined }, 
        companies,
        currentCompanyId: companies[0]?.id 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const companies = await storage.getCompaniesByUser(user.id);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        companies,
        currentCompanyId: req.session!.currentCompanyId 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info", error });
    }
  });

  // Company routes
  app.get("/api/companies", authenticateUser, async (req, res) => {
    try {
      const companies = await storage.getCompaniesByUser(req.session!.userId!);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get companies", error });
    }
  });

  app.post("/api/companies", authenticateUser, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      
      // Add user as admin of the new company
      await storage.addUserToCompany(company.id, req.session!.userId!, "admin");
      
      // Set as current company if it's the first one
      const userCompanies = await storage.getCompaniesByUser(req.session!.userId!);
      if (userCompanies.length === 1) {
        req.session!.currentCompanyId = company.id;
      }

      res.json(company);
    } catch (error) {
      res.status(400).json({ message: "Invalid company data", error });
    }
  });

  app.post("/api/companies/:companyId/switch", authenticateUser, checkCompanyAccess, (req, res) => {
    req.session!.currentCompanyId = req.companyId;
    res.json({ currentCompanyId: req.companyId });
  });

  // Chart of Accounts routes
  app.get("/api/companies/:companyId/accounts", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const accounts = await storage.getAccountsByCompany(req.companyId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accounts", error });
    }
  });

  app.post("/api/companies/:companyId/accounts", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse({ ...req.body, companyId: req.companyId });
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data", error });
    }
  });

  // Journal Entries routes
  app.get("/api/companies/:companyId/journal-entries", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getJournalEntriesByCompany(req.companyId, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get journal entries", error });
    }
  });

  app.post("/api/companies/:companyId/journal-entries", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const { entry, lines } = req.body;
      
      const entryData = insertJournalEntrySchema.parse({
        ...entry,
        companyId: req.companyId,
        createdBy: req.session!.userId!,
      });
      
      const linesData = z.array(insertJournalEntryLineSchema).parse(lines);
      
      // Validate double-entry bookkeeping
      const totalDebits = linesData.reduce((sum, line) => sum + parseFloat(line.debitAmount), 0);
      const totalCredits = linesData.reduce((sum, line) => sum + parseFloat(line.creditAmount), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({ message: "Journal entry must balance (debits = credits)" });
      }

      const journalEntry = await storage.createJournalEntry(entryData, linesData);
      res.json(journalEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid journal entry data", error });
    }
  });

  // Customer routes
  app.get("/api/companies/:companyId/customers", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const customers = await storage.getCustomersByCompany(req.companyId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customers", error });
    }
  });

  app.post("/api/companies/:companyId/customers", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse({ ...req.body, companyId: req.companyId });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data", error });
    }
  });

  // Vendor routes
  app.get("/api/companies/:companyId/vendors", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const vendors = await storage.getVendorsByCompany(req.companyId);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vendors", error });
    }
  });

  app.post("/api/companies/:companyId/vendors", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const vendorData = insertVendorSchema.parse({ ...req.body, companyId: req.companyId });
      const vendor = await storage.createVendor(vendorData);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ message: "Invalid vendor data", error });
    }
  });

  // Invoice routes
  app.get("/api/companies/:companyId/invoices", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByCompany(req.companyId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get invoices", error });
    }
  });

  app.post("/api/companies/:companyId/invoices", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const { invoice, lines } = req.body;
      
      const invoiceData = insertInvoiceSchema.parse({ ...invoice, companyId: req.companyId });
      const linesData = z.array(insertInvoiceLineSchema).parse(lines);
      
      const newInvoice = await storage.createInvoice(invoiceData, linesData);
      res.json(newInvoice);
    } catch (error) {
      res.status(400).json({ message: "Invalid invoice data", error });
    }
  });

  // Expense routes
  app.get("/api/companies/:companyId/expenses", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const expenses = await storage.getExpensesByCompany(req.companyId, limit);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses", error });
    }
  });

  app.post("/api/companies/:companyId/expenses", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        companyId: req.companyId,
        createdBy: req.session!.userId!,
      });
      
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });

  // Financial metrics
  app.get("/api/companies/:companyId/metrics", authenticateUser, checkCompanyAccess, async (req, res) => {
    try {
      const metrics = await storage.getFinancialMetrics(req.companyId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get financial metrics", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
