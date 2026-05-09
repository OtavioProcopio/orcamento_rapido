import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import type { MeiProfile } from "../types";
import { fileToBase64 } from "../utils/file";
import { maskCpfCnpj } from "../utils/document";
import { maskPhone, unmaskPhone } from "../utils/maskPhone";
import { profileSchema, type ProfileFormValues } from "../utils/profileSchema";

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
  const { profile, saveProfile, saved, loading, error } = useProfile();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      companyName: profile.companyName,
      document: profile.document ?? "",
      userName: profile.userName,
      phone: maskPhone(profile.phone),
      pixKey: profile.pixKey,
      logo: profile.logo ?? "",
    });
  }, [profile, reset]);

  const logo = useWatch({ control, name: "logo", defaultValue: "" });

  const onSubmit = async (values: ProfileFormValues) => {
    const nextProfile: MeiProfile = {
      companyName: values.companyName,
      document: values.document || undefined,
      userName: values.userName,
      phone: unmaskPhone(values.phone),
      pixKey: values.pixKey ?? "",
      logo: values.logo || undefined,
    };

    await saveProfile(nextProfile);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
        <div className="border-b border-white/10 px-6 py-5 md:px-8">
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200/80">
            Perfil
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Dados usados nos orçamentos
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Preencha as informações da sua empresa para personalizar o PDF com
            nome, contato, chave PIX e identidade visual.
          </p>
          {loading ? (
            <p className="mt-3 text-sm text-slate-400">Carregando perfil...</p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-rose-300">{error}</p>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
          className="px-6 py-6 md:px-8"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                PNG, JPG ou WebP. O arquivo será convertido e salvo localmente.
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void (async () => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setValue("logo", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      return;
                    }

                    const base64 = await fileToBase64(file);
                    setValue("logo", base64, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  })();
                }}
              />
            </label>

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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-emerald-300">
              {saved ? "Salvo com sucesso." : ""}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
