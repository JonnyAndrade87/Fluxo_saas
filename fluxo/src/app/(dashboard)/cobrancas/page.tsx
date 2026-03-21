import { getFilteredInvoices } from "@/actions/invoices"
import ReceivablesClient from "./ReceivablesClient"

export default async function CobrancasPage() {
  const invoices = await getFilteredInvoices();
  return <ReceivablesClient initialData={invoices} />;
}
