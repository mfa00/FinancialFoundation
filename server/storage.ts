import {
  users,
  companies,
  companyUsers,
  accounts,
  journalEntries,
  journalEntryLines,
  customers,
  vendors,
  invoices,
  invoiceLines,
  expenses,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
  type CompanyUser,
  type Account,
  type InsertAccount,
  type JournalEntry,
  type InsertJournalEntry,
  type JournalEntryLine,
  type InsertJournalEntryLine,
  type Customer,
  type InsertCustomer,
  type Vendor,
  type InsertVendor,
  type Invoice,
  type InsertInvoice,
  type InvoiceLine,
  type InsertInvoiceLine,
  type Expense,
  type InsertExpense,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company management
  getCompany(id: number): Promise<Company | undefined>;
  getCompaniesByUser(userId: number): Promise<(Company & { role: string })[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  addUserToCompany(companyId: number, userId: number, role: string): Promise<void>;

  // Chart of Accounts
  getAccountsByCompany(companyId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(accountId: number, balance: string): Promise<void>;

  // Journal Entries
  getJournalEntriesByCompany(companyId: number, limit?: number): Promise<(JournalEntry & { lines: JournalEntryLine[] })[]>;
  getJournalEntry(id: number): Promise<(JournalEntry & { lines: JournalEntryLine[] }) | undefined>;
  createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalEntryLine[]): Promise<JournalEntry>;

  // Customers
  getCustomersByCompany(companyId: number): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Vendors
  getVendorsByCompany(companyId: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;

  // Invoices
  getInvoicesByCompany(companyId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice, lines: InsertInvoiceLine[]): Promise<Invoice>;

  // Expenses
  getExpensesByCompany(companyId: number, limit?: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Financial metrics
  getFinancialMetrics(companyId: number): Promise<{
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    cashBalance: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check if password is already hashed (from registration route)
    const isAlreadyHashed = userData.password.startsWith('$2b$') || userData.password.startsWith('$2a$');
    const password = isAlreadyHashed ? userData.password : await bcrypt.hash(userData.password, 10);

    const [user] = await db.insert(users).values({
      ...userData,
      password,
    }).returning();
    return user;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompaniesByUser(userId: number): Promise<(Company & { role: string })[]> {
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        industry: companies.industry,
        address: companies.address,
        phone: companies.phone,
        email: companies.email,
        taxId: companies.taxId,
        fiscalYearEnd: companies.fiscalYearEnd,
        baseCurrency: companies.baseCurrency,
        createdAt: companies.createdAt,
        role: companyUsers.role,
      })
      .from(companies)
      .innerJoin(companyUsers, eq(companies.id, companyUsers.companyId))
      .where(eq(companyUsers.userId, userId));

    return result;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async addUserToCompany(companyId: number, userId: number, role: string): Promise<void> {
    await db.insert(companyUsers).values({
      companyId,
      userId,
      role,
    });
  }

  async getAccountsByCompany(companyId: number): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId))
      .orderBy(accounts.code);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateAccountBalance(accountId: number, balance: string): Promise<void> {
    await db
      .update(accounts)
      .set({ balance })
      .where(eq(accounts.id, accountId));
  }

  async getJournalEntriesByCompany(companyId: number, limit = 50): Promise<(JournalEntry & { lines: JournalEntryLine[] })[]> {
    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.date))
      .limit(limit);

    const entriesWithLines = await Promise.all(
      entries.map(async (entry) => {
        const lines = await db
          .select()
          .from(journalEntryLines)
          .where(eq(journalEntryLines.journalEntryId, entry.id));
        return { ...entry, lines };
      })
    );

    return entriesWithLines;
  }

  async getJournalEntry(id: number): Promise<(JournalEntry & { lines: JournalEntryLine[] }) | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) return undefined;

    const lines = await db
      .select()
      .from(journalEntryLines)
      .where(eq(journalEntryLines.journalEntryId, entry.id));

    return { ...entry, lines };
  }

  async createJournalEntry(insertEntry: InsertJournalEntry, insertLines: InsertJournalEntryLine[]): Promise<JournalEntry> {
    // Generate entry number
    const year = new Date().getFullYear();
    const [lastEntry] = await db
      .select({ entryNumber: journalEntries.entryNumber })
      .from(journalEntries)
      .where(eq(journalEntries.companyId, insertEntry.companyId))
      .orderBy(desc(journalEntries.entryNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastEntry && lastEntry.entryNumber.startsWith(`JE${year}-`)) {
      const lastNumber = parseInt(lastEntry.entryNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const entryNumber = `JE${year}-${nextNumber.toString().padStart(4, '0')}`;

    const [entry] = await db
      .insert(journalEntries)
      .values({ ...insertEntry, entryNumber })
      .returning();

    // Insert lines
    const linesWithEntryId = insertLines.map(line => ({
      ...line,
      journalEntryId: entry.id,
    }));

    await db.insert(journalEntryLines).values(linesWithEntryId);

    // Update account balances
    for (const line of insertLines) {
      const account = await this.getAccount(line.accountId);
      if (account) {
        const currentBalance = parseFloat(account.balance);
        const debitAmount = parseFloat(line.debitAmount);
        const creditAmount = parseFloat(line.creditAmount);

        let newBalance = currentBalance;
        if (account.type === 'asset' || account.type === 'expense') {
          newBalance += debitAmount - creditAmount;
        } else {
          newBalance += creditAmount - debitAmount;
        }

        await this.updateAccountBalance(line.accountId, newBalance.toFixed(2));
      }
    }

    return entry;
  }

  async getCustomersByCompany(companyId: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(customers.name);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async getVendorsByCompany(companyId: number): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.companyId, companyId))
      .orderBy(vendors.name);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db
      .insert(vendors)
      .values(insertVendor)
      .returning();
    return vendor;
  }

  async getInvoicesByCompany(companyId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.date));
  }

  async createInvoice(insertInvoice: InsertInvoice, insertLines: InsertInvoiceLine[]): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();

    const linesWithInvoiceId = insertLines.map(line => ({
      ...line,
      invoiceId: invoice.id,
    }));

    await db.insert(invoiceLines).values(linesWithInvoiceId);

    return invoice;
  }

  async getExpensesByCompany(companyId: number, limit = 50): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.companyId, companyId))
      .orderBy(desc(expenses.date))
      .limit(limit);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getFinancialMetrics(companyId: number): Promise<{
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    cashBalance: string;
  }> {
    // Get revenue accounts total
    const [revenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${accounts.balance}), 0)`,
      })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.type, 'revenue')));

    // Get expense accounts total
    const [expenseResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${accounts.balance}), 0)`,
      })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.type, 'expense')));

    // Get cash balance (assuming cash accounts are asset type with 'cash' in the name)
    const [cashResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${accounts.balance}), 0)`,
      })
      .from(accounts)
      .where(and(
        eq(accounts.companyId, companyId),
        eq(accounts.type, 'asset'),
        sql`LOWER(${accounts.name}) LIKE '%cash%' OR LOWER(${accounts.name}) LIKE '%bank%'`
      ));

    const totalRevenue = revenueResult?.total || '0';
    const totalExpenses = expenseResult?.total || '0';
    const netProfit = (parseFloat(totalRevenue) - parseFloat(totalExpenses)).toFixed(2);
    const cashBalance = cashResult?.total || '0';

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashBalance,
    };
  }
}

export const storage = new DatabaseStorage();