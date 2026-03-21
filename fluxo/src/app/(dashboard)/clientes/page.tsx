import { getCustomersList } from "@/actions/customers"
import ClientesClient from "./ClientesClient"

export default async function ClientesPage() {
  const customers = await getCustomersList();
  return <ClientesClient initialData={customers} />;
}
