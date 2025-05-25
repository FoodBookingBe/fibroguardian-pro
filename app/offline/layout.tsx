import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Offline | FibroGuardian',
    description: 'U bent momenteel offline. Sommige functies zijn mogelijk beperkt beschikbaar.'
};

export default function OfflineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
