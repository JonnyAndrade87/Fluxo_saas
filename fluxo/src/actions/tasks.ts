'use server';

import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export interface CreateTaskData {
  customerId: string;
  title: string;
  dueDate: string; // ISO string
  invoiceId?: string;
  description?: string;
}

export async function createTask(data: CreateTaskData) {
  const ctx = await requireAuth();
  if ((ctx.role as string) === 'viewer') {
    throw new Error('Forbidden: Acesso somente leitura');
  }

  // Validate Customer Ownership
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId: ctx.tenantId }
  });
  if (!customer) throw new Error("Customer not found or invalid tenant");

  // Validate Invoice Ownership if applicable
  if (data.invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId: ctx.tenantId }
    });
    if (!invoice) throw new Error("Invoice not found or invalid tenant");
  }

  const task = await prisma.task.create({
    data: {
      tenantId: ctx.tenantId,
      customerId: data.customerId,
      title: data.title,
      dueDate: new Date(data.dueDate),
      invoiceId: data.invoiceId || null,
      description: data.description || null,
      status: 'pending',
      assigneeId: ctx.userId, // Default assign to creator
    }
  });

  revalidatePath('/historico');
  revalidatePath('/clientes');
  return { success: true, task };
}

export async function completeTask(taskId: string) {
  const ctx = await requireAuth();
  if ((ctx.role as string) === 'viewer') {
    throw new Error('Forbidden: Acesso somente leitura');
  }

  // Ensure task belongs to tenant - use findFirst with tenantId filter for better isolation
  const task = await prisma.task.findFirst({ 
    where: { id: taskId, tenantId: ctx.tenantId } 
  });
  if (!task) {
    throw new Error('Task not found or forbidden');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    }
  });

  revalidatePath('/historico');
  return { success: true, task: updated };
}

export async function cancelTask(taskId: string) {
  const ctx = await requireAuth();
  if ((ctx.role as string) === 'viewer') {
    throw new Error('Forbidden: Acesso somente leitura');
  }

  // Ensure task belongs to tenant - use findFirst with tenantId filter for better isolation
  const task = await prisma.task.findFirst({ 
    where: { id: taskId, tenantId: ctx.tenantId } 
  });
  if (!task) {
    throw new Error('Task not found or forbidden');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'CANCELED',
    }
  });

  revalidatePath('/historico');
  return { success: true, task: updated };
}
