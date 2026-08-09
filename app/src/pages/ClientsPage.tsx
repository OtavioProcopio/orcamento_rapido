import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useBudget } from "../hooks/useBudget";
import { useClients } from "../hooks/useClients";
import { maskCpfCnpj } from "../utils/document";
import { maskPhone, unmaskPhone } from "../utils/maskPhone";
import { clientSchema, type ClientFormValues } from "../utils/clientSchema";
import type { Client } from "../types";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";

const DEFAULT_VALUES: ClientFormValues = {
  name: "",
  document: "",
  address: "",
  email: "",
  phone: "",
  notes: "",
};

export const ClientsPage = () => {
  const navigate = useNavigate();
  const { clients, loading, error, addClient, updateClient, deleteClient } =
    useClients();
  const { budgets } = useBudget();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string; label: string } | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const budgetCountByClient = useMemo(() => {
    const counts = new Map<string, number>();
    budgets.forEach((budget) => {
      const clientId = budget.client.clientId;
      if (!clientId) {
        return;
      }
      counts.set(clientId, (counts.get(clientId) ?? 0) + 1);
    });
    return counts;
  }, [budgets]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.document, client.phone, client.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [clients, search]);

  const openCreateForm = () => {
    setEditingClient(null);
    reset(DEFAULT_VALUES);
    setFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      document: client.document ?? "",
      address: client.address ?? "",
      email: client.email ?? "",
      phone: client.phone ? maskPhone(client.phone) : "",
      notes: client.notes ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const onSubmit = async (values: ClientFormValues) => {
    const patch = {
      name: values.name,
      document: values.document || undefined,
      address: values.address || undefined,
      email: values.email || undefined,
      phone: values.phone ? unmaskPhone(values.phone) : undefined,
      notes: values.notes || undefined,
    };

    if (editingClient) {
      await updateClient(editingClient.id, patch);
    } else {
      await addClient({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...patch,
      });
    }

    closeForm();
  };

  const handleDeleteClient = (client: Client) => {
    setConfirmDelete({ id: client.id, label: client.name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) {
      return;
    }
    await deleteClient(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => {
          void navigate("/dashboard");
        }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <PageHeader
        title="Clientes"
        subtitle="Cadastre clientes para reaproveitar os dados na hora de montar orçamentos e acompanhar quantos orçamentos cada um já recebeu."
        actions={<Button onClick={openCreateForm}>Novo Cliente</Button>}
      />

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Carregando clientes...</p>
      ) : null}

      <div className="mt-6">
        <label className="block w-full max-w-md text-sm font-medium text-slate-300">
          Buscar cliente
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, documento, telefone ou email"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>
      </div>

      {formOpen ? (
        <form
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
          className="mt-6 rounded-[28px] border border-white/10 bg-white/4 p-6"
        >
          <h2 className="text-lg font-semibold text-white">
            {editingClient ? "Editar cliente" : "Novo cliente"}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-300">
              Nome
              <input
                className={fieldClassName}
                placeholder="Nome do cliente"
                {...register("name")}
              />
              {errors.name?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300">
              CPF / CNPJ
              <input
                className={fieldClassName}
                placeholder="Documento do cliente"
                {...register("document")}
                onChange={(event) => {
                  const masked = maskCpfCnpj(event.target.value);
                  event.target.value = masked;
                  setValue("document", masked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
              {errors.document?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.document.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300">
              Telefone
              <input
                className={fieldClassName}
                placeholder="(00) 00000-0000"
                {...register("phone")}
                onChange={(event) => {
                  const masked = maskPhone(event.target.value);
                  event.target.value = masked;
                  setValue("phone", masked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
              {errors.phone?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.phone.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300">
              Email
              <input
                className={fieldClassName}
                placeholder="cliente@email.com"
                {...register("email")}
              />
              {errors.email?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.email.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300 md:col-span-2">
              Endereço
              <input
                className={fieldClassName}
                placeholder="Endereço do cliente"
                {...register("address")}
              />
            </label>

            <label className="text-sm font-medium text-slate-300 md:col-span-2">
              Observações
              <textarea
                className={`${fieldClassName} min-h-24`}
                placeholder="Notas internas sobre o cliente"
                {...register("notes")}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingClient ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        {clients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
            <EmptyState
              title="Nenhum cliente cadastrado"
              description="Cadastre clientes para reaproveitar os dados na hora de montar orçamentos."
              action={
                <Button onClick={openCreateForm}>Cadastrar Cliente</Button>
              }
            />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
            <EmptyState
              title="Nenhum resultado encontrado"
              description="Tente buscar por outro nome, documento, telefone ou email."
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => {
              const budgetCount = budgetCountByClient.get(client.id) ?? 0;
              return (
                <article
                  key={client.id}
                  className="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.25)] transition hover:border-white/15 hover:bg-white/6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold text-white">
                      {client.name}
                    </h2>
                    <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
                      {budgetCount} orçamento{budgetCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-1 text-sm text-slate-300">
                    {client.document ? (
                      <span>CPF/CNPJ: {client.document}</span>
                    ) : null}
                    {client.phone ? (
                      <span>Telefone: {maskPhone(client.phone)}</span>
                    ) : null}
                    {client.email ? <span>Email: {client.email}</span> : null}
                    {client.address ? (
                      <span>Endereço: {client.address}</span>
                    ) : null}
                  </dl>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to={`/dashboard?clientId=${client.id}`}
                      className="text-sm font-medium text-blue-300 underline-offset-4 hover:underline"
                    >
                      Ver orçamentos
                    </Link>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => openEditForm(client)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteClient(client)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete ? (
        <ConfirmationDialog
          title="Excluir cliente"
          description={`Excluir o cliente ${confirmDelete.label}? Orçamentos já emitidos para ele continuam salvos no histórico.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      ) : null}
    </div>
  );
};
