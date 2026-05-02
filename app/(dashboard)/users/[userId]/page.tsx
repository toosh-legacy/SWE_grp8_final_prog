import PublicProfileView from '@/components/PublicProfileView';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileView targetUserId={userId} />;
}
