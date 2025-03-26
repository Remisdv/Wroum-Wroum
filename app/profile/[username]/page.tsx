import { Metadata } from 'next';
import ProfileContent from './profile-content';

export function generateStaticParams() {
  return [
    { username: 'JeanMichel' },
    { username: 'PabloCar' },
    { username: 'TheoPassion' }
  ];
}

export const metadata: Metadata = {
  title: 'Profil utilisateur - WROUM WROUM',
  description: 'Profil utilisateur sur le forum automobile WROUM WROUM',
};

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  return <ProfileContent username={params.username} />;
}