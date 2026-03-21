'use server';

import prisma from '@/lib/db';
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

  // Ensure task belongs to tenant
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.tenantId !== ctx.tenantId) {
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

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.tenantId !== ctx.tenantId) {
    throw new Error('Task not found or forbidden');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'canceled',
    }
  });

  revalidatePath('/historico');
  return { success: true, task: updated };
}
