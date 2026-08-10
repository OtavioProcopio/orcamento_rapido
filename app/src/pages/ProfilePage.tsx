import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useBudget } from "../hooks/useBudget";
import { useProfiles } from "../hooks/useProfiles";
import type { MeiProfile } from "../types";
import { fileToBase64, validateLogoFile } from "../utils/file";
import { maskCpfCnpj } from "../utils/document";
import { maskPhone, unmaskPhone } from "../utils/maskPhone";
import { profileSchema, type ProfileFormValues } from "../utils/profileSchema";
import { trackEvent } from "../utils/analytics";

const DEFAULT_VALUES: ProfileFormValues = {
  companyName: "",
  document: "",
  userName: "",
  phone: "",
  pixKey: "",
  logo: "",
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profiles, loading, error, addProfile, updateProfile, deleteProfile } =
    useProfiles();
  const { budgets } = useBudget();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MeiProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string; label: string } | null
  >(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const logo = useWatch({ control, name: "logo", defaultValue: "" });

  const openCreateForm = () => {
    setEditingProfile(null);
    reset(DEFAULT_VALUES);
    setFormOpen(true);
  };

  const openEditForm = (profile: MeiProfile) => {
    setEditingProfile(profile);
    reset({
      companyName: profile.companyName,
      document: profile.document ?? "",
      userName: profile.userName,
      phone: maskPhone(profile.phone),
      pixKey: profile.pixKey,
      logo: profile.logo ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProfile(null);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    const patch = {
      companyName: values.companyName,
      document: values.document || undefined,
      userName: values.userName,
      phone: unmaskPhone(values.phone),
      pixKey: values.pixKey ?? "",
      logo: values.logo || undefined,
    };

    if (editingProfile) {
      await updateProfile(editingProfile.id, patch);
    } else {
      await addProfile({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...patch,
      });
      trackEvent("profile-created");
    }

    closeForm();
  };

  const handleDeleteProfile = (profile: MeiProfile) => {
    setConfirmDelete({ id: profile.id, label: profile.companyName });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) {
      return;
    }
    await deleteProfile(confirmDelete.id);
    setConfirmDelete(null);
  };

  const budgetCountByProfile = useMemo(() => {
    const counts = new Map<string, number>();
    budgets.forEach((budget) => {
      if (!budget.profileId) {
        return;
      }
      counts.set(budget.profileId, (counts.get(budget.profileId) ?? 0) + 1);
    });
    return counts;
  }, [budgets]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
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
        title="Empresas"
        subtitle="Cadastre uma ou mais empresas/perfis. No Construtor de Orçamento você escolhe qual empresa emite cada orçamento."
        actions={<Button onClick={openCreateForm}>Nova Empresa</Button>}
      />

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Carregando empresas...</p>
      ) : null}

      {formOpen ? (
        <form
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
          className="mt-6 rounded-[28px] border border-white/10 bg-white/4 p-6"
        >
          <h2 className="text-lg font-semibold text-white">
            {editingProfile ? "Editar empresa" : "Nova empresa"}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-300">
              Nome da Empresa
              <input
                className={fieldClassName}
                placeholder="Sua empresa"
                {...register("companyName")}
              />
              {errors.companyName?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.companyName.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300">
              Nome do Profissional
              <input
                className={fieldClassName}
                placeholder="Seu nome"
                {...register("userName")}
              />
              {errors.userName?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.userName.message}
                </span>
              ) : null}
            </label>

            <label className="text-sm font-medium text-slate-300">
              CPF / CNPJ
              <input
                className={fieldClassName}
                placeholder="Documento da empresa ou profissional"
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
              WhatsApp / Telefone
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
              Chave Pix
              <input
                className={fieldClassName}
                placeholder="contato@empresa.com"
                {...register("pixKey")}
              />
              {errors.pixKey?.message ? (
                <span className="mt-2 block text-xs text-rose-300">
                  {errors.pixKey.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="mt-6">
            <span className="text-sm font-medium text-slate-300">
              Logo da empresa
            </span>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/3 px-6 py-8 text-center transition hover:border-blue-400/40 hover:bg-white/5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-200">
                <Upload size={22} />
              </span>
              <span className="mt-4 text-base font-semibold text-white">
                Enviar imagem da logo
              </span>
              <span className="mt-2 text-sm text-slate-400">
                PNG, JPG, WebP ou SVG, até 1MB. O arquivo será convertido e
                salvo localmente.
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(event) => {
                  void (async () => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      clearErrors("logo");
                      setValue("logo", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      return;
                    }

                    const validationError = validateLogoFile(file);
                    if (validationError) {
                      setError("logo", {
                        type: "manual",
                        message: validationError,
                      });
                      event.target.value = "";
                      return;
                    }

                    clearErrors("logo");
                    const base64 = await fileToBase64(file);
                    setValue("logo", base64, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  })();
                }}
              />
            </label>

            {errors.logo?.message ? (
              <span className="mt-2 block text-xs text-rose-300">
                {errors.logo.message}
              </span>
            ) : null}

            {logo ? (
              <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  Preview da logo
                </p>
                <img
                  src={logo}
                  alt="Pré-visualização da logo"
                  className="max-h-36 rounded-2xl border border-white/10 bg-white object-contain p-3"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingProfile ? "Salvar alterações" : "Cadastrar empresa"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        {profiles.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/3 p-3">
            <EmptyState
              title="Nenhuma empresa cadastrada"
              description="Cadastre os dados da sua empresa para começar a emitir orçamentos."
              action={
                <Button onClick={openCreateForm}>Cadastrar Empresa</Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => {
              const budgetCount = budgetCountByProfile.get(profile.id) ?? 0;
              return (
                <article
                  key={profile.id}
                  className="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.25)] transition hover:border-white/15 hover:bg-white/6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {profile.logo ? (
                        <img
                          src={profile.logo}
                          alt={`Logo de ${profile.companyName}`}
                          className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-white object-contain p-1"
                        />
                      ) : null}
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          {profile.companyName}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {profile.userName}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {budgetCount} orçamento{budgetCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-1 text-sm text-slate-300">
                    {profile.document ? (
                      <span>CPF/CNPJ: {profile.document}</span>
                    ) : null}
                    <span>Telefone: {maskPhone(profile.phone)}</span>
                    {profile.pixKey ? <span>Pix: {profile.pixKey}</span> : null}
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to={`/dashboard?profileId=${profile.id}`}
                      className="text-sm font-medium text-blue-300 underline-offset-4 hover:underline"
                    >
                      Ver orçamentos
                    </Link>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => openEditForm(profile)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteProfile(profile)}
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
          title="Excluir empresa"
          description={`Excluir a empresa ${confirmDelete.label}? Orçamentos já emitidos por ela continuam salvos no histórico.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      ) : null}
    </div>
  );
};
