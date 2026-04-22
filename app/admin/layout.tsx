import AdminShell from './AdminShell';

export const metadata = {
  title: 'Admin — Portfolio CMS',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
