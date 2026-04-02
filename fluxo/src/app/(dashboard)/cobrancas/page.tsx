import { getFilteredInvoices } from "@/actions/invoices"
import ReceivablesClient from "./ReceivablesClient"

export default async function CobrancasPage() {
  const result = await getFilteredInvoices();
  return <ReceivablesClient initialData={result.invoices} initialTotalPages={result.totalPages} />;
}
