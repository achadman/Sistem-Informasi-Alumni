import { toast } from 'sonner';

export const notify = {
  success: (message) => toast.success(message, {
    className: 'font-bold text-sm rounded-2xl shadow-xl border-slate-100',
  }),
  error: (message) => toast.error(message, {
    className: 'font-bold text-sm rounded-2xl shadow-xl border-slate-100',
  }),
  info: (message) => toast(message, {
    className: 'font-bold text-sm rounded-2xl shadow-xl border-slate-100',
  }),
  loading: (message) => toast.loading(message, {
    className: 'font-bold text-sm rounded-2xl shadow-xl border-slate-100',
  }),
  dismiss: () => toast.dismiss(),
};
