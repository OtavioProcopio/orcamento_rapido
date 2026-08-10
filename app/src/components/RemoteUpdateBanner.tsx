type RemoteUpdateBannerProps = {
  label: string;
  onRefresh: () => void;
};

export const RemoteUpdateBanner = ({ label, onRefresh }: RemoteUpdateBannerProps) => (
  <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
    <span>{label}</span>
    <button
      type="button"
      onClick={onRefresh}
      className="ml-auto text-xs font-semibold uppercase tracking-wide text-amber-200 underline-offset-4 hover:underline"
    >
      Atualizar agora
    </button>
  </div>
);
